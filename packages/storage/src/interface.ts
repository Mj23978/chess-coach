/**
 * StorageBackend — the abstract interface every storage implementation
 * (MinIO/S3 for web/server, filesystem for desktop) must satisfy.
 *
 * This formalizes the function signatures that previously lived as free
 * functions in `index.ts`. Callers go through the thin facade in `index.ts`
 * (which delegates to the active backend registered in `registry.ts`), so
 * they never see this interface directly — but implementations do.
 *
 * The interface is intentionally minimal: bucket + key oriented, Buffer-based
 * for binary safety, and free of any provider-specific types (no S3 `_Object`,
 * no AWS SDK imports). Each backend maps its native shape onto `StorageObject`.
 */

/** Minimal object-listing row. Backends map their native listing shape onto this. */
export interface StorageObject {
  /** Object key (path within the bucket). */
  Key?: string;
  /** Object size in bytes, when known. */
  Size?: number;
  /** Last modification time, when known. */
  LastModified?: Date | string | null;
  /** MIME/content type, when the backend records it. */
  ContentType?: string | null;
}

export interface UploadBufferArgs {
  buffer: Buffer;
  key: string;
  bucket: string;
  contentType: string;
}

export interface UploadFromUrlArgs {
  sourceUrl: string;
  key: string;
  bucket: string;
  contentType?: string;
}

export interface GetObjectArgs {
  key: string;
  bucket: string;
}

export interface DeleteObjectArgs {
  key: string;
  bucket: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface UploadFromUrlResult extends UploadResult {
  buffer: Buffer;
}

/**
 * The contract every storage backend implements.
 *
 * Method semantics mirror the original free functions in `index.ts`:
 *  - `createBucket` is idempotent (a missing bucket is created; an existing
 *    one is a no-op).
 *  - `deleteBucket` removes the bucket (best-effort on contents — see impls).
 *  - `uploadBuffer` is binary-safe and returns the canonical object URL.
 *  - `getObjectBuffer` returns raw bytes; `getObjectText` is the UTF-8 wrapper.
 *  - `getObjectStream` returns a web `ReadableStream<Uint8Array>` for large files.
 */
export interface StorageBackend {
  /** Create a bucket if it does not already exist. Idempotent. */
  createBucket(bucket: string): Promise<void>;

  /** Delete a bucket. Will fail if non-empty (backend-dependent). */
  deleteBucket(bucket: string): Promise<void>;

  /** List objects in a bucket. Returns `[]` when empty. */
  listBucketObjects(bucket: string): Promise<StorageObject[]>;

  /** Upload a `Buffer`. Binary-safe. Returns the canonical object URL + key. */
  uploadBuffer(args: UploadBufferArgs): Promise<UploadResult>;

  /** Fetch a remote URL, buffer it, and upload. Returns bytes too for hashing. */
  uploadFromUrl(args: UploadFromUrlArgs): Promise<UploadFromUrlResult>;

  /** Download an object as a raw `Buffer`. Binary-safe. */
  getObjectBuffer(args: GetObjectArgs): Promise<Buffer>;

  /** Stream an object's body as a web ReadableStream. For large files. */
  getObjectStream(args: GetObjectArgs): Promise<ReadableStream<Uint8Array>>;

  /** Download an object and decode as UTF-8 text. Text-only convenience. */
  getObjectText(args: GetObjectArgs): Promise<string>;

  /** Delete an object. Best-effort: a missing object is not an error. */
  deleteObject(args: DeleteObjectArgs): Promise<void>;
}
