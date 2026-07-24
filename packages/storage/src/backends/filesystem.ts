/**
 * Filesystem storage backend — for the Electrobun desktop host.
 *
 * Maps the bucket + key model onto a local directory tree rooted at an
 * injected `appData` path:
 *   - `bucket` → directory `<root>/<bucket>/`
 *   - `key`    → relative file path within the bucket directory (parent dirs
 *                are created as needed).
 *
 * This package deliberately does NOT import Electrobun — the root is injected
 * via `setFilesystemRoot(path)` so the desktop Bun main can wire it to
 * `Utils.paths.userData + "/storage"` at boot, and tests can point it at a
 * temp dir.
 *
 * The implementation mirrors MinIO semantics:
 *  - `createBucket` is idempotent (`mkdir -p`).
 *  - `deleteBucket` removes the directory and its contents (recursive).
 *  - `uploadBuffer` is binary-safe (`fs.writeFile` preserves bytes exactly).
 *  - `deleteObject` is best-effort (a missing file is logged, not thrown) —
 *    matching the S3 backend's swallow-on-delete behavior so `assetStorage`
 *    cascade deletes behave identically.
 */
import { promises as fs } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { Readable } from "node:stream";
import type {
  StorageBackend,
  StorageObject,
  UploadBufferArgs,
  UploadFromUrlArgs,
  UploadResult,
  UploadFromUrlResult,
  GetObjectArgs,
  DeleteObjectArgs,
} from "../interface.js";

let _root: string | null = null;

/**
 * Set the root directory under which all filesystem buckets are stored.
 * Must be called before any storage operation. The desktop host calls this
 * once at startup with `Utils.paths.userData + "/storage"`.
 */
export function setFilesystemRoot(path: string): void {
  _root = path;
}

/** True once a root has been injected. */
export function hasFilesystemRoot(): boolean {
  return _root !== null;
}

function root(): string {
  if (!_root) {
    throw new Error(
      "[storage:filesystem] No root directory set. Call setFilesystemRoot() before using the filesystem backend."
    );
  }
  return _root;
}

/** Resolve a (bucket, key) pair to an absolute filesystem path. */
function bucketDir(bucket: string): string {
  return join(root(), bucket);
}

function objectPath(args: { bucket: string; key: string }): string {
  return join(bucketDir(args.bucket), args.key);
}

/**
 * Reject keys that would escape the bucket directory (`..`, absolute paths,
 * drive roots). This is the single security-critical check: without it a
 * crafted key could write/read outside the bucket.
 */
function assertKeySafe(bucket: string, key: string): void {
  const abs = objectPath({ bucket, key });
  const dir = bucketDir(bucket);
  const rel = relative(dir, abs);
  // `relative` returns a path starting with `..` or an absolute path on escape.
  if (rel.startsWith("..") || sep === "/" ? rel.startsWith("/") : /^[A-Za-z]:[\\/]/.test(rel)) {
    throw new Error(
      `[storage:filesystem] Unsafe key "${key}" escapes bucket "${bucket}"`
    );
  }
}

/** Build the canonical URL for an object. Uses `file://` so the webview fetches bytes directly. */
function buildObjectUrl(bucket: string, key: string): string {
  // Convert backslashes to forward slashes for a valid URL on Windows.
  const p = objectPath({ bucket, key }).split(sep).join("/");
  return `file://${p}`;
}

/** Walk a directory recursively and yield file paths (relative to `dir`). */
async function* walk(
  dir: string
): AsyncGenerator<{ abs: string; rel: string }> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // dir doesn't exist → empty listing
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(abs);
    } else if (entry.isFile()) {
      // path relative to the bucket dir, using forward slashes for S3 parity
      yield { abs, rel: abs.slice(dir.length + 1).split(sep).join("/") };
    }
  }
}

