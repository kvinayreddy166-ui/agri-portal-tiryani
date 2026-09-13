// =====================================================================
// knowledge-process — document processing pipeline (Edge Function)
// =====================================================================
// Steps: download file -> extract text per page -> detect scanned PDF ->
// clean -> semantic chunk (preserve page + section) -> batch embeddings
// via Ollama -> save chunks -> update job + document status.
// =====================================================================
import { createAdminClient, corsHeaders, EMBEDDING_BATCH_SIZE, EMBEDDING_DIM, errorResponse, json, OLLAMA_BASE_URL, OLLAMA_EMBEDDING_MODEL, verifyUser } from '../_shared/knowledge.ts';

interface ExtractedPage {
  pageNumber: number;
  text: string;
}

interface ChunkInput {
  document_id: string;
  chunk_index: number;
  chunk_text: string;
  page_number: number | null;
  page_end_number: number | null;
  section_heading: string | null;
  section_path: string | null;
  token_count: number | null;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------
// PDF extraction in Deno Edge Functions: raw content-stream parsing.
// No external dependencies (pdfjs-dist/unpdf pull in `canvas` native module
// which crashes Deno). This handles text-based PDFs reliably. For scanned
// PDFs, isLikelyScanned() flags them as OCR_REQUIRED.
async function extractPdf(bytes: Uint8Array): Promise<ExtractedPage[]> {
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);
  const pages: ExtractedPage[] = [];

  // Split by page objects: /Type /Page
  const pageParts = raw.split(/\/Type\s*\/Page[^s]/);
  // First part is the header/metadata, skip it
  for (let p = 1; p < pageParts.length; p++) {
    const pageContent = pageParts[p];
    let text = '';

    // Extract text from Tj and TJ operators inside BT...ET blocks
    // Tj: (text) Tj
    // TJ: [(text) num (text) num ...] TJ
    const btEtBlocks = pageContent.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btEtBlocks) {
      // Match (text) Tj
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      for (const m of tjMatches) {
        const t = m.match(/\(([^)]*)\)/);
        if (t) text += t[1] + ' ';
      }
      // Match [(text) num (text)] TJ
      const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
      for (const m of tjArrayMatches) {
        const parts = m.match(/\(([^)]*)\)/g) || [];
        for (const part of parts) {
          const t = part.match(/\(([^)]*)\)/);
          if (t) text += t[1];
        }
        text += ' ';
      }
    }

    // Unescape PDF string escapes
    text = text
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');

    pages.push({ pageNumber: p, text });
  }

  // If no pages detected (malformed PDF), return as single page
  if (pages.length === 0) {
    return [{ pageNumber: 1, text: '' }];
  }
  return pages;
}

async function extractDocx(bytes: Uint8Array): Promise<ExtractedPage[]> {
  // mammoth works in Deno via esm.sh; pass ArrayBuffer
  const mammoth = await import('https://esm.sh/mammoth@1.12.0');
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const result = await mammoth.extractRawText({ arrayBuffer: ab });
  return [{ pageNumber: 1, text: result.value }];
}

function extractTxt(bytes: Uint8Array): ExtractedPage[] {
  const text = new TextDecoder('utf-8').decode(bytes);
  return [{ pageNumber: 1, text }];
}

// ---------------------------------------------------------------------
// Scanned PDF detection
// ---------------------------------------------------------------------
function isLikelyScanned(pages: ExtractedPage[]): boolean {
  if (pages.length === 0) return false;
  const totalChars = pages.reduce((sum, p) => sum + p.text.trim().length, 0);
  const avg = totalChars / pages.length;
  // Less than ~50 meaningful chars per page strongly suggests image-only PDF
  return pages.length > 1 && avg < 50;
}

// ---------------------------------------------------------------------
// Text cleaning — conservative, preserves legal references
// ---------------------------------------------------------------------
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

// ---------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------
const SECTION_RE = /^(chapter\s+[ivxlcdm\d]+|part\s+[ivxlcdm\d]+|section\s+\d+[a-z]?|rule\s+\d+[a-z]?|clause\s*\(?[a-z\d]+\)?|schedule\s+[ivxlcdm\d]+|appendix\s+[ivxlcdm\d]+|annexure\s+[ivxlcdm\d]+|form\s+[a-z\d]+)/i;

function detectSection(line: string): string | null {
  const m = line.match(SECTION_RE);
  return m ? m[1] : null;
}

// ---------------------------------------------------------------------
// Semantic chunking
// ---------------------------------------------------------------------
function estimateTokens(text: string): number {
  // Rough: 1 token ~= 4 chars for English; be conservative for Indic scripts.
  return Math.ceil(text.length / 3.5);
}

