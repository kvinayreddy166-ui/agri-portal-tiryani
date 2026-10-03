import type { jsPDF as JsPdfInstance } from 'jspdf';

import { DOCX_TELUGU_FONT } from '../../../shared/lib/pdfUnicodeFonts';

const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const RIGHT_EDGE = PAGE_WIDTH - MARGIN_RIGHT;
const LINE_PITCH = 4.5;
const BASELINE_OFFSET = 3.4;
const WORD_FONT = 'Times New Roman';
const PT_PER_MM = 72 / 25.4;
const mmToTwips = (mm: number) => Math.round(mm * 56.6929);
const mmToEmu = (mm: number) => Math.round(mm * 36000);
const mmToPx = (mm: number) => Math.round(mm * 3.7795);

type TextItem = { page: number; text: string; left: number; right: number; y: number; bold: boolean; size: number };
type LineItem = { page: number; x1: number; y1: number; x2: number; y2: number };
type ImageItem = { page: number; data: string; x: number; y: number; w: number; h: number };
type Run = { text: string; bold: boolean; size: number; underline?: boolean };
type Segment = { left: number; right: number; runs: Run[]; underline: boolean };
type Row = { page: number; y: number; segs: Segment[]; full: boolean };

export type CoveringLetterRecorder = {
  attach: (doc: JsPdfInstance) => void;
  buildDocx: () => Promise<Blob>;
};