export const filesystemBackend: StorageBackend = {
  /** `mkdir -p` the bucket directory. Idempotent. */
  async createBucket(bucket: string): Promise<void> {
    await fs.mkdir(bucketDir(bucket), { recursive: true });
  },

  /** Recursively remove the bucket directory. */
  async deleteBucket(bucket: string): Promise<void> {
    try {
      await fs.rm(bucketDir(bucket), { recursive: true, force: true });
    } catch (error) {
      console.error(
        `[storage:filesystem] Error deleting bucket "${bucket}":`,
        error
      );
      throw error;
    }
  },

  /** Recursively list files in a bucket as `StorageObject` rows. */
  async listBucketObjects(bucket: string): Promise<StorageObject[]> {
    const dir = bucketDir(bucket);
    const out: StorageObject[] = [];
    for await (const { abs, rel } of walk(dir)) {
      let stat;
      try {
        stat = await fs.stat(abs);
      } catch {
        continue; // race: file deleted between walk + stat
      }
      out.push({
        Key: rel,
        Size: stat.size,
        LastModified: stat.mtime,
        ContentType: null,
      });
    }
    return out;
  },

  /** Write a buffer to disk. Binary-safe (`fs.writeFile` preserves bytes). */
  async uploadBuffer(args: UploadBufferArgs): Promise<UploadResult> {
    const { buffer, key, bucket, contentType } = args;
    assertKeySafe(bucket, key);
    const target = objectPath({ bucket, key });
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    // ContentType isn't recorded on the filesystem; the DB row (assets table)
    // stores mimeType, so this is purely informational here.
    void contentType;
    return { url: buildObjectUrl(bucket, key), key };
  },

  /** Fetch a remote URL, buffer it, write to disk. Returns bytes for hashing. */
  async uploadFromUrl(args: UploadFromUrlArgs): Promise<UploadFromUrlResult> {
    const { sourceUrl, key, bucket, contentType } = args;
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(
        `[storage:filesystem] uploadFromUrl: fetch failed (${response.status}) for ${sourceUrl}`
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resolvedContentType =
      contentType ??
      response.headers.get("content-type") ??
      "application/octet-stream";

    const { url } = await this.uploadBuffer({
      buffer,
      key,
      bucket,
      contentType: resolvedContentType,
    });

    return { url, key, buffer };
  },

  /** Read an object as a raw Buffer. Binary-safe. */
  async getObjectBuffer(args: GetObjectArgs): Promise<Buffer> {
    const { key, bucket } = args;
    assertKeySafe(bucket, key);
    try {
      return await fs.readFile(objectPath({ bucket, key }));
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        throw new Error(`[storage:filesystem] Object not found: ${bucket}/${key}`);
      }
      throw error;
    }
  },

  /** Stream a file as a web ReadableStream. */
  async getObjectStream(
    args: GetObjectArgs
  ): Promise<ReadableStream<Uint8Array>> {
    const { key, bucket } = args;
    assertKeySafe(bucket, key);
    const target = objectPath({ bucket, key });
    // Verify existence first so the error shape matches other backends.
    try {
      await fs.stat(target);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        throw new Error(`[storage:filesystem] Object not found: ${bucket}/${key}`);
      }
      throw error;
    }
    const nodeStream = (await import("node:fs")).createReadStream(target);
    return Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;
  },

  /** Read an object and decode as UTF-8 text. */
  async getObjectText(args: GetObjectArgs): Promise<string> {
    const buffer = await this.getObjectBuffer(args);
    return buffer.toString("utf-8");
  },

  /** Remove a file. Best-effort: a missing file is logged, not thrown. */
  async deleteObject(args: DeleteObjectArgs): Promise<void> {
    const { key, bucket } = args;
    assertKeySafe(bucket, key);
    const target = objectPath({ bucket, key });
    try {
      await fs.unlink(target);
    } catch (error: any) {
      // Mirror the MinIO backend, which logs + rethrows. But ENOENT (already
      // gone) is treated as success — the caller (assetStorage cascade
      // delete) explicitly wants a missing object to not block the DB delete.
      if (error?.code === "ENOENT") {
        return;
      }
      console.error(
        `[storage:filesystem] Error deleting object ${bucket}/${key}:`,
        error
      );
      throw error;
    }
  },
};
