import type { AuthenticatedUser, Env, HealthResponse, UploadResponse } from './types';

/**
 * Checks R2 bucket connectivity
 */
export async function probeR2Health(env: Env): Promise<HealthResponse> {
  const timestamp = new Date().toISOString();
  try {
    if (!env.OFFICER_RECORDS_BUCKET) {
      return {
        status: 'unhealthy',
        bucket: 'agronix-officer-records',
        connected: false,
        timestamp,
        error: 'R2 bucket binding OFFICER_RECORDS_BUCKET is missing',
      };
    }

    // Ping the bucket by listing at most 1 item
    await env.OFFICER_RECORDS_BUCKET.list({ limit: 1 });

    return {
      status: 'healthy',
      bucket: 'agronix-officer-records',
      connected: true,
      timestamp,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      bucket: 'agronix-officer-records',
      connected: false,
      timestamp,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Compute SHA-256 hex string from ArrayBuffer
 */
export async function computeBufferSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface PutDocumentParams {
  bytes: ArrayBuffer;
  filename: string;
  documentId: string;
  documentNumber?: string;
  category: string;
  sourceModule: string;
  mimeType: string;
  originalSize: number;
  storedSize?: number;
  compressionMethod?: string;
  compressionStatus: string;
  originalSha256?: string;
  storedSha256?: string;
  year?: string;
  month?: string;
}

/**
 * Uploads a document to Cloudflare R2 under the officer's private path.
 * Supports opaque UUID format: `officers/${userId}/${year}/${month}/${documentId}.${ext}`
 */
export async function uploadDocumentToR2(
  env: Env,
  user: AuthenticatedUser,
  params: PutDocumentParams
): Promise<UploadResponse> {
  const {
    bytes,
    filename,
    documentId,
    documentNumber,
    category,
    sourceModule,
    mimeType,
    originalSize,
    compressionMethod = 'none',
    compressionStatus,
    originalSha256,
    year,
    month,
  } = params;

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const ext = sanitizedFilename.split('.').pop() || 'pdf';

  // Construct secure opaque R2 object key
  const objectKey = year && month
    ? `officers/${user.id}/${year}/${month}/${documentId}.${ext}`
    : `officers/${user.id}/${documentId}/${sanitizedFilename}`;

  const storedSize = bytes.byteLength;
  const storedSha256 = params.storedSha256 || await computeBufferSha256(bytes);
  const finalOriginalSha256 = originalSha256 || (compressionMethod === 'none' ? storedSha256 : '');

  const customMetadata: Record<string, string> = {
    userId: user.id,
    userEmail: user.email,
    documentId,
    documentNumber: documentNumber || '',
    category,
    sourceModule,
    originalFilename: sanitizedFilename,
    originalMimeType: mimeType,
    originalSize: String(originalSize),
    storedSize: String(storedSize),
    compressionMethod,
    compressionStatus,
    originalSha256: finalOriginalSha256,
    storedSha256,
    uploadedAt: new Date().toISOString(),
  };

  const r2Object = await env.OFFICER_RECORDS_BUCKET.put(objectKey, bytes, {
    httpMetadata: {
      contentType: compressionMethod === 'gzip' ? 'application/gzip' : mimeType,
      contentDisposition: `inline; filename="${sanitizedFilename}"`,
    },
    customMetadata,
  });

  return {
    success: true,
    objectKey,
    filename: sanitizedFilename,
    storedSize,
    originalSize,
    contentHash: storedSha256,
    originalSha256: finalOriginalSha256,
    storedSha256,
    compressionMethod,
    compressionStatus,
    mimeType,
    etag: r2Object ? r2Object.httpEtag : undefined,
  };
}

/**
 * Streams an object from Cloudflare R2
 */
export async function getDocumentFromR2(
  env: Env,
  objectKey: string
): Promise<R2ObjectBody | null> {
  const object = await env.OFFICER_RECORDS_BUCKET.get(objectKey);
  return object;
}

/**
 * Deletes an object from Cloudflare R2
 */
export async function deleteDocumentFromR2(
  env: Env,
  objectKey: string
): Promise<boolean> {
  await env.OFFICER_RECORDS_BUCKET.delete(objectKey);
  return true;
}