export function createCoveringLetterRecorder(): CoveringLetterRecorder {
  const texts: TextItem[] = [];
  const lines: LineItem[] = [];
  const images: ImageItem[] = [];
  let recorded: JsPdfInstance | null = null;

  const attach = (doc: JsPdfInstance) => {
    recorded = doc;
    const anyDoc = doc as any;
    const page = () => doc.getCurrentPageInfo().pageNumber;

    const originalText = anyDoc.text.bind(doc);
    anyDoc.text = (text: unknown, x: number, y: number, options?: { align?: string }, ...rest: unknown[]) => {
      try {
        const rawLines = Array.isArray(text) ? text.map(String) : String(text ?? '').split('\n');
        const font = doc.getFont();
        const size = doc.getFontSize();
        const pitch = (size / PT_PER_MM) * doc.getLineHeightFactor();
        rawLines.forEach((line, index) => {
          const width = doc.getTextWidth(line);
          const align = options?.align;
          const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
          texts.push({
            page: page(),
            text: line,
            left,
            right: left + width,
            y: y + index * pitch,
            bold: /bold/i.test(font.fontStyle || ''),
            size: font.fontName === 'courier' ? -size : size,
          });
        });
      } catch {
        /* recording must never break PDF generation */
      }
      return originalText(text, x, y, options, ...rest);
    };

    const originalLine = anyDoc.line.bind(doc);
    anyDoc.line = (x1: number, y1: number, x2: number, y2: number, ...rest: unknown[]) => {
      lines.push({ page: page(), x1, y1, x2, y2 });
      return originalLine(x1, y1, x2, y2, ...rest);
    };

    const originalAddImage = anyDoc.addImage.bind(doc);
    anyDoc.addImage = (data: unknown, format: unknown, x: number, y: number, w: number, h: number, ...rest: unknown[]) => {
      if (typeof data === 'string') images.push({ page: page(), data, x, y, w, h });
      return originalAddImage(data, format, x, y, w, h, ...rest);
    };
  };

  const buildRows = (tableRegion: { page: number; endPage: number; startY: number; finalY: number } | null): Row[] => {
    const inTable = (item: TextItem) => {
      if (!tableRegion) return false;
      if (item.page < tableRegion.page || item.page > tableRegion.endPage) return false;
      if (item.page === tableRegion.page && item.y < tableRegion.startY - 0.5) return false;
      if (item.page === tableRegion.endPage && item.y > tableRegion.finalY + 0.01) return false;
      return true;
    };
    const items = texts
      .filter((item) => item.size > 0 && item.text.trim() && !/^\(Cont'd/.test(item.text) && !inTable(item))
      .sort((a, b) => a.page - b.page || a.y - b.y || a.left - b.left);

    const groups: TextItem[][] = [];
    items.forEach((item) => {
      const last = groups[groups.length - 1];
      if (last && last[0].page === item.page && Math.abs(last[0].y - item.y) < 0.35) last.push(item);
      else groups.push([item]);
    });

    return groups.map((group) => {
      group.sort((a, b) => a.left - b.left);
      const lastRight = group[group.length - 1].right;
      const justified = group.length >= 4 && lastRight >= RIGHT_EDGE - 4.5;
      const segs: Segment[] = [];
      let current: Segment | null = null;
      let prev: TextItem | null = null;
      group.forEach((item) => {
        const gap = prev ? item.left - prev.right : 0;
        const run: Run = { text: item.text, bold: item.bold, size: item.size };
        if (!current || (!justified && gap > 12)) {
          current = { left: item.left, right: item.right, runs: [run], underline: false };
          segs.push(current);
        } else {
          const lastRun = current.runs[current.runs.length - 1];
          const needsSpace = !(lastRun.text.endsWith(' ') || item.text.startsWith(' ') || gap < 0.3);
          if (needsSpace) lastRun.text += ' ';
          if (lastRun.bold === run.bold && lastRun.size === run.size) lastRun.text += run.text;
          else current.runs.push(run);
          current.right = item.right;
        }
        prev = item;
      });
      segs.forEach((seg) => {
        seg.underline = lines.some((line) =>
          line.page === group[0].page
          && Math.abs(line.y1 - line.y2) < 0.01
          && line.y1 > group[0].y + 0.2 && line.y1 < group[0].y + 1.8
          && line.x1 <= seg.left + 0.6 && line.x2 >= seg.right - 0.6);
      });
      const full = segs.length === 1 && segs[0].right >= RIGHT_EDGE - 4.5 && segs[0].left <= MARGIN_LEFT + 12.5;
      return { page: group[0].page, y: group[0].y, segs, full };
    });
  };

  const toPng = async (dataUrl: string, alpha = 1): Promise<Uint8Array | null> => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.globalAlpha = alpha;
      context.drawImage(bitmap, 0, 0);
      const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      return png ? new Uint8Array(await png.arrayBuffer()) : null;
    } catch {
      return null;
    }
  };

  const buildDocx = async () => {
    const {
      AlignmentType,
      BorderStyle,
      Document,
      Header,
      HorizontalPositionRelativeFrom,
      ImageRun,
      LineRuleType,
      Packer,
      Paragraph,
      Table,
      TableCell,
      TableLayoutType,
      TableRow,
      TabStopType,
      TextRun,
      TextWrappingType,
      UnderlineType,
      VerticalAlign,
      VerticalPositionRelativeFrom,
      WidthType,
    } = await import('docx');

    const autoTable = (recorded as any)?.lastAutoTable as any;
    const tableRegion = autoTable
      ? {
          page: autoTable.startPageNumber || 1,
          endPage: (autoTable.startPageNumber || 1) + (autoTable.pageNumber || 1) - 1,
          startY: autoTable.settings?.startY ?? 0,
          finalY: autoTable.finalY ?? 0,
        }
      : null;
    const rows = buildRows(tableRegion);

    const font = { ascii: WORD_FONT, hAnsi: WORD_FONT, eastAsia: WORD_FONT, cs: DOCX_TELUGU_FONT };
    const makeRuns = (runs: Run[], forceUnderline = false) => runs.map((run) => new TextRun({
      text: run.text,
      bold: run.bold,
      underline: forceUnderline ? { type: UnderlineType.SINGLE } : undefined,
      font,
      size: Math.round(run.size * 2),
    }));
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
    const lineBorder = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
    const gridBorders = { top: lineBorder, bottom: lineBorder, left: lineBorder, right: lineBorder };

    const firstEmblem = images.find((image) => image.w < 40);
    const watermark = images.find((image) => image.w >= 100);
    const firstRow = rows[0];
    const firstTop = Math.min(
      firstRow ? firstRow.y - BASELINE_OFFSET : 10,
      firstEmblem ? firstEmblem.y : Number.POSITIVE_INFINITY,
    );
    const topMargin = Math.max(4, Math.min(firstTop, 30));

    type Block = { node: any };
    const blocks: Block[] = [];
    let previousBottom: number | null = null;
    let previousPage = firstRow ? firstRow.page : 1;
    let footerStarted = false;

    const spacingFor = (lineTopY: number, page: number) => {
      const newPage = page !== previousPage;
      const reference = newPage || previousBottom === null ? topMargin : previousBottom;
      return { newPage, before: Math.max(0, lineTopY - reference) };
    };

    const emitTable = () => {
      if (!autoTable) return;
      const columns = autoTable.columns as any[];
      const widths = columns.map((column) => mmToTwips(column.width));
      const cellFor = (cell: any, bold: boolean) => {
        const cellLines: string[] = Array.isArray(cell?.text) ? cell.text : [String(cell?.text ?? '')];
        const size = cell?.styles?.fontSize || 11;
        return new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 40, bottom: 40, left: 85, right: 85 },
          children: cellLines.map((line) => new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: mmToTwips(LINE_PITCH), lineRule: LineRuleType.AT_LEAST },
            children: [new TextRun({ text: line, bold: bold || /bold/i.test(cell?.styles?.fontStyle || ''), font, size: Math.round(size * 2) })],
          })),
        });
      };
      const makeRow = (row: any, header: boolean) => new TableRow({
        cantSplit: true,
        tableHeader: header,
        children: columns.map((column) => cellFor(row.cells[column.dataKey], header)),
      });
      const tableRows = [
        ...(autoTable.head as any[]).map((row) => makeRow(row, true)),
        ...(autoTable.body as any[]).map((row) => makeRow(row, false)),
      ];
      const { before, newPage } = spacingFor(tableRegion!.startY - 0.5, previousPage);
      if (before > 0.2 || newPage) {
        blocks.push({
          node: new Paragraph({
            children: [],
            spacing: { before: 0, after: 0, line: Math.max(20, mmToTwips(before)), lineRule: LineRuleType.EXACT },
          }),
        });
      }
      blocks.push({
        node: new Table({
          rows: tableRows,
          width: { size: widths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
          columnWidths: widths,
          layout: TableLayoutType.FIXED,
          borders: { ...gridBorders, insideHorizontal: lineBorder, insideVertical: lineBorder },
        }),
      });
      previousBottom = tableRegion!.finalY;
      previousPage = tableRegion!.endPage;
    };

    let tableEmitted = false;
    const emitTableIfDue = (row?: Row) => {
      if (tableEmitted || !tableRegion) return;
      if (!row || row.page > tableRegion.page || (row.page === tableRegion.page && row.y >= tableRegion.startY)) {
        tableEmitted = true;
        emitTable();
      }
    };

    const lineSpacing = (size: number, pitch = LINE_PITCH) => (size > 12
      ? { line: mmToTwips(pitch), lineRule: LineRuleType.AT_LEAST }
      : { line: mmToTwips(pitch), lineRule: LineRuleType.EXACT });

    let index = 0;
    while (index < rows.length) {
      const row = rows[index];
      emitTableIfDue(row);
      const text = row.segs.map((seg) => seg.runs.map((run) => run.text).join('')).join(' ');

      if (/^GOVERNMENT OF TELANGANA/.test(text) && firstEmblem && rows[index + 1]) {
        const govRow = row;
        const deptRow = rows[index + 1];
        const govSeg = govRow.segs[0];
        const deptSeg = deptRow.segs[0];
        const emblemData = await toPng(firstEmblem.data);
        const emblemWidth = mmToTwips(firstEmblem.w + 1.5);
        const textWidth = mmToTwips(Math.max(govSeg.right - govSeg.left, deptSeg.right - govSeg.left) + 3);
        const cellPara = (seg: Segment, indent: number) => new Paragraph({
          spacing: { before: 0, after: 0, ...lineSpacing(seg.runs[0].size, 5.2) },
          indent: { left: mmToTwips(Math.max(0, indent)) },
          children: makeRuns(seg.runs),
        });
        const { before, newPage } = spacingFor(firstEmblem.y, govRow.page);
        if (before > 0.2 || newPage) {
          blocks.push({ node: new Paragraph({ children: [], spacing: { before: 0, after: 0, line: Math.max(20, mmToTwips(before)), lineRule: LineRuleType.EXACT } }) });
        }
        blocks.push({
          node: new Table({
            rows: [new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: emblemWidth, type: WidthType.DXA },
                  borders: noBorders,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [new Paragraph({
                    spacing: { before: 0, after: 0 },
                    children: emblemData
                      ? [new ImageRun({ type: 'png', data: emblemData, transformation: { width: mmToPx(firstEmblem.w), height: mmToPx(firstEmblem.h) } })]
                      : [],
                  })],
                }),
                new TableCell({
                  width: { size: textWidth, type: WidthType.DXA },
                  borders: noBorders,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [cellPara(govSeg, 0), cellPara(deptSeg, deptSeg.left - govSeg.left)],
                }),
              ],
            })],
            width: { size: emblemWidth + textWidth, type: WidthType.DXA },
            columnWidths: [emblemWidth, textWidth],
            indent: { size: mmToTwips(Math.max(0, firstEmblem.x - MARGIN_LEFT)), type: WidthType.DXA },
            layout: TableLayoutType.FIXED,
            borders: { ...noBorders, insideHorizontal: noBorder, insideVertical: noBorder },
          }),
        });
        previousBottom = Math.max(firstEmblem.y + firstEmblem.h, deptRow.y + 1.2);
        previousPage = govRow.page;
        index += 2;
        continue;
      }

      const size = row.segs[0].runs[0].size;
      const { before, newPage } = spacingFor(row.y - BASELINE_OFFSET, row.page);
      const base = { before: mmToTwips(before) };
      const isFooterStart = /^(Enclosures:|Yours faithfully)/.test(text);
      if (isFooterStart) footerStarted = true;
      const pageBreakBefore = newPage;

      if (row.segs.length > 1) {
        const first = row.segs[0];
        const tabStops = row.segs.slice(1).map((seg) => ({ type: TabStopType.LEFT, position: mmToTwips(seg.left - MARGIN_LEFT) }));
        const children: any[] = [];
        row.segs.forEach((seg, segIndex) => {
          if (segIndex > 0) children.push(new TextRun({ text: '\t', font, size: Math.round(size * 2) }));
          children.push(...makeRuns(seg.runs, seg.underline));
        });
        blocks.push({
          node: new Paragraph({
            keepNext: footerStarted,
            children,
            tabStops,
            pageBreakBefore,
            indent: { left: mmToTwips(Math.max(0, first.left - MARGIN_LEFT)), right: -mmToTwips(4) },
            spacing: { ...base, after: 0, ...lineSpacing(size) },
          }),
        });
        previousBottom = row.y + 1.1;
        previousPage = row.page;
        index += 1;
        continue;
      }

      const seg = row.segs[0];
      const centerX = (seg.left + seg.right) / 2;
      const isCenter = Math.abs(centerX - PAGE_WIDTH / 2) < 1.5 && seg.left > MARGIN_LEFT + 2;
      const isRight = !isCenter && Math.abs(seg.right - RIGHT_EDGE) < 0.8 && seg.left > MARGIN_LEFT + 40;

      if (!isCenter && !isRight && row.full) {
        let last = index;
        while (
          rows[last].full
          && rows[last + 1]
          && rows[last + 1].page === row.page
          && rows[last + 1].segs.length === 1
          && Math.abs(rows[last + 1].segs[0].left - MARGIN_LEFT) < 0.4
          && rows[last + 1].y - rows[last].y <= 5.3
        ) last += 1;
        const paragraphRows = rows.slice(index, last + 1);
        const runs: Run[] = [];
        paragraphRows.forEach((paragraphRow, rowIndex) => {
          paragraphRow.segs[0].runs.forEach((run, runIndex) => {
            const text = rowIndex > 0 && runIndex === 0 && runs.length && !runs[runs.length - 1].text.endsWith(' ') ? ` ${run.text}` : run.text;
            const lastRun = runs[runs.length - 1];
            if (lastRun && lastRun.bold === run.bold && lastRun.size === run.size) lastRun.text += text;
            else runs.push({ ...run, text });
          });
        });
        const pitch = paragraphRows.length > 1 ? paragraphRows[1].y - paragraphRows[0].y : LINE_PITCH;
        blocks.push({
          node: new Paragraph({
            keepNext: footerStarted,
            children: makeRuns(runs),
            alignment: AlignmentType.JUSTIFIED,
            pageBreakBefore,
            indent: { left: 0, firstLine: mmToTwips(Math.max(0, seg.left - MARGIN_LEFT)) },
            spacing: { ...base, after: 0, ...lineSpacing(size, Math.min(Math.max(pitch, LINE_PITCH), 5.2)) },
          }),
        });
        previousBottom = paragraphRows[paragraphRows.length - 1].y + 1.1;
        previousPage = row.page;
        index = last + 1;
        continue;
      }

      blocks.push({
        node: new Paragraph({
          keepNext: footerStarted,
          children: makeRuns(seg.runs, seg.underline),
          alignment: isCenter ? AlignmentType.CENTER : isRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
          pageBreakBefore,
          indent: isCenter || isRight
            ? undefined
            : { left: mmToTwips(Math.max(0, seg.left - MARGIN_LEFT)), right: -mmToTwips(4) },
          spacing: { ...base, after: 0, ...lineSpacing(size) },
        }),
      });
      previousBottom = row.y + 1.1;
      previousPage = row.page;
      index += 1;
    }
    emitTableIfDue();

    const children = blocks.map((block) => block.node);

    const watermarkData = watermark ? await toPng(watermark.data, 0.14) : null;
    const header = new Header({
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: watermark && watermarkData
          ? [new ImageRun({
              type: 'png',
              data: watermarkData,
              transformation: { width: mmToPx(watermark.w), height: mmToPx(watermark.h) },
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: mmToEmu(watermark.x) },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: mmToEmu(watermark.y) },
                behindDocument: true,
                allowOverlap: true,
                wrap: { type: TextWrappingType.NONE },
              },
            })]
          : [],
      })],
    });

    const document = new Document({
      creator: 'AGRONIX',
      styles: { default: { document: { run: { font, size: 24, color: '000000' } } } },
      sections: [{
        properties: {
          page: {
            size: { width: mmToTwips(PAGE_WIDTH), height: mmToTwips(PAGE_HEIGHT) },
            margin: {
              top: mmToTwips(topMargin),
              bottom: mmToTwips(6),
              left: mmToTwips(MARGIN_LEFT),
              right: mmToTwips(MARGIN_RIGHT),
              header: 0,
              footer: 0,
            },
          },
        },
        headers: { default: header },
        children: children as any[],
      }],
    });
    return Packer.toBlob(document);
  };

  return { attach, buildDocx };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
