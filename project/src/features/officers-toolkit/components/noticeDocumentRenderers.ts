import type { FileChild } from 'docx';
import { setupPdfUnicodeFonts, DOCX_TELUGU_FONT } from '../../../shared/lib/pdfUnicodeFonts';
import { addEmblemImageWatermark } from '../../../shared/lib/pdfWatermark';
import { NOTICE_FONT_STACK, type NoticeBlock, type NoticeSegment } from './showCauseNoticeModel';

export function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function segmentsHtml(segments: NoticeSegment[]) {
  return segments
    .map((segment) => {
      const style = segment.underline ? ' style="text-decoration:underline;"' : '';
      return segment.bold ? `<strong${style}>${escapeHtml(segment.text)}</strong>` : `<span${style}>${escapeHtml(segment.text)}</span>`;
    })
    .join('');
}

export function noticeBlocksHtml(blocks: NoticeBlock[]) {
  const renderBlock = (block: NoticeBlock) => {
      switch (block.kind) {
        case 'center': {
          const margin = block.spaceAfter !== undefined && block.spaceAfter < 4 ? 'margin-bottom:-1.5pt;' : '';
          return `<div style="text-align:center;${block.bold ? 'font-weight:700;' : ''}${block.underline ? 'text-decoration:underline;' : ''}${block.size ? `font-size:${block.size}pt;` : ''}line-height:1.15;${margin}">${escapeHtml(block.text)}</div>`;
        }
        case 'memoRow': {
          const leftLines = block.leftLines ?? (block.left ? [block.left] : []);
          const rightLines = block.rightLines ?? (block.right ? [block.right] : []);
          const leftHtml = leftLines.map((line) => `<div style="line-height:1.15;">${segmentsHtml(line)}</div>`).join('');
          const rightInner = rightLines.map((line) => `<div style="line-height:1.15;">${segmentsHtml(line)}</div>`).join('');
          const rightHtml = block.rightLines
            ? `<span style="display:inline-block;text-align:center;">${rightInner}</span>`
            : `<span>${rightInner}</span>`;
          return `<div style="display:flex;justify-content:space-between;gap:12pt;line-height:1.15;"><span>${leftHtml}</span>${rightHtml}</div>`;
        }
        case 'para': {
          const bottomMargin = block.spaceAfter !== undefined ? `${(block.spaceAfter * 2.83465).toFixed(1)}pt` : '6.5pt';
          return `<p style="margin:0 0 ${bottomMargin} ${block.indent || 0}mm;text-align:justify;${block.firstLineIndent ? `text-indent:${block.firstLineIndent}mm;` : ''}line-height:1.15;">${segmentsHtml(block.segments)}</p>`;
        }
        case 'labelPara': {
          const pad = block.labelPad ? `<strong style="flex:none;visibility:hidden;">${escapeHtml(block.labelPad)}&nbsp;</strong>` : '';
          const isRefSubItem = Boolean(block.labelPad && /^\d+\.$/.test(block.label));
          const labelTag = (block.labelBold === false || isRefSubItem) ? 'span' : 'strong';
          const suffix = block.labelSuffix ? `<span style="flex:none;font-weight:normal;">${escapeHtml(block.labelSuffix)}&nbsp;</span>` : '';
          const bottomMargin = block.spaceAfter !== undefined ? `${(block.spaceAfter * 2.83465).toFixed(1)}pt` : '5pt';
          return `<div style="display:flex;margin:0 0 ${bottomMargin} ${block.indent || 0}mm;line-height:1.15;">${pad}<${labelTag} style="flex:none;">${escapeHtml(block.label)}&nbsp;</${labelTag}>${suffix}<span style="flex:1;text-align:justify;">${segmentsHtml(block.segments)}</span></div>`;
        }
        case 'heading': {
          const bottomMargin = block.spaceAfter !== undefined ? `${(block.spaceAfter * 2.83465).toFixed(1)}pt` : '3pt';
          return `<p style="margin:6pt 0 ${bottomMargin};font-weight:700;line-height:1.15;">${escapeHtml(block.text)}</p>`;
        }
        case 'lines': {
          const inner = block.items.map((item) => `<div style="line-height:1.15;">${segmentsHtml(item)}</div>`).join('');
          if (block.centerLines) {
            return `<div style="margin-left:${block.indent || 0}mm;text-align:right;transform:translateX(${block.offsetX || 0}mm);line-height:1.15;"><div style="display:inline-block;text-align:center;">${inner}</div></div>`;
          }
          return `<div style="margin-left:${block.indent || 0}mm;text-align:${block.align === 'right' ? 'right' : 'left'};transform:translateX(${block.offsetX || 0}mm);line-height:1.15;">${inner}</div>`;
        }
        case 'table':
          return `<table style="width:92%;border-collapse:collapse;margin:2pt 0 2pt 8mm;"><thead><tr>${block.header
            .map((cell) => `<th style="border:1pt solid #000;padding:2pt 6pt;text-align:left;font-weight:700;line-height:1.15;">${escapeHtml(cell)}</th>`)
            .join('')}</tr></thead><tbody>${block.rows
            .map(
              (row) =>
                `<tr><td style="border:1pt solid #000;padding:2pt 6pt;line-height:1.15;">${escapeHtml(row.label)}</td><td style="border:1pt solid #000;padding:2pt 6pt;font-weight:700;line-height:1.15;">${escapeHtml(row.value || '______________________________')}</td></tr>`
            )
            .join('')}</tbody></table>`;
        case 'gridTable': {
          const weights = block.colWeights && block.colWeights.length === block.header.length
            ? block.colWeights
            : block.header.map(() => 1);
          const total = weights.reduce((a, b) => a + b, 0);
          const cols = weights.map((w) => `<col style="width:${(w / total) * 100}%;"/>`).join('');
          return `<table style="width:100%;border-collapse:collapse;margin:2pt 0 4pt;table-layout:fixed;font-size:10pt;">${cols}<thead><tr>${block.header
            .map((cell) => `<th style="border:1pt solid #000;padding:2pt 4pt;text-align:center;font-weight:700;vertical-align:middle;overflow-wrap:break-word;line-height:1.15;${cell === 'S.No' || cell === 'S.No.' ? 'white-space:nowrap;' : ''}">${escapeHtml(cell)}</th>`)
            .join('')}</tr></thead><tbody>${block.rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td style="border:1pt solid #000;padding:2pt 4pt;text-align:center;vertical-align:middle;overflow-wrap:break-word;line-height:1.15;">${escapeHtml(cell) || '&nbsp;'}</td>`)
                  .join('')}</tr>`
            )
            .join('')}</tbody></table>`;
        }
        case 'rule':
          return '<hr style="border:none;border-top:1pt dashed #000;margin:2pt 0;"/>';
        case 'gap':
          return `<div style="height:${block.mm ?? 2}mm;"></div>`;
        default:
          return '';
      }
  };
  // Runs of keepWithNext blocks (signature / To / Copy footer) are wrapped so
  // they never split across pages when the document is printed or exported.
  const html: string[] = [];
  let index = 0;
  while (index < blocks.length) {
    const block = blocks[index];
    if (!block.keepWithNext) {
      html.push(renderBlock(block));
      index += 1;
      continue;
    }
    const group: string[] = [];
    do {
      group.push(renderBlock(blocks[index]));
      index += 1;
    } while (index < blocks.length && blocks[index - 1].keepWithNext);
    html.push(`<div style="break-inside:avoid;page-break-inside:avoid;">${group.join('')}</div>`);
  }
  return html.join('');
}

