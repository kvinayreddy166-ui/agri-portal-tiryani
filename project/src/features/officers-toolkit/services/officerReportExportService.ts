import type { OfficerDocumentArchiveRecord } from '../types/officerArchiveTypes';
import type { UnifiedOfficerRecord } from './officerCloudSyncService';

export interface ReportExportOptions {
  activeTab: 'documents' | 'forms' | 'enforcement';
  categoryFilter?: string;
  commodityFilter?: string;
  searchQuery?: string;
  officerName?: string;
  designation?: string;
  location?: string;
  /** Optional per-record result overrides keyed by record id (e.g. sample status chosen at export time). */
  statusOverrides?: Record<string, string>;
}

export interface ExtractedReportRow {
  sNo: number;
  productName: string;
  firmName: string;
  firmAddress: string;
  codeNo: string;
  samplingDate: string;
  officerName: string;
  resultRemarks: string;
  rawCategory: string;
}

export class OfficerReportExportService {
  /**
   * Normalizes document or form records into standard report rows
   */
  static extractRows(
    documents: OfficerDocumentArchiveRecord[],
    forms: UnifiedOfficerRecord[],
    options: ReportExportOptions
  ): ExtractedReportRow[] {
    const isDocs = options.activeTab === 'documents';
    const defaultOfficer = options.officerName || 'Agricultural Officer / Inspector';

    if (isDocs) {
      return documents.map((doc, idx) => {
        const meta = (doc.metadata_json || {}) as Record<string, unknown>;
        const rawName = doc.document_name.replace(/\.[^.]+$/, '').replace(/_/g, ' ');

        const productName = String(
          meta.productName ||
            meta.product ||
            meta.fertilizerName ||
            meta.insecticideName ||
            meta.variety ||
            meta.commodity ||
            rawName
        );

        const firmName = String(
          meta.dealerName ||
            meta.firmName ||
            meta.dealer ||
            meta.entityName ||
            meta.firm ||
            '—'
        );

        const firmAddress = String(
          meta.dealerAddress ||
            meta.firmAddress ||
            meta.location ||
            meta.mandal ||
            meta.place ||
            options.location ||
            '—'
        );

        const codeNo = String(
          doc.document_number ||
            meta.codeNo ||
            meta.sampleCode ||
            meta.referenceNumber ||
            '—'
        );

        const samplingDate = String(doc.document_date || meta.samplingDate || meta.date || '—');

        const officerName = String(
          meta.officerName ||
            meta.inspectorName ||
            meta.officer ||
            defaultOfficer
        );

        const resultRemarks = String(
          options.statusOverrides?.[doc.id] ||
            meta.resultRemarks ||
            meta.remarks ||
            meta.result ||
            (doc.upload_status === 'saved_to_cloud' ? 'Archived to Cloud' : 'Recorded')
        );

        return {
          sNo: idx + 1,
          productName,
          firmName,
          firmAddress,
          codeNo,
          samplingDate,
          officerName,
          resultRemarks,
          rawCategory: doc.document_category,
        };
      });
    } else {
      return forms.map((rec, idx) => {
        const details = (rec.details || {}) as Record<string, unknown>;

        const productName = String(
          details.productName ||
            details.product ||
            details.fertilizerName ||
            details.insecticideName ||
            details.variety ||
            details.commodity ||
            rec.title
        );

        const firmName = String(
          rec.entityName ||
            details.dealerName ||
            details.firmName ||
            details.firm ||
            '—'
        );

        const firmAddress = String(
          rec.location ||
            details.dealerAddress ||
            details.firmAddress ||
            options.location ||
            '—'
        );

        const codeNo = String(
          rec.referenceNumber ||
            details.codeNo ||
            details.sampleCode ||
            details.referenceNumber ||
            '—'
        );

        const samplingDate = String(rec.recordDate || details.date || '—');

        const officerName = String(
          details.officerName ||
            details.inspectorName ||
            details.officer ||
            defaultOfficer
        );

        const resultRemarks = String(
          options.statusOverrides?.[rec.id] ||
            details.remarks ||
            details.result ||
            details.findings ||
            (rec.synced ? 'Synced to Cloud' : 'Saved on Device')
        );

        return {
          sNo: idx + 1,
          productName,
          firmName,
          firmAddress,
          codeNo,
          samplingDate,
          officerName,
          resultRemarks,
          rawCategory: rec.category,
        };
      });
    }
  }

