import { describe, expect, it, vi } from 'vitest';
import type { jsPDF as JsPdfInstance } from 'jspdf';
import {
  PAGE,
  LINE_HEIGHT,
  PARAGRAPH_SPACING,
  createCoveringLetterDocument,
  displayValue,
  drawBranding,
  drawCoveringClosing,
  drawCoveringSignature,
  drawSalutation,
  drawSeparator,
  formatDate,
} from './coveringLetterLayout';
import type { PdfCursor } from './coveringLetterLayout';

type TextCall = {
  text: string;
  x: number;
  y: number;
  options?: { align?: string };
};

// Greedy word-wrap stand-in for jsPDF's splitTextToSize: treats maxWidth as a
// character budget so tests can control exactly where lines break.
function wordWrap(text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function createMockDoc(textWidth = 30) {
  const calls: TextCall[] = [];
  const doc = {
    calls,
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setLineHeightFactor: vi.fn(),
    setTextColor: vi.fn(),
    getFont: () => ({ fontName: 'times', fontStyle: 'normal' }),
    getFontSize: () => 12,
    getTextWidth: (text: string) => (text === 'WIDE_DESIGNATION' ? textWidth : text.length),
    text: (value: string | string[], x: number, y: number, options?: { align?: string }) => {
      calls.push({ text: Array.isArray(value) ? value.join('\n') : value, x, y, options });
    },
    splitTextToSize: (text: string, maxWidth: number) => wordWrap(text, Math.floor(maxWidth)),
    setProperties: vi.fn(),
  };
  return doc as unknown as JsPdfInstance & { calls: TextCall[] };
}

function createCursor(doc: JsPdfInstance, y = 100): PdfCursor {
  return { doc, y, contentWidth: PAGE.contentWidth };
}

describe('formatDate', () => {
  it('formats ISO dates as dd/mm/yyyy', () => {
    expect(formatDate('2026-03-05')).toBe('05/03/2026');
  });

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('');
  });

  it('passes through unparseable input', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('displayValue', () => {
  it('returns the value when present', () => {
    expect(displayValue('Tiryani')).toBe('Tiryani');
  });

  it('returns the dotted placeholder for missing or blank values', () => {
    const dots = '.............................';
    expect(displayValue('')).toBe(dots);
    expect(displayValue('   ')).toBe(dots);
    expect(displayValue(null)).toBe(dots);
    expect(displayValue(undefined)).toBe(dots);
  });
});

describe('drawSalutation', () => {
  it('draws Sir/Madam at the left margin without advancing the cursor', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 80);
    drawSalutation(cursor);
    expect(doc.calls).toEqual([{ text: 'Sir/Madam,', x: PAGE.marginLeft, y: 80, options: undefined }]);
    expect(cursor.y).toBe(80);
  });
});

describe('drawSeparator', () => {
  it('centres ****** and advances by LINE_HEIGHT + 2', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 50);
    drawSeparator(cursor);
    expect(doc.calls[0]).toMatchObject({
      text: '******',
      x: PAGE.width / 2,
      y: 50,
      options: { align: 'center' },
    });
    expect(cursor.y).toBe(50 + LINE_HEIGHT + 2);
  });
});

describe('drawCoveringClosing', () => {
  it('with no closing text, draws only Thanking you.', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 200);
    drawCoveringClosing(cursor, null);
    expect(doc.calls).toHaveLength(1);
    expect(doc.calls[0]).toMatchObject({
      text: 'Thanking you.',
      x: PAGE.width / 2,
      options: { align: 'center' },
    });
    expect(cursor.y).toBe(200 + LINE_HEIGHT + PARAGRAPH_SPACING);
  });

  it('indents the first line by 12mm and left-aligns wrapped lines', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 200);
    const closingText =
      'Hence, I request the kind authority to arrange for quality analysis and communicate the results to the above address at an early date so that further action may be taken without any delay.';
    drawCoveringClosing(cursor, closingText);

    const first = doc.calls[0];
    const last = doc.calls[doc.calls.length - 1];
    expect(first.x).toBe(PAGE.marginLeft + 12);
    expect(first.y).toBe(200);
    // Wrapped remainder must exist and start at the left margin.
    const remainder = doc.calls.find((c) => c !== first && c !== last && c.y === 200 + LINE_HEIGHT);
    expect(remainder).toBeDefined();
    expect(remainder!.x).toBe(PAGE.marginLeft);
    expect(last).toMatchObject({ text: 'Thanking you.', options: { align: 'center' } });
  });
});

describe('drawCoveringSignature', () => {
  it('centres Yours faithfully and the inspector label on the designation midpoint', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 150);
    const designation = 'Mandal Agricultural Officer';
    const signatureX = PAGE.width - PAGE.marginRight;
    const expectedCenterX = signatureX - doc.getTextWidth(designation) / 2;

    drawCoveringSignature(cursor, designation, '& Fertilizer Inspector');

    const faithfully = doc.calls.find((c) => c.text === 'Yours faithfully,');
    const designationCall = doc.calls.find((c) => c.text === designation);
    const inspector = doc.calls.find((c) => c.text === '& Fertilizer Inspector');

    expect(faithfully).toMatchObject({ x: expectedCenterX, options: { align: 'center' } });
    expect(designationCall).toMatchObject({ x: signatureX, options: { align: 'right' } });
    expect(inspector).toMatchObject({ x: expectedCenterX, options: { align: 'center' } });
  });

  it('moves the label axis when the designation width changes', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 150);
    drawCoveringSignature(cursor, 'WIDE_DESIGNATION', '& Seed Inspector');
    const signatureX = PAGE.width - PAGE.marginRight;
    const inspector = doc.calls.find((c) => c.text === '& Seed Inspector');
    expect(inspector!.x).toBe(signatureX - 30 / 2);
  });

  it('advances the cursor by the fixed signature block height', () => {
    const doc = createMockDoc();
    const cursor = createCursor(doc, 150);
    drawCoveringSignature(cursor, 'Mandal Agricultural Officer', '& Seed Inspector');
    expect(cursor.y).toBe(150 - 5 + LINE_HEIGHT + LINE_HEIGHT + 5 + LINE_HEIGHT + LINE_HEIGHT + PARAGRAPH_SPACING);
  });
});

describe('drawBranding', () => {
  it('stamps AGRONIX bottom-right and restores prior font state', () => {
    const doc = createMockDoc();
    drawBranding(doc);
    expect(doc.calls[0]).toMatchObject({
      text: 'AGRONIX',
      x: PAGE.width - 10,
      y: PAGE.height - 10,
      options: { align: 'right' },
    });
    expect(doc.setFont).toHaveBeenLastCalledWith('times', 'normal');
    expect(doc.setFontSize).toHaveBeenLastCalledWith(12);
    expect(doc.setTextColor).toHaveBeenLastCalledWith(0);
  });
});

describe('createCoveringLetterDocument', () => {
  it('creates an A4 portrait doc with caller-supplied title and subject', () => {
    const setProperties = vi.fn();
    class FakeJsPdf {
      setProperties = setProperties;
    }
    createCoveringLetterDocument(
      FakeJsPdf as unknown as new (o: { orientation: 'portrait'; unit: 'mm'; format: 'a4'; compress: boolean }) => JsPdfInstance,
      'Covering Letter - Seed Samples',
      'Covering Letter for Seed Sample Submission'
    );
    expect(setProperties).toHaveBeenCalledWith({
      title: 'Covering Letter - Seed Samples',
      subject: 'Covering Letter for Seed Sample Submission',
      creator: 'AGRONIX',
    });
  });
});
