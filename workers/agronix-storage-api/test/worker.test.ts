import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index';
import type { Env } from '../src/types';

describe('agronix-storage-api Worker', () => {
  let mockEnv: Env;
  let mockBucketStorage: Map<string, { body: ArrayBuffer; customMetadata: Record<string, string>; httpMetadata: Record<string, string> }>;

  // Helper to generate a dummy JWT
  function createTestJwt(payload: Record<string, unknown>): string {
    const header = { alg: 'none', typ: 'JWT' };
    const b64 = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    return `${b64(header)}.${b64(payload)}.fake-sig`;
  }

  const officerA = { sub: 'officer-a-111', email: 'officer.a@telangana.gov.in', exp: Math.floor(Date.now() / 1000) + 3600 };
  const officerB = { sub: 'officer-b-222', email: 'officer.b@telangana.gov.in', exp: Math.floor(Date.now() / 1000) + 3600 };
  const admin = { sub: 'admin-999', email: 'k.vinayreddy166@gmail.com', exp: Math.floor(Date.now() / 1000) + 3600 };
  const expiredUser = { sub: 'officer-exp', email: 'officer.exp@telangana.gov.in', exp: Math.floor(Date.now() / 1000) - 3600 };

  beforeEach(() => {
    mockBucketStorage = new Map();

    const mockBucket: unknown = {
      list: vi.fn(async () => ({ objects: [] })),
      put: vi.fn(async (key: string, value: ArrayBuffer, opts: any) => {
        mockBucketStorage.set(key, {
          body: value,
          customMetadata: opts?.customMetadata || {},
          httpMetadata: opts?.httpMetadata || {},
        });
        return { httpEtag: 'etag-123' };
      }),
      get: vi.fn(async (key: string) => {
        const item = mockBucketStorage.get(key);
        if (!item) return null;
        return {
          body: item.body,
          httpMetadata: item.httpMetadata,
          customMetadata: item.customMetadata,
          writeHttpMetadata: (headers: Headers) => {
            if (item.httpMetadata.contentType) {
              headers.set('Content-Type', item.httpMetadata.contentType);
            }
          },
        };
      }),
      delete: vi.fn(async (key: string) => {
        mockBucketStorage.delete(key);
      }),
    };

    mockEnv = {
      OFFICER_RECORDS_BUCKET: mockBucket as R2Bucket,
      ALLOWED_ORIGINS: '*',
      ADMIN_EMAIL: 'k.vinayreddy166@gmail.com',
    };
  });

  describe('Health Endpoint', () => {
    it('returns 200 with status healthy when R2 bucket is connected', async () => {
      const req = new Request('http://localhost/health');
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toMatchObject({
        status: 'healthy',
        bucket: 'agronix-officer-records',
        connected: true,
      });
    });

    it('returns 503 when R2 bucket fails connectivity', async () => {
      (mockEnv.OFFICER_RECORDS_BUCKET.list as any).mockRejectedValueOnce(new Error('R2 network failure'));
      const req = new Request('http://localhost/health');
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.status).toBe('unhealthy');
      expect(data.connected).toBe(false);
      expect(data.error).toContain('R2 network failure');
    });
  });

  describe('Authentication & Security', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = new Request('http://localhost/api/documents/upload', { method: 'POST' });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('rejects expired JWT with 401', async () => {
      const token = createTestJwt(expiredUser);
      const req = new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(401);
    });

    it('rejects invalid or malformed JWT with 401', async () => {
      const req = new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer not-a-valid-token' },
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(401);
    });
  });

  describe('Officer Tenant Isolation', () => {
    const officerAKey = 'officers/officer-a-111/doc-1/test.pdf';
    const officerBKey = 'officers/officer-b-222/doc-2/test.pdf';

    beforeEach(() => {
      mockBucketStorage.set(officerAKey, {
        body: new Uint8Array([1, 2, 3]).buffer,
        customMetadata: { userId: officerA.sub },
        httpMetadata: { contentType: 'application/pdf' },
      });
      mockBucketStorage.set(officerBKey, {
        body: new Uint8Array([4, 5, 6]).buffer,
        customMetadata: { userId: officerB.sub },
        httpMetadata: { contentType: 'application/pdf' },
      });
    });

    it('allows Officer A to download Officer A documents', async () => {
      const token = createTestJwt(officerA);
      const req = new Request(`http://localhost/api/documents/download?key=${encodeURIComponent(officerAKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Disposition')).toContain('attachment');
    });

    it('blocks Officer A from accessing Officer B documents with 403 Forbidden', async () => {
      const token = createTestJwt(officerA);
      const req = new Request(`http://localhost/api/documents/download?key=${encodeURIComponent(officerBKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('blocks Officer A from deleting Officer B documents with 403 Forbidden', async () => {
      const token = createTestJwt(officerA);
      const req = new Request(`http://localhost/api/documents?key=${encodeURIComponent(officerBKey)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(403);
    });

    it('allows Portal Admin to access any officer documents', async () => {
      const token = createTestJwt(admin);
      const req = new Request(`http://localhost/api/documents/download?key=${encodeURIComponent(officerBKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
    });
  });

  describe('Document Upload & Preview', () => {
    it('uploads a document to the correct officer tenant path in R2', async () => {
      const token = createTestJwt(officerA);
      const content = new TextEncoder().encode('Test PDF content for Agronix');
      const req = new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/pdf',
          'x-filename': 'order_101.pdf',
          'x-document-id': 'doc-12345',
          'x-document-category': 'order',
          'x-source-module': 'stop_sale',
          'x-original-size': String(content.byteLength),
          'x-compression-status': 'compressed',
        },
        body: content,
      });

      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.objectKey).toBe('officers/officer-a-111/doc-12345/order_101.pdf');
      expect(data.storedSize).toBe(content.byteLength);
      expect(data.contentHash).toBeDefined();

      // Check R2 storage
      expect(mockBucketStorage.has('officers/officer-a-111/doc-12345/order_101.pdf')).toBe(true);
    });

    it('previews a document inline with proper Content-Disposition and Cache-Control', async () => {
      const key = 'officers/officer-a-111/doc-99/preview.pdf';
      mockBucketStorage.set(key, {
        body: new TextEncoder().encode('PDF Preview').buffer,
        customMetadata: { userId: officerA.sub },
        httpMetadata: { contentType: 'application/pdf' },
      });

      const token = createTestJwt(officerA);
      const req = new Request(`http://localhost/api/documents/preview?key=${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const res = await worker.fetch(req, mockEnv);
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Disposition')).toContain('inline; filename="preview.pdf"');
      expect(res.headers.get('Cache-Control')).toContain('max-age=300');
    });

    it('uploads with opaque year/month key and restores GZIP compressed documents on download', async () => {
      const rawText = 'GOVERNMENT NOTICE CONTENT RESTORATION TEST';
      const rawBytes = new TextEncoder().encode(rawText);

      // Gzip compress the text
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(rawBytes);
          controller.close();
        },
      });
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const compressedRes = new Response(compressedStream);
      const compressedBuffer = await compressedRes.arrayBuffer();

      const token = createTestJwt(officerA);
      const req = new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/pdf',
          'x-filename': 'statutory_order.pdf',
          'x-document-id': 'doc-uuid-999',
          'x-document-category': 'order',
          'x-source-module': 'stop_sale',
          'x-original-size': String(rawBytes.byteLength),
          'x-compression-method': 'gzip',
          'x-compression-status': 'compressed',
          'x-year': '2026',
          'x-month': '11',
        },
        body: compressedBuffer,
      });

      const uploadRes = await worker.fetch(req, mockEnv);
      expect(uploadRes.status).toBe(200);
      const uploadData = await uploadRes.json();
      expect(uploadData.objectKey).toBe('officers/officer-a-111/2026/11/doc-uuid-999.pdf');
      expect(uploadData.compressionMethod).toBe('gzip');

      // Now test GET /api/documents/download and verify it automatically decompresses
      const downloadReq = new Request(`http://localhost/api/documents/download?key=${encodeURIComponent(uploadData.objectKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const downloadRes = await worker.fetch(downloadReq, mockEnv);
      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers.get('x-restored-original')).toBe('true');
      expect(downloadRes.headers.get('Content-Disposition')).toContain('statutory_order.pdf');

      const downloadedText = await downloadRes.text();
      expect(downloadedText).toBe(rawText);
    });
  });
});