function chunkPages(pages: ExtractedPage[], minTokens = 500, maxTokens = 1000, overlap = 100): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let currentText = '';
  let currentPage: number | null = null;
  let currentPageEnd: number | null = null;
  let currentSection: string | null = null;
  let sectionPath: string[] = [];
  let chunkIndex = 0;

  const flush = () => {
    const trimmed = currentText.trim();
    if (trimmed.length === 0) return;
    chunks.push({
      document_id: '',
      chunk_index: chunkIndex++,
      chunk_text: trimmed,
      page_number: currentPage,
      page_end_number: currentPageEnd,
      section_heading: currentSection,
      section_path: sectionPath.length ? sectionPath.join(' > ') : null,
      token_count: estimateTokens(trimmed),
      metadata: {},
    });
    // Keep overlap (last ~overlap tokens worth of text)
    const overlapText = trimmed.slice(-overlap * 4);
    currentText = overlapText;
  };

  for (const page of pages) {
    const lines = page.text.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const section = detectSection(line);
      if (section) {
        // Start new section: flush previous chunk
        if (currentText.trim().length > 0) flush();
        currentSection = section;
        // Build path: keep last 3 levels
        sectionPath = [...sectionPath, section].slice(-3);
      }

      if (currentPage === null) currentPage = page.pageNumber;
      currentPageEnd = page.pageNumber;

      currentText += (currentText ? '\n' : '') + line;

      if (estimateTokens(currentText) >= maxTokens) {
        flush();
        currentPage = page.pageNumber;
        currentPageEnd = page.pageNumber;
      }
    }
  }
  if (currentText.trim().length > 0 && estimateTokens(currentText) >= Math.min(minTokens, 100)) {
    flush();
  }
  return chunks;
}

// ---------------------------------------------------------------------
// Embeddings via Ollama (batched)
// ---------------------------------------------------------------------
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OLLAMA_BASE_URL) {
    throw new Error('Embedding service (Ollama) is not configured.');
  }
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, prompt: batch.join('\n\n') }),
    });
    if (!res.ok) throw new Error(`Ollama embeddings failed: ${res.status}`);
    const data = await res.json();
    // Ollama returns { embedding: number[] } for a single prompt.
    // For batched multi-prompt we send joined text -> single embedding per batch.
    // To get per-text embeddings, call once per text instead (slower but correct).
    all.push(data.embedding as number[]);
  }
  return all;
}

