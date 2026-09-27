import type { jsPDF as JsPdfInstance } from 'jspdf';

/**
 * Unicode font fallback for generated PDFs (jsPDF).
 *
 * Problem: the app's PDFs render user-entered Telugu text as mojibake / boxes
 * because the standard-14 and Latin TTF fonts registered in jsPDF have no
 * Telugu glyphs, and jsPDF does no font fallback by itself.
 *
 * Approach:
 *  - embed the bundled Noto Sans Telugu TTFs (public/fonts, OFL licensed)
 *  - transparently patch doc.text / doc.getStringUnitWidth / doc.splitTextToSize
 *    so any run containing Telugu characters is measured and drawn with the
 *    Telugu font while every other run keeps the caller's existing font
 *    (size, style, colour and layout are untouched)
 *  - reorder preposed Telugu matras (ి ె ే and the two-part ై ొ ో ౌ) before
 *    their consonant cluster, the standard fix for renderers without
 *    OpenType shaping
 *
 * DOCX note: Word files need no font embedding; Telugu runs just need a
 * complex-script (`w:cs`) font name — use DOCX_TELUGU_FONT.
 */

export const PDF_TELUGU_FONT = 'NotoSansTelugu';
export const DOCX_TELUGU_FONT = 'Nirmala UI';

const TELUGU_FONT_FILES = {
  normal: '/fonts/NotoSansTelugu-Regular.ttf',
  bold: '/fonts/NotoSansTelugu-Bold.ttf',
} as const;

const TELUGU_CHAR = /[\u0C00-\u0C7F]/;
const TELUGU_CONSONANT = /[\u0C15-\u0C39\u0C58-\u0C5A]/;
const TELUGU_VIRAMA = '\u0C4D';
// matras that are drawn to the LEFT of their consonant cluster: ి ె ే.
// Two-part matras additionally decompose into prebase + trailing parts.
const TELUGU_PREBASE_MATRA = new Set(['ి', 'ె', 'ే']);
const TELUGU_TWO_PART_MATRA: Record<string, string> = {
  'ై': 'ై', // U+0C48 → U+0C46 + U+0C56 (ai length mark)
  'ొ': 'ెా', // U+0C4A → U+0C46 + U+0C3E
  'ో': 'ేా', // U+0C4B → U+0C47 + U+0C3E
  'ౌ': 'ె౗', // U+0C4C → U+0C46 + U+0C57
};
const TELUGU_NEEDS_REORDER = /[ిెేైొోౌ]/;
const FALLBACK_PATCH_FLAG = '__unicodeFontFallback';

export function containsTelugu(text: unknown): boolean {
  return typeof text === 'string' && TELUGU_CHAR.test(text);
}

type TextRunPart = { text: string; telugu: boolean; raw?: string };

/** Split a string into maximal runs of Telugu / non-Telugu characters. */
function splitRuns(text: string): TextRunPart[] {
  const runs: TextRunPart[] = [];
  let telugu = TELUGU_CHAR.test(text.charAt(0));
  let buffer = '';
  for (const ch of text) {
    // ZWJ/ZWNJ ride along with the Telugu run so the shaper sees the cluster
    const isTelugu = TELUGU_CHAR.test(ch) || ch === '\u200C' || ch === '\u200D';
    if (isTelugu !== telugu && buffer) {
      runs.push({ text: buffer, telugu });
      buffer = '';
    }
    telugu = isTelugu;
    buffer += ch;
  }
  if (buffer) runs.push({ text: buffer, telugu });
  return runs;
}

/**
 * Reorder Telugu for renderers without OpenType shaping: decompose two-part
 * matras (ై ొ ో ౌ → prebase + trailing part) and move each preposed matra
 * (ి ె ే) in front of the consonant cluster it follows in logical order, so
 * it is drawn to the left of the consonant — exactly where it visually belongs.
 */
