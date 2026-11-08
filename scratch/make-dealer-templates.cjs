const XLSX = require('G:/agri-portal-tiryani/project/node_modules/xlsx');
const path = require('path');

const outDir = 'G:/agri-portal-tiryani/project/public/templates';

const sheets = {
  fertilizer: {
    headers: [
      'Dealer Name',
      'IFMS ID',
      'Phone Number',
      'License Number',
      'Issue Date',
      'Expiry Date',
      'Address',
    ],
    rows: [
      ['Sri Laxmi Fertilizers', 'IFMS123456', '9876543210', 'FERT/AP/2024/001', '2024-04-01', '2026-03-31', '1-58/a/1, Main Road, Tiryani'],
      ['Bhagyanagar Agencies', 'IFMS654321', '9123456780', 'FERT/AP/2024/002', '2024-06-15', '2026-06-14', 'H.No. 12-3/4, Station Road, Kagaznagar'],
    ],
    note: 'Fertilizer dealers: IFMS ID is required. Dates as DD-MM-YYYY or YYYY-MM-DD.',
  },
  seed: {
    headers: [
      'Dealer Name',
      'Phone Number',
      'License Number',
      'Issue Date',
      'Expiry Date',
      'Address',
    ],
    rows: [
      ['Sri Vidya Seed Centre', '9887766554', 'SEED/AP/2025/011', '2025-01-10', '2027-01-09', 'D.No. 5-21/3, Market Road, Tiryani'],
      ['Green Field Seeds', '9000012345', 'SEED/AP/2025/012', '2025-03-01', '2027-02-28', 'H.No. 8/2, Bus Stand Road, Choutuppal'],
    ],
    note: 'Seed dealers: Dates as DD-MM-YYYY or YYYY-MM-DD.',
  },
  pesticide: {
    headers: [
      'Dealer Name',
      'Phone Number',
      'License Number',
      'Issue Date',
      'Address',
    ],
    rows: [
      ['Rythu Plant Protection', '9700112233', 'PES/AP/2025/021', '2025-05-10', '1-58/a/1, Main Road, Talandi'],
      ['Crop Care Agencies', '9611223344', 'PES/AP/2025/022', '2025-08-22', 'D.No. 14-2/1, College Road, Wankidi'],
    ],
    note: 'Pesticide dealers: license validity is permanent; fill License Issue Date.',
  },
};

for (const [category, { headers, rows, note }] of Object.entries(sheets)) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Dealers');

  const info = XLSX.utils.aoa_to_sheet([[note], ['Address: enter the full address, e.g. 1-58/a/1, Main Road, Talandi'], [''], ['Import on the matching tab (Fertilizer / Seed / Pesticides). Duplicate license numbers are skipped.']]);
  XLSX.utils.book_append_sheet(wb, info, 'Instructions');

  const file = path.join(outDir, `dealer-import-template-${category}.xlsx`);
  XLSX.writeFile(wb, file);
  console.log('wrote', file);
}
