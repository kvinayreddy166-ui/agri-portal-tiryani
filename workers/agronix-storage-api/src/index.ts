import { authenticateRequest, isUserAuthorizedForPath } from './auth';
import { deleteDocumentFromR2, getDocumentFromR2, probeR2Health, uploadDocumentToR2 } from './r2';
import type { Env } from './types';

/**
 * Cloudflare Worker entrypoint for agronix-storage-api
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = getCorsHeaders(origin, env.ALLOWED_ORIGINS);

    // Handle OPTIONS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // 1. Health Probe
      if (pathname === '/health' || pathname === '/api/health') {
        const health = await probeR2Health(env);
        return new Response(JSON.stringify(health), {
          status: health.connected ? 200 : 503,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // 2. Document Upload: POST /api/documents/upload
      if (pathname === '/api/documents/upload' && request.method === 'POST') {
        const user = await authenticateRequest(request, env);
        if (!user) {
          return jsonResponse({ error: 'Unauthorized: Valid Supabase JWT required' }, 401, corsHeaders);
        }

        const contentType = request.headers.get('content-type') || '';
        let bytes: ArrayBuffer;
        let filename: string;
        let documentId: string;
        let documentNumber: string | undefined;
        let category: string;
        let sourceModule: string;
        let mimeType: string;
        let originalSize: number;
        let compressionMethod: string;
        let compressionStatus: string;
        let originalSha256: string | undefined;
        let storedSha256: string | undefined;
        let year: string | undefined;
        let month: string | undefined;

        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          const file = formData.get('file') as File | null;
          if (!file) {
            return jsonResponse({ error: 'Missing file in form data' }, 400, corsHeaders);
          }

          bytes = await file.arrayBuffer();
          filename = (formData.get('filename') as string) || file.name || 'document.pdf';
          documentId = (formData.get('documentId') as string) || crypto.randomUUID();
          documentNumber = (formData.get('documentNumber') as string) || undefined;
          category = (formData.get('category') as string) || 'general';
          sourceModule = (formData.get('sourceModule') as string) || 'toolkit';
          mimeType = (formData.get('mimeType') as string) || file.type || 'application/pdf';
          originalSize = Number(formData.get('originalSize')) || bytes.byteLength;
          compressionMethod = (formData.get('compressionMethod') as string) || 'none';
          compressionStatus = (formData.get('compressionStatus') as string) || 'uncompressed';
          originalSha256 = (formData.get('originalSha256') as string) || undefined;
          storedSha256 = (formData.get('storedSha256') as string) || undefined;
          year = (formData.get('year') as string) || undefined;
          month = (formData.get('month') as string) || undefined;
        } else {
          // Direct binary upload via headers
          bytes = await request.arrayBuffer();
          filename = request.headers.get('x-filename') || 'document.pdf';
          documentId = request.headers.get('x-document-id') || crypto.randomUUID();
          documentNumber = request.headers.get('x-document-number') || undefined;
          category = request.headers.get('x-document-category') || 'general';
          sourceModule = request.headers.get('x-source-module') || 'toolkit';
          mimeType = request.headers.get('content-type') || 'application/pdf';
          originalSize = Number(request.headers.get('x-original-size')) || bytes.byteLength;
          compressionMethod = request.headers.get('x-compression-method') || 'none';
          compressionStatus = request.headers.get('x-compression-status') || 'uncompressed';
          originalSha256 = request.headers.get('x-original-sha256') || undefined;
          storedSha256 = request.headers.get('x-stored-sha256') || undefined;
          year = request.headers.get('x-year') || undefined;
          month = request.headers.get('x-month') || undefined;
        }

        if (bytes.byteLength === 0) {
          return jsonResponse({ error: 'Cannot upload empty file' }, 400, corsHeaders);
        }

        const uploadResult = await uploadDocumentToR2(env, user, {
          bytes,
          filename,
          documentId,
          documentNumber,
          category,
          sourceModule,
          mimeType,
          originalSize,
          compressionMethod,
          compressionStatus,
          originalSha256,
          storedSha256,
          year,
          month,
        });

        return jsonResponse(uploadResult, 200, corsHeaders);
      }

      // 3. Document Download: GET /api/documents/download?key=...
      if (pathname === '/api/documents/download' && request.method === 'GET') {
        const user = await authenticateRequest(request, env);
        if (!user) {
          return jsonResponse({ error: 'Unauthorized: Valid Supabase JWT required' }, 401, corsHeaders);
        }

        const objectKey = url.searchParams.get('key');
        if (!objectKey) {
          return jsonResponse({ error: 'Missing object key parameter' }, 400, corsHeaders);
        }

        // Officer tenant isolation
        if (!isUserAuthorizedForPath(user, objectKey)) {
          return jsonResponse({ error: 'Forbidden: You do not have permission to access this document' }, 403, corsHeaders);
        }

        const object = await getDocumentFromR2(env, objectKey);
        if (!object) {
          return jsonResponse({ error: 'Document not found in storage' }, 404, corsHeaders);
        }

        const raw = url.searchParams.get('raw') === 'true';
        const method = object.customMetadata?.compressionMethod;
        const originalFilename = object.customMetadata?.originalFilename || objectKey.split('/').pop() || 'document';
        const originalMime = object.customMetadata?.originalMimeType || 'application/pdf';

        const headers = new Headers();
        headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

        let responseBody: BodyInit = object.body;

        // Automatically decompress if GZIP compressed and raw was not requested
        if (!raw && method === 'gzip') {
          const stream = object.body instanceof ReadableStream
            ? object.body
            : new Response(object.body as BodyInit).body!;
          responseBody = stream.pipeThrough(new DecompressionStream('gzip'));
          headers.set('Content-Type', originalMime);
          headers.set('Content-Disposition', `attachment; filename="${originalFilename}"`);
          headers.set('x-original-sha256', object.customMetadata?.originalSha256 || '');
          headers.set('x-restored-original', 'true');
        } else {
          object.writeHttpMetadata(headers);
          headers.set('Content-Disposition', `attachment; filename="${originalFilename}"`);
        }

        appendCorsHeaders(headers, corsHeaders);

        return new Response(responseBody, {
          headers,
          status: 200,
        });
      }

      // 4. Document Preview: GET /api/documents/preview?key=...
      if (pathname === '/api/documents/preview' && request.method === 'GET') {
        const user = await authenticateRequest(request, env);
        if (!user) {
          return jsonResponse({ error: 'Unauthorized: Valid Supabase JWT required' }, 401, corsHeaders);
        }

        const objectKey = url.searchParams.get('key');
        if (!objectKey) {
          return jsonResponse({ error: 'Missing object key parameter' }, 400, corsHeaders);
        }

        // Officer tenant isolation
        if (!isUserAuthorizedForPath(user, objectKey)) {
          return jsonResponse({ error: 'Forbidden: You do not have permission to preview this document' }, 403, corsHeaders);
        }

        const object = await getDocumentFromR2(env, objectKey);
        if (!object) {
          return jsonResponse({ error: 'Document not found in storage' }, 404, corsHeaders);
        }

        const raw = url.searchParams.get('raw') === 'true';
        const method = object.customMetadata?.compressionMethod;
        const originalFilename = object.customMetadata?.originalFilename || objectKey.split('/').pop() || 'document.pdf';
        const originalMime = object.customMetadata?.originalMimeType || 'application/pdf';

        const headers = new Headers();
        headers.set('Cache-Control', 'private, max-age=300');

        let responseBody: BodyInit = object.body;

        // Automatically decompress if GZIP compressed and raw was not requested
        if (!raw && method === 'gzip') {
          const stream = object.body instanceof ReadableStream
            ? object.body
            : new Response(object.body as BodyInit).body!;
          responseBody = stream.pipeThrough(new DecompressionStream('gzip'));
          headers.set('Content-Type', originalMime);
          headers.set('Content-Disposition', `inline; filename="${originalFilename}"`);
          headers.set('x-original-sha256', object.customMetadata?.originalSha256 || '');
          headers.set('x-restored-original', 'true');
        } else {
          object.writeHttpMetadata(headers);
          headers.set('Content-Disposition', `inline; filename="${originalFilename}"`);
        }

        appendCorsHeaders(headers, corsHeaders);

        return new Response(responseBody, {
          headers,
          status: 200,
        });
      }

      // 5. Document Delete: DELETE /api/documents?key=...
      if (pathname === '/api/documents' && request.method === 'DELETE') {
        const user = await authenticateRequest(request, env);
        if (!user) {
          return jsonResponse({ error: 'Unauthorized: Valid Supabase JWT required' }, 401, corsHeaders);
        }

        const objectKey = url.searchParams.get('key');
        if (!objectKey) {
          return jsonResponse({ error: 'Missing object key parameter' }, 400, corsHeaders);
        }

        // Officer tenant isolation
        if (!isUserAuthorizedForPath(user, objectKey)) {
          return jsonResponse({ error: 'Forbidden: You do not have permission to delete this document' }, 403, corsHeaders);
        }

        await deleteDocumentFromR2(env, objectKey);
        return jsonResponse({ success: true, message: 'Document deleted from R2' }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
    } catch (err) {
      console.error('[Worker Error]', err);
      return jsonResponse(
        { error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) },
        500,
        corsHeaders
      );
    }
  },
};

/**
 * Returns CORS headers for allowed origins
 */
function getCorsHeaders(origin: string, allowedOriginsConfig?: string): HeadersInit {
  const defaultAllowed = ['https://agronix.vercel.app', 'http://localhost:5173', 'http://localhost:4173'];
  const allowedList = allowedOriginsConfig ? allowedOriginsConfig.split(',').map((s) => s.trim()) : defaultAllowed;

  const isAllowed = allowedList.includes(origin) || allowedList.includes('*') || origin.endsWith('.vercel.app');
  const allowOrigin = isAllowed ? origin : allowedList[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-filename, x-document-id, x-document-number, x-document-category, x-source-module, x-original-size, x-compression-status, x-compression-method, x-original-sha256, x-stored-sha256, x-year, x-month',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Type, x-original-sha256, x-restored-original, x-compression-method',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function appendCorsHeaders(target: Headers, corsHeaders: HeadersInit): void {
  for (const [key, value] of Object.entries(corsHeaders)) {
    target.set(key, value);
  }
}

function jsonResponse(data: unknown, status = 200, corsHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(corsHeaders || {}),
    },
  });
}