function reorderTeluguMatras(run: string): string {
  if (!TELUGU_NEEDS_REORDER.test(run)) return run;
  let expanded = '';
  for (const ch of run) expanded += TELUGU_TWO_PART_MATRA[ch] ?? ch;
  const out: string[] = [];
  for (const ch of expanded) {
    if (TELUGU_PREBASE_MATRA.has(ch)) {
      // Walk back over the consonant cluster the matra belongs to: virama and
      // joiners are transparent; a consonant belongs to the cluster if it is
      // the last char (the cluster base) or is followed by virama / ZWJ (a
      // conjunct member). ZWNJ is a hard boundary — the cluster ends after it.
      let j = out.length - 1;
      let clusterStart = out.length;
      while (j >= 0) {
        const c = out[j];
        if (c === TELUGU_VIRAMA || c === '\u200D') { j--; continue; }
        if (c === '\u200C') { j--; break; }
        if (
          TELUGU_CONSONANT.test(c) &&
          (j === out.length - 1 || out[j + 1] === TELUGU_VIRAMA || out[j + 1] === '\u200D')
        ) {
          clusterStart = j;
          j--;
          continue;
        }
        break;
      }
      out.splice(clusterStart, 0, ch);
    } else {
      out.push(ch);
    }
  }
  return out.join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(String.fromCharCode, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

interface TeluguFontData {
  base64: Record<string, string>;
  buffers: Record<string, ArrayBuffer>;
}

let teluguFontDataPromise: Promise<TeluguFontData> | null = null;

function loadTeluguFontData(): Promise<TeluguFontData> {
  if (!teluguFontDataPromise) {
    teluguFontDataPromise = Promise.all(
      Object.entries(TELUGU_FONT_FILES).map(async ([style, url]) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Telugu font fetch failed: ${url}`);
        const buffer = await response.arrayBuffer();
        return [style, { base64: arrayBufferToBase64(buffer), buffer }] as const;
      })
    )
      .then((entries) => {
        const base64: Record<string, string> = {};
        const buffers: Record<string, ArrayBuffer> = {};
        for (const [style, data] of entries) {
          base64[style] = data.base64;
          buffers[style] = data.buffer;
        }
        return { base64, buffers };
      })
      .catch((error) => {
        console.warn('Telugu PDF font unavailable:', error);
        return { base64: {}, buffers: {} };
      });
  }
  return teluguFontDataPromise;
}

/**
 * Minimal structural type for the fontkit API used here (fontkit is loaded
 * lazily so its ~500 KB bundle only ships when a PDF is generated).
 */
interface FontkitShaper {
  unitsPerEm: number;
  layout(text: string): {
    glyphs: Array<{ id: number; codePoints: number[] }>;
    positions: Array<{ xAdvance: number; yAdvance: number; xOffset: number; yOffset: number }>;
  };
}

type FontkitCreate = (data: unknown) => FontkitShaper;

const teluguShapers: { normal?: FontkitShaper; bold?: FontkitShaper } = {};
let teluguShaperPromise: Promise<void> | null = null;

/**
 * Loads fontkit and builds OpenType shapers for the Telugu TTFs. Shaping is
 * what produces conjuncts/ottulu and correctly positioned matras; jsPDF alone
 * renders one glyph per codepoint with no GSUB/GPOS processing.
 */
function loadTeluguShapers(buffers: Record<string, ArrayBuffer>): Promise<void> {
  if (!teluguShaperPromise) {
    teluguShaperPromise = import('fontkit')
      .then((mod) => {
        const create = ((mod as { default?: { create?: FontkitCreate } }).default?.create ??
          (mod as unknown as { create: FontkitCreate }).create) as FontkitCreate;
        for (const style of ['normal', 'bold'] as const) {
          if (buffers[style]) {
            try {
              teluguShapers[style] = create(new Uint8Array(buffers[style]));
            } catch (error) {
              console.warn(`Telugu shaper init failed (${style}):`, error);
            }
          }
        }
      })
      .catch((error) => {
        console.warn('Telugu OpenType shaper unavailable:', error);
      });
  }
  return teluguShaperPromise;
}

/**
 * Registers the bundled Telugu TTFs on the jsPDF document and installs the
 * Unicode font-fallback patch. Safe to call on every generated document;
 * per-instance patching is idempotent and font data is fetched once per
 * session from the bundled asset (works offline / PWA).
 */
export async function setupPdfUnicodeFonts(doc: JsPdfInstance): Promise<void> {
  installUnicodeFontFallback(doc);
  try {
    const fonts = await loadTeluguFontData();
    if (fonts.base64.normal) {
      doc.addFileToVFS('NotoSansTelugu-Regular.ttf', fonts.base64.normal);
      doc.addFont('NotoSansTelugu-Regular.ttf', PDF_TELUGU_FONT, 'normal');
    }
    if (fonts.base64.bold) {
      doc.addFileToVFS('NotoSansTelugu-Bold.ttf', fonts.base64.bold);
      doc.addFont('NotoSansTelugu-Bold.ttf', PDF_TELUGU_FONT, 'bold');
    }
    await loadTeluguShapers(fonts.buffers);
  } catch (error) {
    console.warn('Telugu PDF font registration skipped:', error);
  }
}

type SavedFont = { fontName: string; fontStyle: string };

function teluguStyleFor(fontStyle: string): 'normal' | 'bold' {
  return fontStyle.toLowerCase().includes('bold') ? 'bold' : 'normal';
}

/**
 * Patches the document so calls to text()/getTextWidth()/splitTextToSize()
 * handle mixed English+Telugu runs automatically. Non-Telugu text is passed
 * through to jsPDF untouched.
 */
function installUnicodeFontFallback(doc: JsPdfInstance): void {
  const anyDoc = doc as unknown as Record<string, unknown>;
  if (anyDoc[FALLBACK_PATCH_FLAG]) return;
  anyDoc[FALLBACK_PATCH_FLAG] = true;

  const origText = doc.text.bind(doc) as (...args: unknown[]) => unknown;
  const origGetStringUnitWidth = doc.getStringUnitWidth.bind(doc) as (text: string, options?: Record<string, unknown>) => number;
  const origSplitTextToSize = doc.splitTextToSize.bind(doc) as (text: string | string[], maxlen: number, options?: unknown) => string[];

  const internal = doc.internal as unknown as {
    scaleFactor: number;
    getFontSize: () => number;
    getCharSpace: () => number;
    getFont: (fontName?: string, fontStyle?: string, options?: { disableWarning?: boolean }) => unknown;
  };
  const scaleFactor = () => internal.scaleFactor;
  const currentFont = (): SavedFont => {
    try {
      const font = doc.getFont() as { fontName?: string; fontStyle?: string };
      return { fontName: font.fontName || 'helvetica', fontStyle: font.fontStyle || 'normal' };
    } catch {
      return { fontName: 'helvetica', fontStyle: 'normal' };
    }
  };
  const fontObject = (fontName: string, fontStyle: string) => {
    try {
      return internal.getFont(fontName, fontStyle, { disableWarning: true }) || undefined;
    } catch {
      return undefined;
    }
  };
  const fontSize = () => internal.getFontSize();
  const charSpace = () => {
    try {
      return internal.getCharSpace() || 0;
    } catch {
      return 0;
    }
  };
  const teluguFontAvailable = (fontStyle: string) => Boolean(fontObject(PDF_TELUGU_FONT, teluguStyleFor(fontStyle)));

  type FontMeta = {
    cmap?: { unicode?: { codeMap?: Record<number, number> } };
    toUnicode?: Record<number, number>;
  };
  const fontMeta = (fontStyle: string): FontMeta | undefined => {
    const rec = fontObject(PDF_TELUGU_FONT, teluguStyleFor(fontStyle)) as { metadata?: FontMeta } | undefined;
    return rec?.metadata;
  };

  // jsPDF maps every codepoint through cmap.unicode.codeMap to a glyph id.
  // We claim private-use codepoints (PUA) mapping to the *shaped* glyph ids
  // from fontkit, so doc.text(puaChar) writes the ligated glyph directly —
  // real OpenType shaping (conjuncts, ottulu, matra positioning) in the PDF.
  const PUA_BASE = 0xe000;
  const PUA_LIMIT = 0xf8ff;
  let nextPua = PUA_BASE;
  const puaPool = new Map<string, number>(); // `${style}:${gid}` → pua
  const puaForGlyph = (fontStyle: string, gid: number): number | undefined => {
    const style = teluguStyleFor(fontStyle);
    const key = `${style}:${gid}`;
    let pua = puaPool.get(key);
    if (pua === undefined) {
      const codeMap = fontMeta(style)?.cmap?.unicode?.codeMap;
      if (!codeMap || nextPua > PUA_LIMIT) return undefined;
      pua = nextPua++;
      codeMap[pua] = gid;
      puaPool.set(key, pua);
    }
    return pua;
  };

  interface ShapedGlyph {
    pua: number;
    gid: number;
    ax: number;
    ox: number;
    oy: number;
    rep: number;
  }
  interface ShapedRun {
    glyphs: ShapedGlyph[];
    advanceUnits: number;
    unitsPerEm: number;
  }
  const shapeTeluguRun = (text: string, fontStyle: string): ShapedRun | null => {
    const style = teluguStyleFor(fontStyle);
    const shaper = teluguShapers[style] ?? teluguShapers.normal;
    if (!shaper || !fontMeta(style)?.cmap?.unicode?.codeMap) return null;
    try {
      const run = shaper.layout(text);
      const glyphs: ShapedGlyph[] = [];
      let advanceUnits = 0;
      run.glyphs.forEach((glyph, index) => {
        const position = run.positions[index] ?? { xAdvance: 0, yAdvance: 0, xOffset: 0, yOffset: 0 };
        const pua = puaForGlyph(style, glyph.id);
        if (pua === undefined) return;
        advanceUnits += position.xAdvance;
        // Extraction rep: prefer the base consonant over a leading virama/matra
        const cps = glyph.codePoints ?? [];
        glyphs.push({
          pua,
          gid: glyph.id,
          ax: position.xAdvance,
          ox: position.xOffset,
          oy: position.yOffset,
          rep: cps.find((cp) => (cp >= 0x0c15 && cp <= 0x39) || (cp >= 0x0c05 && cp <= 0x14)) ?? cps[0] ?? pua,
        });
      });
      return { glyphs, advanceUnits, unitsPerEm: shaper.unitsPerEm || 1000 };
    } catch {
      return null;
    }
  };

  const displayRuns = (text: string): TextRunPart[] =>
    splitRuns(text).map((run) => ({ raw: run.text, telugu: run.telugu, text: run.telugu ? reorderTeluguMatras(run.text) : run.text }));

  const runUnitWidth = (run: TextRunPart, saved: SavedFont, options?: Record<string, unknown>): number => {
    if (run.telugu) {
      const shaped = shapeTeluguRun(run.raw ?? run.text, saved.fontStyle);
      if (shaped) {
        return shaped.advanceUnits / shaped.unitsPerEm + (shaped.glyphs.length * charSpace()) / fontSize();
      }
    }
    const font = run.telugu
      ? fontObject(PDF_TELUGU_FONT, teluguStyleFor(saved.fontStyle))
      : (options?.font as object | undefined) || fontObject(saved.fontName, saved.fontStyle);
    if (!font) return origGetStringUnitWidth(run.text, options);
    return origGetStringUnitWidth(run.text, {
      ...(options || {}),
      font,
      fontSize: (options?.fontSize as number | undefined) ?? fontSize(),
      charSpace: (options?.charSpace as number | undefined) ?? charSpace(),
      doKerning: false,
    });
  };

  const runDocWidth = (run: TextRunPart, saved: SavedFont, options?: Record<string, unknown>) =>
    (runUnitWidth(run, saved, options) * ((options?.fontSize as number | undefined) ?? fontSize())) / scaleFactor();

  // getTextWidth delegates to this.getStringUnitWidth internally, so patching
  // this method fixes measurement everywhere (incl. autoTable cell sizing).
  doc.getStringUnitWidth = ((text: string, options?: Record<string, unknown>) => {
    if (!containsTelugu(text)) return origGetStringUnitWidth(text, options);
    const saved = currentFont();
    return displayRuns(text).reduce((sum, run) => sum + runUnitWidth(run, saved, options), 0);
  }) as JsPdfInstance['getStringUnitWidth'];

  doc.splitTextToSize = ((text: string | string[], maxlen: number, options?: unknown) => {
    const items = (Array.isArray(text) ? text : [text]).map(String);
    if (!items.some(containsTelugu)) return origSplitTextToSize(text, maxlen, options);
    const lines: string[] = [];
    for (const item of items) {
      for (const paragraph of item.split('\n')) {
        if (!paragraph) {
          lines.push('');
          continue;
        }
        let current = '';
        for (const piece of paragraph.split(/(\s+)/)) {
          if (!piece) continue;
          const candidate = current + piece;
          if (current.trim() && doc.getTextWidth(candidate) > maxlen) {
            lines.push(current.trimEnd());
            current = piece.trimStart();
            while (current.length > 1 && doc.getTextWidth(current) > maxlen) {
              let k = current.length;
              while (k > 1 && doc.getTextWidth(current.slice(0, k)) > maxlen) k--;
              lines.push(current.slice(0, k));
              current = current.slice(k);
            }
          } else {
            current = candidate;
          }
        }
        if (current || !paragraph.trim()) lines.push(current.trimEnd());
      }
    }
    return lines;
  }) as JsPdfInstance['splitTextToSize'];

  /**
   * Draw a Telugu run as individually positioned shaped glyphs: each glyph is
   * written via a PUA codepoint (mapped to the real glyph id in the font's
   * codeMap) at its shaper-computed pen + offset. Returns false when shaping
   * is unavailable so the caller can fall back to the plain path.
   */
  const drawShapedRun = (
    run: TextRunPart,
    fontStyle: string,
    x: number,
    y: number,
    angleRad: number,
    options: Record<string, unknown>,
    transform: unknown
  ): boolean => {
    const shaped = shapeTeluguRun(run.raw ?? run.text, fontStyle);
    if (!shaped || !shaped.glyphs.length) return false;
    const toUnicode = fontMeta(teluguStyleFor(fontStyle))?.toUnicode;
    const docScale = fontSize() / shaped.unitsPerEm / scaleFactor();
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    let penUnits = 0;
    shaped.glyphs.forEach((glyph) => {
      const dx = (penUnits + glyph.ox) * docScale;
      const dy = glyph.oy * docScale;
      origText(String.fromCharCode(glyph.pua), x + dx * cos - dy * sin, y - dx * sin - dy * cos, options, transform);
      // pdfEscape16 recorded pua → gid; point extraction back at the real char
      if (toUnicode) toUnicode[glyph.gid] = glyph.rep;
      penUnits += glyph.ax;
    });
    return true;
  };

  const drawMixedLine = (text: string, x: number, y: number, options: Record<string, unknown>, transform?: unknown) => {
    const saved = currentFont();
    const runs = displayRuns(text);
    if (!runs.length) return;
    const useTelugu = teluguFontAvailable(saved.fontStyle);
    if (!useTelugu) {
      origText(text, x, y, options, transform);
      return;
    }

    const widths = runs.map((run) => runDocWidth(run, saved, options));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    let startX = x;
    if (options.align === 'center') startX = x - totalWidth / 2;
    else if (options.align === 'right' || options.align === 'end') startX = x - totalWidth;

    const angleRad = ((typeof options.angle === 'number' ? options.angle : 0) * Math.PI) / 180;
    const runOptions: Record<string, unknown> = { ...options, align: 'left' };
    delete runOptions.maxWidth;
    let cx = startX;
    let cy = y;
    runs.forEach((run, index) => {
      doc.setFont(
        run.telugu ? PDF_TELUGU_FONT : saved.fontName,
        run.telugu ? teluguStyleFor(saved.fontStyle) : saved.fontStyle
      );
      let drawn = false;
      if (run.telugu) drawn = drawShapedRun(run, saved.fontStyle, cx, cy, angleRad, runOptions, transform);
      if (!drawn) origText(run.text, cx, cy, runOptions, transform);
      cx += Math.cos(angleRad) * widths[index];
      cy -= Math.sin(angleRad) * widths[index];
    });
    doc.setFont(saved.fontName, saved.fontStyle);
  };

  doc.text = ((text: string | string[], x: number, y: number, options?: Record<string, unknown>, transform?: unknown) => {
    const items = (Array.isArray(text) ? text : [text]).map(String);
    if (!items.some(containsTelugu)) return origText(text, x, y, options, transform);
    const opts = options || {};
    const lineHeight = doc.getLineHeight() / scaleFactor();
    items.forEach((line, index) => drawMixedLine(line, x, y + index * lineHeight, opts, transform));
    return doc;
  }) as JsPdfInstance['text'];
}