  /**
   * Generates a context-aware report title
   */
  static getReportTitle(options: ReportExportOptions): { mainTitle: string; subTitle: string; filenameBase: string } {
    const cat = (options.categoryFilter || 'all').toLowerCase();
    const comm = (options.commodityFilter || 'all').toLowerCase();

    const commodityPrefix =
      comm === 'fertilizer' ? 'FERTILIZER ' :
      comm === 'seed' ? 'SEED ' :
      comm === 'pesticide' ? 'INSECTICIDE / PESTICIDE ' : '';

    const commodityFilePrefix =
      comm === 'fertilizer' ? 'Fertilizer_' :
      comm === 'seed' ? 'Seed_' :
      comm === 'pesticide' ? 'Pesticide_' : '';

    const isSample = cat === 'sample';
    const isOrder = cat === 'order';
    const isNotice = cat === 'notice';
    const isInspection = cat === 'inspection';

    if (isSample) {
      return {
        mainTitle: 'GOVERNMENT OF TELANGANA — DEPARTMENT OF AGRICULTURE',
        subTitle: `OFFICIAL STATUTORY ${commodityPrefix}SAMPLING REGISTER & CONSOLIDATED REPORT`,
        filenameBase: `Official_${commodityFilePrefix}Sampling_Register_Report`,
      };
    }

    if (isOrder) {
      return {
        mainTitle: 'GOVERNMENT OF TELANGANA — DEPARTMENT OF AGRICULTURE',
        subTitle: `STATUTORY ${commodityPrefix}ENFORCEMENT ORDERS (STOP SALE & SEIZURES) REGISTER`,
        filenameBase: `Statutory_${commodityFilePrefix}Enforcement_Orders_Register`,
      };
    }

    if (isNotice) {
      return {
        mainTitle: 'GOVERNMENT OF TELANGANA — DEPARTMENT OF AGRICULTURE',
        subTitle: `STATUTORY ${commodityPrefix}SHOW CAUSE NOTICES REGISTER & REPORT`,
        filenameBase: `Show_Cause_${commodityFilePrefix}Notices_Register`,
      };
    }

    if (isInspection) {
      return {
        mainTitle: 'GOVERNMENT OF TELANGANA — DEPARTMENT OF AGRICULTURE',
        subTitle: `DEALER ${commodityPrefix}INSPECTIONS & QUALITY CONTROL ENFORCEMENT REPORT`,
        filenameBase: `Dealer_${commodityFilePrefix}Inspections_Enforcement_Report`,
      };
    }

    return {
      mainTitle: 'GOVERNMENT OF TELANGANA — DEPARTMENT OF AGRICULTURE',
      subTitle: `OFFICIAL ${commodityPrefix}RECORDS & CLOUD STORAGE CONSOLIDATED REPORT`,
      filenameBase: `Official_${commodityFilePrefix}Records_Cloud_Storage_Report`,
    };
  }

