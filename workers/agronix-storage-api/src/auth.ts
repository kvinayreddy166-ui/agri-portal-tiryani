import type { AuthenticatedUser, Env } from './types';

/**
 * Base64 URL decoding helper
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Validates a Supabase JWT and extracts user claims
 */
export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as {
      sub?: string;
      email?: string;
      role?: string;
      exp?: number;
    };

    if (!payload.sub) {
      return null;
    }

    // 1. Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === 'number' && payload.exp < now) {
      // Expired token
      return null;
    }

    // 2. Cryptographic signature check if SUPABASE_JWT_SECRET is provided
    if (env.SUPABASE_JWT_SECRET) {
      const isValid = await verifyJwtSignature(
        headerB64,
        payloadB64,
        signatureB64,
        env.SUPABASE_JWT_SECRET
      );
      if (!isValid) {
        return null;
      }
    }

    const adminEmail = (env.ADMIN_EMAIL || 'k.vinayreddy166@gmail.com').toLowerCase();
    const userEmail = (payload.email || '').toLowerCase();
    const isAdmin = userEmail === adminEmail;

    return {
      id: payload.sub,
      email: payload.email || '',
      role: payload.role || 'authenticated',
      isAdmin,
    };
  } catch (err) {
    console.error('JWT verification error:', err);
    return null;
  }
}

/**
 * Verify HMAC-SHA256 signature using Web Crypto
 */
async function verifyJwtSignature(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBinary = base64UrlToUint8Array(signatureB64);

    return await crypto.subtle.verify('HMAC', key, signatureBinary, data);
  } catch {
    return false;
  }
}

function base64UrlToUint8Array(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Enforces strict officer tenant isolation
 * - Officer A can only read, write, and delete keys starting with `officers/${user.id}/`
 * - Portal Admin can access all keys
 */
export function isUserAuthorizedForPath(
  user: AuthenticatedUser,
  objectKey: string
): boolean {
  if (user.isAdmin) {
    return true;
  }

  const cleanKey = objectKey.replace(/^\/+/, '');
  const expectedPrefix = `officers/${user.id}/`;

  return cleanKey.startsWith(expectedPrefix);
}
