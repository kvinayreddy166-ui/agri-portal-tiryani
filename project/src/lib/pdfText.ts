import type { jsPDF as JsPdfInstance } from 'jspdf';

export type PdfBodySegment = { text: string; bold?: boolean };

type StyledWord = { text: string; bold: boolean; width: number; spaceAfter: number };

/**
 * Draws wrapped body text with justified alignment and a first-line indent.
 * Words are packed greedily into lines; every line except the last is
 * justified by distributing the remaining width across word gaps.
 * Returns the y position after the last drawn line.
 */
export function drawJustifiedBodyText(
  doc: JsPdfInstance,
  segments: PdfBodySegment[],
  options: {
    x: number;
    startY: number;
    maxWidth: number;
    lineHeight: number;
    firstLineIndent: number;
    fontName: string;
  }
): number {
  const { x, startY, maxWidth, lineHeight, firstLineIndent, fontName } = options;

  const words: StyledWord[] = [];
  for (const segment of segments) {
    doc.setFont(fontName, segment.bold ? 'bold' : 'normal');
    const spaceAfter = doc.getTextWidth(' ');
    for (const raw of segment.text.split(' ')) {
      if (!raw) continue;
      words.push({ text: raw, bold: !!segment.bold, width: doc.getTextWidth(raw), spaceAfter });
    }
  }

  const lines: { lineWords: StyledWord[]; width: number }[] = [];
  let lineWords: StyledWord[] = [];
  let lineWidth = 0;
  let available = maxWidth - firstLineIndent;
  for (const word of words) {
    const addedWidth = (lineWords.length ? lineWords[lineWords.length - 1].spaceAfter : 0) + word.width;
    if (lineWords.length > 0 && lineWidth + addedWidth > available) {
      lines.push({ lineWords, width: lineWidth });
      lineWords = [word];
      lineWidth = word.width;
      available = maxWidth;
    } else {
      lineWords.push(word);
      lineWidth += addedWidth;
    }
  }
  if (lineWords.length) lines.push({ lineWords, width: lineWidth });

  let y = startY;
  lines.forEach((line, lineIndex) => {
    const isLastLine = lineIndex === lines.length - 1;
    const lineAvailable = lineIndex === 0 ? maxWidth - firstLineIndent : maxWidth;
    const extraSpace = !isLastLine && line.lineWords.length > 1
      ? (lineAvailable - line.width) / (line.lineWords.length - 1)
      : 0;
    let xPos = lineIndex === 0 ? x + firstLineIndent : x;
    line.lineWords.forEach((word, wordIndex) => {
      doc.setFont(fontName, word.bold ? 'bold' : 'normal');
      doc.text(word.text, xPos, y);
      xPos += word.width + (wordIndex < line.lineWords.length - 1 ? word.spaceAfter + extraSpace : 0);
    });
    y += lineHeight;
  });

  return y;
}