  /**
   * Exports extracted rows to a formatted Excel workbook (.xlsx)
   */
  static async exportToExcel(
    rows: ExtractedReportRow[],
    options: ReportExportOptions
  ): Promise<void> {
    const ExcelJSModule = await import('exceljs');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AGRONIX — Agricultural Officer Portal';
    workbook.created = new Date();

    const { mainTitle, subTitle, filenameBase } = this.getReportTitle(options);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${filenameBase}_${dateStr}.xlsx`;

    const sheet = workbook.addWorksheet('Official Report', {
      pageSetup: {
        paperSize: 9, // A4
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    // 1. Header Banner
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = mainTitle;
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } }; // emerald-700
    sheet.getRow(1).height = 28;

    sheet.mergeCells('A2:H2');
    const subCell = sheet.getCell('A2');
    subCell.value = subTitle;
    subCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E293B' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sheet.getRow(2).height = 22;

    // 2. Metadata Info Box
    sheet.mergeCells('A3:D3');
    const metaLeft = sheet.getCell('A3');
    metaLeft.value = `Officer: ${options.officerName || 'Agricultural Officer'} | Jurisdiction: ${options.location || 'Telangana'}`;
    metaLeft.font = { name: 'Arial', size: 9, italic: true };
    metaLeft.alignment = { horizontal: 'left', vertical: 'middle' };

    sheet.mergeCells('E3:H3');
    const metaRight = sheet.getCell('E3');
    metaRight.value = `Date: ${dateStr} | Total Records: ${rows.length}`;
    metaRight.font = { name: 'Arial', size: 9, italic: true };
    metaRight.alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getRow(3).height = 18;

    // 3. Table Column Headers
    const headers = [
      'S.No',
      'Product Name',
      'Firm Name',
      'Firm Address',
      'Code No',
      'Date of Sampling',
      'Officer Name',
      'Result / Remarks',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.height = 24;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    headerRow.eachCell((cell: any) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } }; // dark emerald
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }; // light emerald
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF059669' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };
    });

    // 4. Data Rows
    rows.forEach((r, idx) => {
      const row = sheet.addRow([
        r.sNo,
        r.productName,
        r.firmName,
        r.firmAddress,
        r.codeNo,
        r.samplingDate,
        r.officerName,
        r.resultRemarks,
      ]);
      row.height = 20;

      const isEven = idx % 2 === 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row.eachCell((cell: any, colNum: number) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        // Center S.No, Code No, and Date
        if (colNum === 1 || colNum === 5 || colNum === 6) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        }
      });
    });

    // 5. Column Widths
    sheet.columns = [
      { width: 8 },  // S.No
      { width: 26 }, // Product Name
      { width: 24 }, // Firm Name
      { width: 26 }, // Firm Address
      { width: 16 }, // Code No
      { width: 16 }, // Date of Sampling
      { width: 22 }, // Officer Name
      { width: 20 }, // Result / Remarks
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, filename);
  }

  /**
   * Exports extracted rows to an official formatted landscape PDF document (.pdf)
   */
  static async exportToPdf(
    rows: ExtractedReportRow[],
    options: ReportExportOptions
  ): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autoTable = (autoTableModule as any).default || autoTableModule;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { mainTitle, subTitle, filenameBase } = this.getReportTitle(options);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${filenameBase}_${dateStr}.pdf`;
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Title Banner
    doc.setFillColor(21, 128, 61); // emerald-700
    doc.rect(10, 8, pageWidth - 20, 10, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(mainTitle, pageWidth / 2, 14.5, { align: 'center' });

    // 2. Subtitle
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(subTitle, pageWidth / 2, 23, { align: 'center' });

    // 3. Metadata Bar
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const metaLeft = `Officer: ${options.officerName || 'Agricultural Officer'} | Jurisdiction: ${options.location || 'Telangana'}`;
    const metaRight = `Date: ${dateStr} | Total Records: ${rows.length}`;
    doc.text(metaLeft, 10, 28);
    doc.text(metaRight, pageWidth - 10, 28, { align: 'right' });

    // 4. AutoTable
    const headers = [
      ['S.No', 'Product Name', 'Firm Name', 'Firm Address', 'Code No', 'Date of Sampling', 'Officer Name', 'Result / Remarks'],
    ];

    const body = rows.map((r) => [
      String(r.sNo),
      r.productName,
      r.firmName,
      r.firmAddress,
      r.codeNo,
      r.samplingDate,
      r.officerName,
      r.resultRemarks,
    ]);

    autoTable(doc, {
      startY: 31,
      head: headers,
      body,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8,
        cellPadding: 1.8,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        textColor: [30, 41, 59],
      },
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // S.No
        1: { cellWidth: 46 },                  // Product Name
        2: { cellWidth: 40 },                  // Firm Name
        3: { cellWidth: 44 },                  // Firm Address
        4: { halign: 'center', cellWidth: 26 }, // Code No
        5: { halign: 'center', cellWidth: 26 }, // Date of Sampling
        6: { cellWidth: 40 },                  // Officer Name
        7: { cellWidth: 38 },                  // Result / Remarks
      },
      margin: { left: 10, right: 10 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didDrawPage: (data: any) => {
        // Footer: Page Number & Generator
        const str = `Page ${data.pageNumber} | AGRONIX Official Records System`;
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
      },
    });

    // Signature Block at End of Table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable?.finalY || 160;
    const pageHeight = doc.internal.pageSize.getHeight();

    if (finalY + 25 < pageHeight) {
      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Place: ........................', 12, finalY + 14);
      doc.text('Date: .........................', 12, finalY + 20);

      doc.setFont('times', 'bold');
      doc.text('Signature of Agricultural Officer / Inspector', pageWidth - 14, finalY + 14, { align: 'right' });
      doc.setFont('times', 'normal');
      doc.text(`(${options.officerName || 'Name & Office Seal'})`, pageWidth - 14, finalY + 20, { align: 'right' });
    }

    doc.save(filename);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
