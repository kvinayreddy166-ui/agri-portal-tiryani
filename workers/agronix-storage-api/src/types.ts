export interface Env {
  OFFICER_RECORDS_BUCKET: R2Bucket;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
  ADMIN_EMAIL?: string;
  SUPABASE_JWT_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
  isAdmin: boolean;
}

export interface UploadResponse {
  success: boolean;
  objectKey: string;
  filename: string;
  storedSize: number;
  originalSize: number;
  contentHash: string;
  originalSha256?: string;
  storedSha256?: string;
  compressionMethod?: string;
  compressionStatus: string;
  mimeType: string;
  etag?: string;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  bucket: string;
  connected: boolean;
  timestamp: string;
  error?: string;
}
