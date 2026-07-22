/**
 * @repo/storage — backend-agnostic storage facade.
 *
 * A single `StorageBackend` is registered at process startup via
 * `setStorageBackend(...)`. Callers use the free functions below
 * (`uploadBuffer`, `getObjectBuffer`, `createBucket`, …) without caring which
 * backend is active. If no backend is registered, `getStorageBackend()`
 * throws — there is no implicit default, because picking the wrong backend
 * silently is worse than failing loudly at boot.
 *
 * Currently the only backend shipped is `filesystemBackend` (used by the
 * Electrobun desktop host). A MinIO/S3 backend can be re-added later by
 * implementing `StorageBackend` and registering it from a server host.
 *
 * The desktop host wires this up in apps/desktop/src/bun/main.ts:
 *
 *   setFilesystemRoot(storageDir);
 *   setStorageBackend(filesystemBackend);
 */
import { getStorageBackend } from "./registry.js";

// Registry + backends — hosts register/swap at startup.
export {
  setStorageBackend,
  setDefaultStorageBackend,
  hasStorageBackend,
  getStorageBackend,
} from "./registry.js";
export {
  filesystemBackend,
  setFilesystemRoot,
  hasFilesystemRoot,
} from "./backends/filesystem.js";

// Interface types — backend authors import these.
export type {
  StorageBackend,
  StorageObject,
  UploadBufferArgs,
  UploadFromUrlArgs,
  UploadResult,
  UploadFromUrlResult,
  GetObjectArgs,
  DeleteObjectArgs,
} from "./interface.js";

// ============================================================================
// Storage operations — each delegates to the active backend.
// ============================================================================

/** Create a bucket if it does not already exist. Idempotent. */
export async function createBucket(bucket: string): Promise<void> {
  return getStorageBackend().createBucket(bucket);
}

/** Delete an empty bucket. */
export async function deleteBucket(bucket: string): Promise<void> {
  return getStorageBackend().deleteBucket(bucket);
}

/** List objects in a bucket. */
export async function listBucketObjects(
  bucket: string,
): Promise<import("./interface.js").StorageObject[]> {
  return getStorageBackend().listBucketObjects(bucket);
}

/** Upload a `Buffer`. Binary-safe. */
export async function uploadBuffer(
  args: import("./interface.js").UploadBufferArgs,
) {
  return getStorageBackend().uploadBuffer(args);
}

/** Fetch a remote URL, buffer it, and upload. */
export async function uploadFromUrl(
  args: import("./interface.js").UploadFromUrlArgs,
) {
  return getStorageBackend().uploadFromUrl(args);
}

/** Download an object as a raw `Buffer`. Binary-safe. */
export async function getObjectBuffer(
  args: import("./interface.js").GetObjectArgs,
) {
  return getStorageBackend().getObjectBuffer(args);
}

/** Stream an object's body. */
export async function getObjectStream(
  args: import("./interface.js").GetObjectArgs,
) {
  return getStorageBackend().getObjectStream(args);
}

/** Download an object and decode as UTF-8 text. */
export async function getObjectText(
  args: import("./interface.js").GetObjectArgs,
) {
  return getStorageBackend().getObjectText(args);
}

/** Delete an object. */
export async function deleteObject(
  args: import("./interface.js").DeleteObjectArgs,
) {
  return getStorageBackend().deleteObject(args);
}
