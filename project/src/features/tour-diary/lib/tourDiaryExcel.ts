import { MONTHS } from './tourDiaryData';

export interface ExportTourDiaryExcelOptions {
  currentYear: number;
  currentMonth: number;
  displayName: string;
  displayDesignation: string;
  displayMandal: string;
  displayDivision: string;
  displayDistrict: string;
  normalizedDesignation: string;
  tableData: string[][];
  summary: {
    totalDistance: number;
    workingDays: number;
    tourDays: number;
    leavesAvailed: number;
    villagesVisited: number;
  };
}

export async function exportTourDiaryExcel(options: ExportTourDiaryExcelOptions): Promise<void> {
  const {
    currentYear,
    currentMonth,
    displayName,
    displayDesignation,
    displayMandal,
    displayDivision,
    displayDistrict,
    normalizedDesignation,
    tableData,
    summary,
  } = options;

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AGRONIX';
  const sheet = workbook.addWorksheet('Tour Diary', {
    views: [{ showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });

  const columnWidths = [12, 18, 18, 10, 10, 16, 10, 10, 12, 38];
  sheet.columns = columnWidths.map((width) => ({ width }));

  const FONT_NAME = 'Times New Roman';
  const thin = { style: 'thin' as const, color: { argb: 'FF000000' } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };
  const monthYear = `${MONTHS[currentMonth - 1]}-${currentYear}`;

  // Title
  sheet.mergeCells('A1:J1');
  const title = sheet.getCell('A1');
  title.value = `Tour Diary of ${displayName || ''}, ${displayDesignation}, ${displayMandal}, Division: ${displayDivision}, Dist: ${displayDistrict} for the Month of ${monthYear}.`;
  title.font = { name: FONT_NAME, size: 12, bold: true };
  title.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 36;
  sheet.getRow(2).height = 8;

  // Column headings (two rows, merged groups)
  const headingRows: string[][] = [
    ['Date', 'VISITING PLACE', '', 'VISITING TIME', '', 'MODE OF JOURNEY', 'METER READING', '', 'DISTANCE (KM)', 'PURPOSE OF VISIT'],
    ['', 'FROM', 'TO', 'FROM', 'TO', '', 'From', 'To', '', ''],
  ];
  headingRows.forEach((values, rowIndex) => {
    const row = sheet.getRow(3 + rowIndex);
    values.forEach((value, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      cell.value = value;
    });
    row.height = 20;
  });
  ['A3:A4', 'B3:C3', 'D3:E3', 'F3:F4', 'G3:H3', 'I3:I4', 'J3:J4'].forEach((range) => sheet.mergeCells(range));
  for (let rowNumber = 3; rowNumber <= 4; rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= 10; columnNumber += 1) {
      const cell = sheet.getRow(rowNumber).getCell(columnNumber);
      cell.font = { name: FONT_NAME, size: 11, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = border;
    }
  }

  // Data rows
  tableData.forEach((values) => {
    const row = sheet.addRow(values);
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.border = border;
      cell.alignment = { horizontal: columnNumber === 10 ? 'left' : 'center', vertical: 'middle', wrapText: true };
    });
  });

  // Total distance below the distance column
  const totalRow = sheet.addRow(['', '', '', '', '', '', '', '', summary.totalDistance.toFixed(0), '']);
  totalRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    if (columnNumber !== 9) return;
    cell.font = { name: FONT_NAME, size: 11, bold: true };
    cell.border = border;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Abstract
  sheet.addRow([]);
  const abstractHeading = sheet.addRow(['ABSTRACT']);
  abstractHeading.getCell(1).font = { name: FONT_NAME, size: 11, bold: true, underline: true };
  const addAbstractRow = (label: string, value: string) => {
    const row = sheet.addRow([label, '', value, '', '', '', '', '', '']);
    const rowNumber = row.number;
    sheet.mergeCells(`A${rowNumber}:B${rowNumber}`);
    const spacedLabel = label.replace(/of /g, 'of  ');
    row.getCell(1).value = spacedLabel;
    [1, 3].forEach((columnNumber) => {
      const cell = row.getCell(columnNumber);
      const isValue = columnNumber === 3;
      cell.font = { name: FONT_NAME, size: 11, bold: isValue };
      cell.alignment = { horizontal: isValue ? 'center' : 'left', vertical: 'middle' };
    });
  };
  addAbstractRow('• Total No. of Working Days', String(summary.workingDays));
  addAbstractRow('• Total No. of Days on Tour', String(summary.tourDays));
  addAbstractRow('• Leaves Availed', String(summary.leavesAvailed));
  addAbstractRow('• No. of Villages Visited', String(summary.villagesVisited));

  // Signature section
  sheet.addRow([]);

  if (normalizedDesignation === 'mandal agriculture officer') {
    const sigRow1 = sheet.addRow(['Mandal Agriculture Officer', '', '', '', '', 'Asst.Director of Agriculture', '', '', '', '']);
    sheet.mergeCells(`A${sigRow1.number}:E${sigRow1.number}`);
    sheet.mergeCells(`F${sigRow1.number}:J${sigRow1.number}`);
    sigRow1.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  } else if (normalizedDesignation === 'district agriculture officer') {
    const sigRow1 = sheet.addRow(['District Agriculture Officer', '', '', '', '', '', '', '', '', '']);
    sheet.mergeCells(`A${sigRow1.number}:E${sigRow1.number}`);
    sigRow1.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  } else if (normalizedDesignation === 'asst director of agriculture' || normalizedDesignation === 'assistant director of agriculture') {
    const sigRow1 = sheet.addRow(['Asst.Director of Agriculture (R)', '', '', '', '', '', '', '', '', '']);
    sheet.mergeCells(`A${sigRow1.number}:E${sigRow1.number}`);
    sigRow1.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  } else if (normalizedDesignation) {
    const sigRow1 = sheet.addRow(['', '', '', '', '', 'Asst.Director of Agriculture', '', '', '', '']);
    sheet.mergeCells(`F${sigRow1.number}:J${sigRow1.number}`);
    sigRow1.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT_NAME, size: 11 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  }

  sheet.pageSetup.printTitlesRow = '3:4';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Tour_Diary_${MONTHS[currentMonth - 1]}_${currentYear}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
