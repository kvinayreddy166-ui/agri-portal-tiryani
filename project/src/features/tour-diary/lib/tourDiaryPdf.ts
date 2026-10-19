import { setupPdfUnicodeFonts } from '../../../shared/lib/pdfUnicodeFonts';
import { MONTHS, TOUR_DIARY_COLUMN_COUNT, getDaysInMonth, formatDate } from './tourDiaryData';
import type { SpecialDateStatus } from '../types/tourDiaryTypes';

export interface GenerateTourDiaryPdfOptions {
  currentYear: number;
  currentMonth: number;
  displayName: string;
  displayDesignation: string;
  displayMandal: string;
  displayDivision: string;
  displayDistrict: string;
  shouldShowMandal: boolean;
  shouldShowDivision: boolean;
  normalizedDesignation: string;
  tableData: any[][];
  summary: {
    totalDistance: number;
    workingDays: number;
    tourDays: number;
    leavesAvailed: number;
    villagesVisited: number;
  };
  specialPdfRowStatuses?: (SpecialDateStatus | null)[];
  forPrint?: boolean;
}

export interface TitleSegment {
  text: string;
  bold: boolean;
}

export interface TitleToken {
  text: string;
  bold: boolean;
  width: number;
  isSpace: boolean;
  isCommaBreak: boolean;
}

export function splitTitleSegments(
  doc: any,
  segs: TitleSegment[],
  maxWidth = 260
): TitleToken[][] {
  doc.setFontSize(10);
  let totalWidth = 0;
  for (const seg of segs) {
    doc.setFont('times', seg.bold ? 'bold' : 'normal');
    totalWidth += doc.getTextWidth(seg.text);
  }

  if (totalWidth <= maxWidth) {
    return [
      segs.map((seg) => {
        doc.setFont('times', seg.bold ? 'bold' : 'normal');
        return {
          text: seg.text,
          bold: seg.bold,
          width: doc.getTextWidth(seg.text),
          isSpace: /^\s+$/.test(seg.text),
          isCommaBreak: /,\s*$/.test(seg.text),
        };
      }),
    ];
  }

  const tokens: TitleToken[] = [];
  for (const seg of segs) {
    const parts = seg.text.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      doc.setFont('times', seg.bold ? 'bold' : 'normal');
      tokens.push({
        text: part,
        bold: seg.bold,
        width: doc.getTextWidth(part),
        isSpace: /^\s+$/.test(part),
        isCommaBreak: /,\s*$/.test(part),
      });
    }
  }

  let bestSplit = -1;
  let minCost = Infinity;
  let w1 = 0;
  for (let i = 0; i < tokens.length - 1; i++) {
    w1 += tokens[i].width;
    const w2 = totalWidth - w1;
    if (w1 <= maxWidth && w2 <= maxWidth) {
      let cost = Math.abs(w1 - w2);
      if (tokens[i].isCommaBreak || tokens[i].text.includes(',')) {
        cost -= 40;
      }
      if (tokens[i].text === 'of' || tokens[i].text === 'Month' || tokens[i].text === 'the') {
        cost += 30;
      }
      if (cost < minCost) {
        minCost = cost;
        bestSplit = i;
      }
    }
  }

  if (bestSplit !== -1) {
    const l1 = tokens.slice(0, bestSplit + 1);
    const l2 = tokens.slice(bestSplit + 1);
    while (l1.length > 0 && l1[l1.length - 1].isSpace) l1.pop();
    while (l2.length > 0 && l2[0].isSpace) l2.shift();
    return [l1, l2];
  }

  const lines: TitleToken[][] = [];
  let cur: TitleToken[] = [];
  let curW = 0;
  for (const tok of tokens) {
    if (cur.length > 0 && curW + tok.width > maxWidth && !tok.isSpace) {
      while (cur.length > 0 && cur[cur.length - 1].isSpace) cur.pop();
      lines.push(cur);
      cur = [];
      curW = 0;
      if (tok.isSpace) continue;
    }
    cur.push(tok);
    curW += tok.width;
  }
  if (cur.length > 0) {
    while (cur.length > 0 && cur[cur.length - 1].isSpace) cur.pop();
    lines.push(cur);
  }
  return lines;
}