// Per-text embeddings (correct, one Ollama call per chunk)
async function generateEmbeddingsPerText(texts: string[]): Promise<number[][]> {
  if (!OLLAMA_BASE_URL) {
    throw new Error('Embedding service (Ollama) is not configured.');
  }
  const out: number[][] = [];
  for (const text of texts) {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBEDDING_MODEL, prompt: text.slice(0, 8000) }),
    });
    if (!res.ok) throw new Error(`Ollama embeddings failed: ${res.status}`);
    const data = await res.json();
    const emb = data.embedding as number[];
    if (!Array.isArray(emb) || emb.length !== EMBEDDING_DIM) {
      throw new Error(`Embedding dimension mismatch: got ${emb?.length}, expected ${EMBEDDING_DIM}. Check OLLAMA_EMBEDDING_MODEL matches RAG_EMBEDDING_DIM.`);
    }
    out.push(emb);
  }
  return out;
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createAdminClient();
    const { isAdmin } = await verifyUser(req, supabase);
    if (!isAdmin) return errorResponse('Admin access required.', 403);

    const { documentId } = await req.json();
    if (!documentId) return errorResponse('documentId is required.', 400);

    const { data: doc } = await supabase.from('knowledge_documents').select('*').eq('id', documentId).maybeSingle();
    if (!doc) return errorResponse('Document not found.', 404);

    // Create job
    const { data: job } = await supabase.from('knowledge_processing_jobs').insert({
      document_id: documentId,
      status: 'EXTRACTING',
      progress: 5,
      current_step: 'EXTRACTING',
      started_at: new Date().toISOString(),
    }).select().single();

    const updateJob = (patch: Record<string, unknown>) =>
      supabase.from('knowledge_processing_jobs').update(patch).eq('id', job.id);

    // Download file from storage
    const { data: fileData, error: dlError } = await supabase.storage.from('knowledge-documents').download(doc.file_path);
    if (dlError || !fileData) {
      await updateJob({ status: 'FAILED', error_message: 'Could not download file from storage.', completed_at: new Date().toISOString() });
      await supabase.from('knowledge_documents').update({ status: 'FAILED' }).eq('id', documentId);
      return errorResponse('Could not download file from storage.', 502);
    }
    const bytes = new Uint8Array(await fileData.arrayBuffer());

    // Extract
    let pages: ExtractedPage[] = [];
    const mime = doc.mime_type ?? '';
    if (mime === 'application/pdf' || doc.file_name.toLowerCase().endsWith('.pdf')) {
      try {
        pages = await extractPdf(bytes);
      } catch (e) {
        await updateJob({ status: 'FAILED', error_message: `PDF extraction failed: ${(e as Error).message}`, completed_at: new Date().toISOString() });
        await supabase.from('knowledge_documents').update({ status: 'FAILED' }).eq('id', documentId);
        return errorResponse('PDF extraction failed.', 422);
      }
    } else if (mime.includes('wordprocessingml') || doc.file_name.toLowerCase().endsWith('.docx')) {
      pages = await extractDocx(bytes);
    } else {
      pages = extractTxt(bytes);
    }

    // Scanned detection
    if ((doc.file_name.toLowerCase().endsWith('.pdf')) && isLikelyScanned(pages)) {
      await updateJob({ status: 'OCR_REQUIRED', error_message: 'PDF appears scanned/image-based and requires OCR.', completed_at: new Date().toISOString() });
      await supabase.from('knowledge_documents').update({ status: 'OCR_REQUIRED', page_count: pages.length }).eq('id', documentId);
      return json({ jobId: job.id, status: 'OCR_REQUIRED' });
    }

    // Clean
    await updateJob({ status: 'CLEANING', progress: 25, current_step: 'CLEANING' });
    pages = pages.map((p) => ({ ...p, text: cleanText(p.text) }));

    // Chunk
    await updateJob({ status: 'CHUNKING', progress: 40, current_step: 'CHUNKING' });
    let chunks = chunkPages(pages);
    chunks = chunks.map((c) => ({ ...c, document_id: documentId }));

    if (chunks.length === 0) {
      await updateJob({ status: 'FAILED', error_message: 'No text could be extracted for chunking.', completed_at: new Date().toISOString() });
      await supabase.from('knowledge_documents').update({ status: 'FAILED' }).eq('id', documentId);
      return errorResponse('No text could be extracted for chunking.', 422);
    }

    // Delete old chunks for this document (reprocess case)
    await supabase.from('knowledge_chunks').delete().eq('document_id', documentId);

    // Embeddings
    await updateJob({ status: 'GENERATING_EMBEDDINGS', progress: 50, current_step: 'GENERATING_EMBEDDINGS', total_chunks: chunks.length, processed_chunks: 0 });

    let embeddings: number[][] = [];
    let embeddingFailed = false;
    let embeddingError = '';
    try {
      embeddings = await generateEmbeddingsPerText(chunks.map((c) => c.chunk_text));
    } catch (e) {
      embeddingFailed = true;
      embeddingError = (e as Error).message;
    }

    // Save chunks (with or without embeddings — search still works via FTS)
    await updateJob({ status: 'SAVING', progress: 80, current_step: 'SAVING' });
    const rows = chunks.map((c, i) => ({
      document_id: c.document_id,
      chunk_index: c.chunk_index,
      chunk_text: c.chunk_text,
      page_number: c.page_number,
      page_end_number: c.page_end_number,
      section_heading: c.section_heading,
      section_path: c.section_path,
      token_count: c.token_count,
      metadata: c.metadata,
      embedding: embeddingFailed ? null : `[${(embeddings[i] ?? []).join(',')}]`,
    }));

    const { error: insertError } = await supabase.from('knowledge_chunks').insert(rows);
    if (insertError) {
      await updateJob({ status: 'FAILED', error_message: insertError.message, completed_at: new Date().toISOString() });
      await supabase.from('knowledge_documents').update({ status: 'FAILED' }).eq('id', documentId);
      return errorResponse('Failed to save chunks.', 500);
    }

    const finalStatus = embeddingFailed ? 'COMPLETED' : 'COMPLETED';
    await supabase.from('knowledge_documents').update({
      status: finalStatus,
      page_count: pages.length,
      chunk_count: chunks.length,
    }).eq('id', documentId);

    await updateJob({
      status: embeddingFailed ? 'FAILED' : 'COMPLETED',
      progress: 100,
      current_step: 'COMPLETED',
      processed_chunks: chunks.length,
      error_message: embeddingFailed ? `Embeddings skipped: ${embeddingError}. Keyword search still available.` : null,
      completed_at: new Date().toISOString(),
    });

    return json({ jobId: job.id, status: finalStatus, chunks: chunks.length, embeddings: embeddingFailed ? false : true });
  } catch (err) {
    console.error('knowledge-process error:', err);
    return errorResponse((err as Error).message || 'Processing failed.', 500);
  }
});
