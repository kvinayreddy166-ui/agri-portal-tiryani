// =====================================================================
// AGRONIX Knowledge Base — client utilities
// =====================================================================

export const KNOWLEDGE_MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const KNOWLEDGE_ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt'];
export const KNOWLEDGE_ALLOWED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export function getExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function validateKnowledgeFile(file: File): string | null {
  if (file.size === 0) return 'The selected file is empty.';
  if (file.size > KNOWLEDGE_MAX_FILE_SIZE) {
    return `File is too large. Maximum size is ${Math.round(KNOWLEDGE_MAX_FILE_SIZE / (1024 * 1024))} MB.`;
  }
  const ext = getExtension(file.name);
  if (!KNOWLEDGE_ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file type ".${ext}". Only PDF, DOCX and TXT are supported.`;
  }
  return null;
}

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Lightweight language detection for en/te/hi
export function detectLanguage(text: string): 'en' | 'te' | 'hi' {
  const teRange = /[\u0C00-\u0C7F]/;
  const hiRange = /[\u0900-\u097F]/;
  if (teRange.test(text)) return 'te';
  if (hiRange.test(text)) return 'hi';
  return 'en';
}