export async function generateTourDiaryPdf(options: GenerateTourDiaryPdfOptions): Promise<void> {
  const {
    currentYear,
    currentMonth,
    displayName,
    displayDesignation,
    displayMandal,
    displayDivision,
    displayDistrict,
    shouldShowMandal,
    shouldShowDivision,
    normalizedDesignation,
    tableData: rawTableData,
    summary,
    specialPdfRowStatuses,
    forPrint = false,
  } = options;

  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF('l', 'mm', 'a4');
  await setupPdfUnicodeFonts(doc);

  let tableData = [...rawTableData];

  // If table is empty, generate empty rows for the month
  if (tableData.length === 0) {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(currentYear, currentMonth, day);
      tableData.push([date, '', '', '', '', '', '', '', '', '']);
    }
  }

  // Ensure all rows are arrays with exact column count
  const validatedTableData = tableData.map((row) => {
    if (!Array.isArray(row)) {
      return Array(TOUR_DIARY_COLUMN_COUNT).fill('');
    }
    return Array.from({ length: TOUR_DIARY_COLUMN_COUNT }, (_, index) => row[index] ?? '');
  });

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const monthYear = `${MONTHS[currentMonth - 1]}-${currentYear}`;

  const segments: TitleSegment[] = [
    { text: 'Tour Diary of ', bold: false },
    { text: displayName, bold: true },
    { text: ', ', bold: false },
    { text: displayDesignation, bold: true },
  ];
  if (shouldShowMandal && displayMandal !== '....................') {
    segments.push({ text: ', ', bold: false }, { text: displayMandal, bold: true });
  }
  if (shouldShowDivision && displayDivision !== '....................') {
    segments.push({ text: ', Division: ', bold: false }, { text: displayDivision, bold: true });
  }
  if (displayDistrict !== '....................') {
    segments.push({ text: ', Dist: ', bold: false }, { text: displayDistrict, bold: true });
  }
  segments.push(
    { text: ' for the Month of ', bold: false },
    { text: monthYear, bold: true },
    { text: '.', bold: false }
  );

  const titleLines = splitTitleSegments(doc, segments, 260);
  const isMultiLine = titleLines.length > 1;
  const tableStartY = isMultiLine ? 16 : 14;

  const drawDiaryTitle = () => {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    const startTitleY = isMultiLine ? 8.0 : 12;
    const lineSpacing = 4.2;
    const tableCenterX = 144;

    titleLines.forEach((lineTokens, lineIndex) => {
      const yPos = startTitleY + lineIndex * lineSpacing;
      const lineWidth = lineTokens.reduce((sum, tok) => sum + tok.width, 0);
      let xPos = Math.max(14, tableCenterX - lineWidth / 2);

      for (const tok of lineTokens) {
        doc.setFont('times', tok.bold ? 'bold' : 'normal');
        doc.text(tok.text, xPos, yPos);
        xPos += tok.width;
      }
    });
  };

  drawDiaryTitle();

  // Generate table with merged header cells
  autoTable(doc, {
    startY: tableStartY,
    margin: { top: tableStartY, left: 14, right: 14, bottom: 8 },
    rowPageBreak: 'avoid',
    tableWidth: 'wrap',
    head: [
      ['DATE', 'VISITING PLACE', '', 'VISITING TIME', '', 'MODE OF JOURNEY', 'METER READING', '', 'DISTANCE (KM)', 'PURPOSE OF VISIT'],
      ['', 'FROM', 'TO', 'FROM', 'TO', '', 'FROM', 'TO', '', ''],
    ],
    body: validatedTableData,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8,
      cellPadding: 0.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 36, halign: 'center' },
      2: { cellWidth: 38, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 18, halign: 'center' },
      9: { cellWidth: 56, halign: 'center' },
    },
    didParseCell: (data) => {
      data.cell.styles.textColor = [0, 0, 0];
      data.cell.styles.lineColor = [0, 0, 0];

      if (data.section === 'body' && specialPdfRowStatuses) {
        const specialDateStatus = specialPdfRowStatuses[data.row.index];
        if (specialDateStatus) {
          if (data.column.index === 0) {
            data.cell.styles.fontStyle = 'normal';
            data.cell.styles.halign = 'center';
            data.cell.styles.valign = 'middle';
            data.cell.styles.textColor = [0, 0, 0];
          } else if (data.column.index === 1) {
            data.cell.text = [specialDateStatus.label];
            data.cell.colSpan = TOUR_DIARY_COLUMN_COUNT - 1;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.halign = 'center';
            data.cell.styles.valign = 'middle';
            data.cell.styles.overflow = 'hidden';
            data.cell.styles.textColor = [0, 0, 0];
          } else {
            data.cell.colSpan = 0;
          }
          return;
        }
      }

      if (data.section === 'head') {
        if (data.row.index === 0 && (data.column.index === 1 || data.column.index === 3 || data.column.index === 6)) {
          data.cell.colSpan = 2;
        } else if (data.row.index === 0 && (data.column.index === 2 || data.column.index === 4 || data.column.index === 7)) {
          data.cell.colSpan = 0;
        }
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setTextColor(0, 0, 0);
        drawDiaryTitle();
      }
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(summary.totalDistance.toFixed(0), 209, finalY + 3, { align: 'center' });
  doc.setFont('times', 'normal');

  const pageHeight = doc.internal.pageSize.getHeight();
  const printableBottom = pageHeight - 8;
  let abstractY = finalY + 7;
  if (abstractY + 19 > printableBottom) {
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    drawDiaryTitle();
    abstractY = isMultiLine ? 28 : 26;
  }

  doc.setFontSize(8);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.text('ABSTRACT', 14, abstractY);
  const textWidth = doc.getTextWidth('ABSTRACT');
  doc.line(14, abstractY + 0.5, 14 + textWidth, abstractY + 0.5);

  const drawAbstractValue = (label: string, value: string | number, x: number, y: number) => {
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    const spacedLabel = label.replace(/of /g, 'of  ');
    doc.text(spacedLabel, x, y);
    const valueX = x + doc.getTextWidth(spacedLabel);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(String(value), valueX, y);
  };

  drawAbstractValue('\u2022 Total No. of Working Days: ', summary.workingDays, 14, abstractY + 4);
  drawAbstractValue('\u2022 Total No. of Days on Tour: ', summary.tourDays, 14, abstractY + 6.5);
  drawAbstractValue('\u2022 Leaves Availed: ', summary.leavesAvailed, 14, abstractY + 9);
  drawAbstractValue('\u2022 No. of Villages Visited: ', summary.villagesVisited, 14, abstractY + 11.5);

  // Signature section - conditional based on officer designation (moved down by 4 pt)
  const signatureY = abstractY + 7.5 + (4 * 25.4 / 72);
  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  if (normalizedDesignation === 'mandal agriculture officer') {
    doc.text('Mandal Agriculture Officer', 94, signatureY);
    doc.text('Asst.Director of Agriculture', 200, signatureY);
  } else if (normalizedDesignation === 'district agriculture officer') {
    doc.text('District Agriculture Officer', 94, signatureY);
  } else if (normalizedDesignation === 'asst director of agriculture' || normalizedDesignation === 'assistant director of agriculture') {
    doc.text('Asst.Director of Agriculture (R)', 94, signatureY);
  } else if (normalizedDesignation) {
    doc.text('Asst.Director of Agriculture', 200, signatureY);
  }

  const fileName = `Tour_Diary_${MONTHS[currentMonth - 1]}_${currentYear}.pdf`;

  if (forPrint) {
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(pdfUrl);
      };
    } else {
      URL.revokeObjectURL(pdfUrl);
      throw new Error('Print popup blocked. Please allow popups for this site.');
    }
  } else {
    doc.save(fileName);
  }
}