export function noticeDocumentHtml(blocks: NoticeBlock[]) {
  return `<html><head><style>@page{size:A4;margin:18mm 15mm;}body{font-family:${NOTICE_FONT_STACK};font-size:12pt;line-height:1.15;color:#000;}</style></head><body>${noticeBlocksHtml(blocks)}</body></html>`;
}

export async function buildNoticeWordDocument(blocks: NoticeBlock[], docFont: NoticeDocFont = 'times') {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    LineRuleType,
    PageOrientation,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TabStopType,
    TextRun,
    UnderlineType,
    VerticalAlign,
    WidthType,
  } = await import('docx');

  const latinFont = docFont === 'robotoSerif' ? 'Roboto Serif' : docFont === 'bookAntiqua' ? 'Book Antiqua' : 'Times New Roman';
  const font = { ascii: latinFont, hAnsi: latinFont, eastAsia: latinFont, cs: DOCX_TELUGU_FONT };
  const fontSize = 24;
  const mmToTwips = (mm: number) => Math.round(mm * 56.6929);
  const wordGridLine = { line: 230, lineRule: LineRuleType.EXACT };
  const runs = (segments: NoticeSegment[]) => segments.map((segment) => new TextRun({ text: segment.text, bold: segment.bold, underline: segment.underline ? { type: UnderlineType.SINGLE } : undefined, font, size: fontSize }));
  const children: FileChild[] = [];
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };
  const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder };

  blocks.forEach((block) => {
    switch (block.kind) {
      case 'center':
        children.push(new Paragraph({
          children: [new TextRun({ text: block.text, bold: block.bold, underline: block.underline ? { type: UnderlineType.SINGLE } : undefined, font, size: block.size ? block.size * 2 : fontSize })],
          alignment: AlignmentType.CENTER,
          keepNext: block.keepWithNext,
          spacing: { line: 276, lineRule: LineRuleType.EXACT, after: block.spaceAfter !== undefined ? Math.round(block.spaceAfter * 56.6929) : 0 },
        }));
        break;
      case 'memoRow':
        if (block.leftLines || block.rightLines) {
          const leftLines = block.leftLines ?? (block.left ? [block.left] : []);
          const rightLines = block.rightLines ?? (block.right ? [block.right] : []);
          const memoPara = (line: NoticeSegment[], centered = false) => new Paragraph({
            children: runs(line),
            alignment: centered ? AlignmentType.CENTER : AlignmentType.LEFT,
            keepNext: block.keepWithNext,
            spacing: { line: 276, lineRule: LineRuleType.EXACT, after: 0 },
          });
          children.push(new Table({
            rows: [new TableRow({
              cantSplit: true,
              children: [
                new TableCell({ children: leftLines.map((line) => memoPara(line)), verticalAlign: VerticalAlign.CENTER, borders: noBorders }),
                new TableCell({ children: rightLines.map((line) => memoPara(line, true)), verticalAlign: VerticalAlign.CENTER, borders: noBorders }),
              ],
            })],
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [mmToTwips(100), mmToTwips(70)],
            borders: noBorders,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            layout: TableLayoutType.FIXED,
          }));
        } else {
          children.push(new Paragraph({
            children: [...runs(block.left || []), new TextRun({ text: '\t', font, size: fontSize }), ...runs(block.right || [])],
            tabStops: [{ type: TabStopType.RIGHT, position: mmToTwips(165) }],
            keepNext: block.keepWithNext,
            spacing: { line: 276, lineRule: LineRuleType.EXACT, after: 0 },
          }));
        }
        break;
      case 'para': {
        const afterTwips = block.spaceAfter !== undefined ? mmToTwips(block.spaceAfter) : 130;
        children.push(new Paragraph({
          children: runs(block.segments),
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: mmToTwips(block.indent || 0),
            firstLine: mmToTwips(block.firstLineIndent || 0),
          },
          keepNext: block.keepWithNext,
          spacing: { line: 276, lineRule: LineRuleType.EXACT, after: afterTwips },
        }));
        break;
      }
      case 'labelPara': {
        const hanging = mmToTwips(7);
        // Approximate the bold leader's width so "2." aligns under "1." after "Ref:".
        const padTwips = block.labelPad ? mmToTwips(block.labelPad.length * 2.3 + 1.4) : 0;
        const isRefSubItem = Boolean(block.labelPad && /^\d+\.$/.test(block.label));
        const afterTwips = block.spaceAfter !== undefined ? mmToTwips(block.spaceAfter) : 100;
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${block.label} `, bold: (block.labelBold !== false && !isRefSubItem), font, size: fontSize }),
            ...(block.labelSuffix ? [new TextRun({ text: `${block.labelSuffix} `, bold: false, font, size: fontSize })] : []),
            ...runs(block.segments),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: mmToTwips(block.indent || 0) + padTwips + hanging, hanging },
          keepNext: block.keepWithNext,
          spacing: { line: 276, lineRule: LineRuleType.EXACT, after: afterTwips },
        }));
        break;
      }
      case 'heading': {
        const afterTwips = block.spaceAfter !== undefined ? mmToTwips(block.spaceAfter) : 60;
        children.push(new Paragraph({
          children: [new TextRun({ text: block.text, bold: true, font, size: fontSize })],
          keepNext: block.keepWithNext,
          spacing: { line: 276, lineRule: LineRuleType.EXACT, before: 120, after: afterTwips },
        }));
        break;
      }
      case 'lines':
        if (block.centerLines) {
          children.push(new Table({
            rows: [new TableRow({
              cantSplit: true,
              children: [new TableCell({
                children: block.items.map((item) => new Paragraph({
                  children: runs(item),
                  alignment: AlignmentType.CENTER,
                  keepNext: block.keepWithNext,
                  spacing: { line: 276, lineRule: LineRuleType.EXACT, after: 0 },
                })),
                verticalAlign: VerticalAlign.CENTER,
                borders: noBorders,
              })],
            })],
            width: { size: 4400, type: WidthType.DXA },
            columnWidths: [4400],
            alignment: AlignmentType.RIGHT,
            borders: noBorders,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            layout: TableLayoutType.FIXED,
          }));
        } else {
          block.items.forEach((item) => children.push(new Paragraph({
            children: runs(item),
            alignment: block.align === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT,
            indent: { left: mmToTwips(block.indent || 0) },
            keepNext: block.keepWithNext,
            spacing: { line: 276, lineRule: LineRuleType.EXACT, after: 0 },
          })));
        }
        break;
      case 'table': {
        const cellParagraph = (text: string, bold = false) => new Paragraph({
          children: [new TextRun({ text, bold, font, size: fontSize })],
          spacing: { line: 276, lineRule: LineRuleType.EXACT, after: 0 },
        });
        children.push(new Table({
          rows: [
            new TableRow({
              children: block.header.map((text) => new TableCell({
                children: [cellParagraph(text, true)],
                verticalAlign: VerticalAlign.CENTER,
              })),
            }),
            ...block.rows.map((row) => new TableRow({
              children: [
                new TableCell({ children: [cellParagraph(row.label)] }),
                new TableCell({ children: [cellParagraph(row.value || '______________________________', true)] }),
              ],
            })),
          ],
          width: { size: 92, type: WidthType.PERCENTAGE },
          indent: { size: mmToTwips(8), type: WidthType.DXA },
          columnWidths: [4300, 4300],
          borders: tableBorders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          layout: TableLayoutType.FIXED,
        }));
        break;
      }
      case 'gridTable': {
        const weights = block.colWeights && block.colWeights.length === block.header.length
          ? block.colWeights
          : block.header.map(() => 1);
        const total = weights.reduce((a, b) => a + b, 0);
        const contentWidth = mmToTwips(180);
        const cellPara = (text: string, bold = false) => new Paragraph({
          children: [new TextRun({ text, bold, font, size: fontSize - 4 })],
          alignment: AlignmentType.CENTER,
          spacing: { ...wordGridLine, after: 0 },
        });
        children.push(new Table({
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: block.header.map((text) => new TableCell({
                children: [cellPara(text, true)],
                verticalAlign: VerticalAlign.CENTER,
              })),
            }),
            ...block.rows.map((row) => new TableRow({
              cantSplit: true,
              children: row.map((text) => new TableCell({
                children: [cellPara(text)],
                verticalAlign: VerticalAlign.CENTER,
              })),
            })),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: weights.map((w) => Math.round((contentWidth * w) / total)),
          borders: tableBorders,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          layout: TableLayoutType.FIXED,
        }));
        break;
      }
      case 'rule':
        children.push(new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.DASHED, size: 6, color: '000000', space: 1 } },
          keepNext: block.keepWithNext,
          spacing: { line: 276, lineRule: LineRuleType.EXACT, after: 0 },
        }));
        break;
      case 'gap':
        children.push(new Paragraph({
          children: [],
          keepNext: block.keepWithNext,
          spacing: { before: 0, after: 0, line: mmToTwips(block.mm ?? 2), lineRule: LineRuleType.EXACT },
        }));
        break;
      default:
        break;
    }
  });

  const document = new Document({
    styles: {
      default: {
        document: {
          run: { font, size: fontSize, color: '000000' },
          paragraph: { spacing: { line: 276, lineRule: LineRuleType.EXACT } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: mmToTwips(18), right: mmToTwips(15), bottom: mmToTwips(18), left: mmToTwips(15) },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(document);
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export type NoticeDocFont = 'times' | 'bookAntiqua' | 'robotoSerif';

export async function loadNoticeFonts(doc: { addFileToVFS: (name: string, data: string) => void; addFont: (file: string, name: string, style: string) => void }, font: NoticeDocFont = 'times') {
  if (font === 'times') {
    return 'times';
  }
  try {
    const load = async (url: string) => arrayBufferToBase64(await (await fetch(url)).arrayBuffer());
    if (font === 'robotoSerif') {
      doc.addFileToVFS('RobotoSerif.ttf', await load('/fonts/RobotoSerif.ttf'));
      doc.addFont('RobotoSerif.ttf', 'RobotoSerif', 'normal');
      doc.addFileToVFS('RobotoSerif-Bold.ttf', await load('/fonts/RobotoSerif-Bold.ttf'));
      doc.addFont('RobotoSerif-Bold.ttf', 'RobotoSerif', 'bold');
      doc.addFileToVFS('RobotoSerif-Italic.ttf', await load('/fonts/RobotoSerif-Italic.ttf'));
      doc.addFont('RobotoSerif-Italic.ttf', 'RobotoSerif', 'italic');
      return 'RobotoSerif';
    }
    doc.addFileToVFS('BookAntiqua.ttf', await load('/fonts/BookAntiqua.ttf'));
    doc.addFont('BookAntiqua.ttf', 'BookAntiqua', 'normal');
    doc.addFileToVFS('BookAntiqua-Bold.ttf', await load('/fonts/BookAntiqua-Bold.ttf'));
    doc.addFont('BookAntiqua-Bold.ttf', 'BookAntiqua', 'bold');
    return 'BookAntiqua';
  } catch {
    return 'times';
  }
}

export async function renderNoticePdfDocument(
  noticeBlocks: NoticeBlock[],
  title: string,
  font: NoticeDocFont = 'times',
  watermark = true
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title, subject: title, creator: 'AGRONIX' });
  doc.setLineHeightFactor(1.15);
  const fontName = await loadNoticeFonts(doc, font);
  await setupPdfUnicodeFonts(doc);

  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 15;
  const MR = 15;
  const MT = 15;
  const MB = 15;
  const CW = PAGE_W - ML - MR;
  const LH = 4.87;
  let y = MT;

  const measure = (text: string, bold: boolean, size = 12) => {
    doc.setFont(fontName, bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    return doc.getTextWidth(text);
  };
  const spaceWidth = (size = 12) => measure(' ', false, size);
  const runsWidth = (runs: NoticeSegment[], size = 12) =>
    runs.reduce((total, run) => total + measure(run.text, !!run.bold, size), 0) + Math.max(runs.length - 1, 0) * spaceWidth(size);

  const drawRuns = (runs: NoticeSegment[], x: number, lineY: number, justifyToWidth?: number, size = 12) => {
    let cx = x;
    let gap = spaceWidth(size);
    if (justifyToWidth && runs.length > 1) {
      const extra = justifyToWidth - runsWidth(runs, size);
      if (extra > 0) gap += extra / (runs.length - 1);
    }
    runs.forEach((run, runIndex) => {
      doc.setFont(fontName, run.bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.text(run.text, cx, lineY);
      const w = doc.getTextWidth(run.text);
      if (run.underline) doc.line(cx, lineY + 0.8, cx + w + (runs[runIndex + 1]?.underline ? gap : 0), lineY + 0.8);
      cx += w + gap;
    });
  };

  const wrapSegments = (segments: NoticeSegment[], width: number, firstLineWidth?: number, size = 12): NoticeSegment[][] => {
    const words: NoticeSegment[] = [];
    segments.forEach((segment) => {
      segment.text
        .split(/\s+/)
        .filter(Boolean)
        .forEach((word) => {
          if (measure(word, !!segment.bold, size) <= width) {
            words.push({ text: word, bold: segment.bold, underline: segment.underline });
            return;
          }
          let chunk = '';
          for (const ch of word) {
            if (chunk && measure(chunk + ch, !!segment.bold, size) > width) {
              words.push({ text: chunk, bold: segment.bold, underline: segment.underline });
              chunk = '';
            }
            chunk += ch;
          }
          if (chunk) words.push({ text: chunk, bold: segment.bold, underline: segment.underline });
        });
    });
    const lines: NoticeSegment[][] = [];
    let current: NoticeSegment[] = [];
    let limit = firstLineWidth ?? width;
    words.forEach((word) => {
      const candidate = [...current, word];
      if (current.length > 0 && runsWidth(candidate, size) > limit) {
        lines.push(current);
        current = [word];
        limit = width;
      } else {
        current = candidate;
      }
    });
    if (current.length > 0) lines.push(current);
    return lines;
  };

  const GRID_FONT_SIZE = 10;
  const GRID_LH = (LH * GRID_FONT_SIZE) / 12;

  const gridColWidths = (block: Extract<NoticeBlock, { kind: 'gridTable' }>) => {
    const weights = block.colWeights && block.colWeights.length === block.header.length
      ? block.colWeights
      : block.header.map(() => 1);
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => (CW * w) / total);
  };

  const gridRowHeight = (cells: string[], colW: number[], bold: boolean) => {
    const lineCounts = cells.map((cell, i) => wrapSegments([{ text: cell, bold }], colW[i] - 3, undefined, GRID_FONT_SIZE).length);
    return Math.max(7, Math.max(...lineCounts, 1) * GRID_LH + 2);
  };

  // Height a block will occupy in mm — mirrors the per-kind draw logic below so
  // keepWithNext chains (signature / To / Copy footer) can be space-reserved as a unit.
  const measureBlock = (block: NoticeBlock): number => {
    switch (block.kind) {
      case 'center':
        return block.spaceAfter !== undefined ? block.spaceAfter : (block.size || 12) * 0.5;
      case 'memoRow': {
        if (block.leftLines || block.rightLines) {
          const leftCount = block.leftLines?.length ?? (block.left ? 1 : 0);
          const rightCount = block.rightLines?.length ?? (block.right ? 1 : 0);
          return Math.max(leftCount, rightCount, 1) * LH;
        }
        return LH;
      }
      case 'para': {
        const indent = block.indent || 0;
        const firstLineIndent = block.firstLineIndent || 0;
        const lineWidth = CW - indent;
        const lines = wrapSegments(block.segments, lineWidth, firstLineIndent ? lineWidth - firstLineIndent : undefined);
        const paraGap = block.spaceAfter ?? 2.8;
        return lines.length * LH + paraGap;
      }
      case 'labelPara': {
        const padWidth = block.labelPad ? measure(`${block.labelPad} `, true) : 0;
        const isRefSubItem = Boolean(block.labelPad && /^\d+\.$/.test(block.label));
        const labelBold = (block.labelBold !== false) && !isRefSubItem;
        const suffix = block.labelSuffix ? `${block.labelSuffix} ` : '';
        const indent = (block.indent || 0) + padWidth;
        const labelWidth = measure(`${block.label} `, labelBold) + measure(suffix, false);
        const labelGap = block.spaceAfter ?? 2.2;
        return wrapSegments(block.segments, CW - indent - labelWidth).length * LH + labelGap;
      }
      case 'heading': {
        const headGap = block.spaceAfter ?? 1.5;
        return wrapSegments([{ text: block.text, bold: true }], CW).length * LH + headGap;
      }
      case 'lines':
        return block.items.reduce((total, item) => total + wrapSegments(item, CW - (block.indent || 0)).length * LH, 0);
      case 'table': {
        const col2 = CW - 8 - 62;
        return block.rows.reduce(
          (total, row) => total + Math.max(7, wrapSegments([{ text: row.value || '______________________________', bold: true }], col2 - 4).length * LH + 1.5),
          7
        );
      }
      case 'gridTable': {
        const colW = gridColWidths(block);
        return gridRowHeight(block.header, colW, true)
          + block.rows.reduce((total, row) => total + gridRowHeight(row, colW, false), 0)
          + 1;
      }
      case 'rule':
        return 3;
      case 'gap':
        return block.mm ?? 2;
      default:
        return 0;
    }
  };

  const pageBreak = () => {
    doc.setFont(fontName, 'normal');
    doc.setFontSize(10);
    doc.text("(Cont'd...)", PAGE_W - MR, PAGE_H - MB + 5, { align: 'right' });
    doc.addPage();
    doc.setFontSize(12);
    y = MT;
  };
  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MB) pageBreak();
  };

  doc.setFontSize(12);
  noticeBlocks.forEach((block, index) => {
    // At the start of a keepWithNext chain, reserve room for the whole group so
    // the signature and To-address footer never split across a page break.
    if (block.keepWithNext && !(index > 0 && noticeBlocks[index - 1].keepWithNext)) {
      let groupHeight = 0;
      for (let j = index; j < noticeBlocks.length; j += 1) {
        groupHeight += measureBlock(noticeBlocks[j]);
        if (!noticeBlocks[j].keepWithNext) break;
      }
      ensureSpace(groupHeight);
    }
    switch (block.kind) {
      case 'center': {
        const bold = !!block.bold;
        const pt = block.size || 12;
        doc.setFont(fontName, bold ? 'bold' : 'normal');
        doc.setFontSize(pt);
        const width = doc.getTextWidth(block.text);
        ensureSpace(LH);
        const x = (PAGE_W - width) / 2;
        doc.text(block.text, x, y);
        if (block.underline) doc.line(x, y + 0.8, x + width, y + 0.8);
        y += block.spaceAfter !== undefined ? block.spaceAfter : pt * 0.5;
        doc.setFontSize(12);
        break;
      }
      case 'memoRow': {
        const leftLines = block.leftLines ?? (block.left ? [block.left] : []);
        const rightLines = block.rightLines ?? (block.right ? [block.right] : []);
        const rightBlockWidth = block.rightLines
          ? Math.max(...rightLines.map((line) => runsWidth(line)), 0)
          : 0;
        const rowCount = Math.max(leftLines.length, rightLines.length, 1);
        ensureSpace(rowCount * LH);
        leftLines.forEach((lineRuns, i) => drawRuns(lineRuns, ML, y + i * LH));
        rightLines.forEach((lineRuns, i) => {
          const w = runsWidth(lineRuns);
          const x = block.rightLines
            ? PAGE_W - MR - rightBlockWidth + (rightBlockWidth - w) / 2
            : PAGE_W - MR - w;
          drawRuns(lineRuns, x, y + i * LH);
        });
        y += rowCount * LH;
        break;
      }
      case 'para': {
        const indent = block.indent || 0;
        const firstLineIndent = block.firstLineIndent || 0;
        const lineWidth = CW - indent;
        const lines = wrapSegments(block.segments, lineWidth, firstLineIndent ? lineWidth - firstLineIndent : undefined);
        const paraGap = block.spaceAfter ?? 2.8;
        const fullHeight = lines.length * LH + paraGap;
        const pageAvailable = PAGE_H - MB - MT;
        if (fullHeight <= pageAvailable && !block.keepWithNext) {
          ensureSpace(fullHeight);
        }
        lines.forEach((runs, index) => {
          ensureSpace(LH);
          const isLastLine = index === lines.length - 1;
          const offset = index === 0 ? firstLineIndent : 0;
          drawRuns(runs, ML + indent + offset, y, isLastLine ? undefined : lineWidth - offset);
          y += LH;
        });
        y += paraGap;
        break;
      }
      case 'labelPara': {
        const padWidth = block.labelPad ? measure(`${block.labelPad} `, true) : 0;
        const isRefSubItem = Boolean(block.labelPad && /^\d+\.$/.test(block.label));
        const labelBold = (block.labelBold !== false) && !isRefSubItem;
        const suffix = block.labelSuffix ? `${block.labelSuffix} ` : '';
        const indent = (block.indent || 0) + padWidth;
        const labelWidth = measure(`${block.label} `, labelBold) + measure(suffix, false);
        const lineWidth = CW - indent - labelWidth;
        const lines = wrapSegments(block.segments, lineWidth);
        // Pre-compute suffix X position before any font-state changes.
        // measure() mutates doc font state as a side-effect; computing it
        // inside doc.text() args would clobber the 'normal' state we need.
        const suffixX = suffix ? ML + indent + measure(`${block.label} `, labelBold) : 0;
        const labelGap = block.spaceAfter ?? 2.2;
        const fullHeight = lines.length * LH + labelGap;
        const pageAvailable = PAGE_H - MB - MT;
        if (fullHeight <= pageAvailable && !block.keepWithNext) {
          ensureSpace(fullHeight);
        }
        lines.forEach((runs, index) => {
          ensureSpace(LH);
          if (index === 0) {
            doc.setFontSize(12);
            doc.setFont(fontName, labelBold ? 'bold' : 'normal');
            doc.text(block.label, ML + indent, y);
            if (suffix) {
              doc.setFont(fontName, 'normal');
              doc.text(suffix, suffixX, y);
            }
          }
          const isLastLine = index === lines.length - 1;
          drawRuns(runs, ML + indent + labelWidth, y, isLastLine ? undefined : lineWidth);
          y += LH;
        });
        y += labelGap;
        break;
      }
      case 'heading': {
        const lines = wrapSegments([{ text: block.text, bold: true }], CW);
        const headGap = block.spaceAfter ?? 1.5;
        const fullHeight = lines.length * LH + headGap;
        const pageAvailable = PAGE_H - MB - MT;
        if (fullHeight <= pageAvailable && !block.keepWithNext) {
          ensureSpace(fullHeight);
        }
        lines.forEach((runs) => {
          ensureSpace(LH);
          drawRuns(runs, ML, y);
          y += LH;
        });
        y += headGap;
        break;
      }
      case 'lines': {
        const indent = block.indent || 0;
        const wrapped = block.items.map((item) => wrapSegments(item, CW - indent));
        const blockWidth = block.centerLines
          ? Math.max(...wrapped.flat().map((runs) => runsWidth(runs)))
          : 0;
        const blockH = wrapped.reduce((sum, lines) => sum + lines.length * LH, 0);
        if (!block.keepWithNext) {
          ensureSpace(blockH);
        }
        wrapped.forEach((lines) => {
          lines.forEach((runs) => {
            ensureSpace(LH);
            const w = runsWidth(runs);
            const x = (block.align === 'right'
              ? PAGE_W - MR - (block.centerLines ? blockWidth - (blockWidth - w) / 2 : w)
              : ML + indent) + (block.offsetX || 0);
            drawRuns(runs, x, y);
            y += LH;
          });
        });
        break;
      }
      case 'table': {
        const x0 = ML + 8;
        const col1 = 62;
        const col2 = CW - 8 - col1;
        const rowH = 7;
        const headerLines = [
          wrapSegments([{ text: block.header[0], bold: true }], col1 - 4),
          wrapSegments([{ text: block.header[1], bold: true }], col2 - 4),
        ];
        ensureSpace(rowH);
        doc.rect(x0, y - 4.5, col1, rowH);
        doc.rect(x0 + col1, y - 4.5, col2, rowH);
        drawRuns(headerLines[0][0] || [], x0 + 2, y);
        drawRuns(headerLines[1][0] || [], x0 + col1 + 2, y);
        y += rowH;
        block.rows.forEach((row) => {
          const valueRuns = wrapSegments([{ text: row.value || '______________________________', bold: true }], col2 - 4);
          const height = Math.max(rowH, valueRuns.length * LH + 1.5);
          ensureSpace(height);
          doc.rect(x0, y - 4.5, col1, height);
          doc.rect(x0 + col1, y - 4.5, col2, height);
          drawRuns([{ text: row.label }], x0 + 2, y);
          valueRuns.forEach((runs, index) => drawRuns(runs, x0 + col1 + 2, y + index * LH));
          y += height;
        });
        break;
      }
      case 'gridTable': {
        const colW = gridColWidths(block);
        const drawRow = (cells: string[], bold: boolean) => {
          const rowH = gridRowHeight(cells, colW, bold);
          ensureSpace(rowH);
          let cx = ML;
          cells.forEach((cell, i) => {
            doc.rect(cx, y - 4.5, colW[i], rowH);
            const wrapped = wrapSegments([{ text: cell, bold }], colW[i] - 3, undefined, GRID_FONT_SIZE);
            const startY = y + Math.max(0, (rowH - 2 - wrapped.length * GRID_LH) / 2);
            wrapped.forEach((runs, lineIndex) => {
              const lineW = runsWidth(runs, GRID_FONT_SIZE);
              drawRuns(runs, cx + Math.max(1.5, (colW[i] - lineW) / 2), startY + lineIndex * GRID_LH, undefined, GRID_FONT_SIZE);
            });
            cx += colW[i];
          });
          y += rowH;
        };
        drawRow(block.header, true);
        block.rows.forEach((row) => drawRow(row, false));
        y += 1;
        break;
      }
      case 'rule':
        ensureSpace(2);
        doc.setLineDashPattern([1.5, 1], 0);
        doc.line(ML, y, PAGE_W - MR, y);
        doc.setLineDashPattern([], 0);
        y += 3;
        break;
      case 'gap':
        y += block.mm ?? 2;
        break;
      default:
        break;
    }
  });

  if (watermark) {
    await addEmblemImageWatermark(doc);
  }

  return doc;
}
