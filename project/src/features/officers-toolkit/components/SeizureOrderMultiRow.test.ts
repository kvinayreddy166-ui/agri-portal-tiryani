import { describe, expect, it } from 'vitest';
import { noticeBlocksHtml, renderNoticePdfDocument, type NoticeBlock } from './ShowCauseNoticeEntry';
import { buildSeizureModel as buildSeedSeizureModel, normalizeProducts as normalizeSeedProducts } from './SeedSeizureOrderEntry';
import { buildSeizureModel as buildPestSeizureModel, normalizeProducts as normalizePestProducts } from './PesticideSeizureOrderEntry';
import { buildSeizureModel as buildFertSeizureModel, normalizeProducts as normalizeFertProducts } from './FertilizerSeizureOrderEntry';

describe('Seizure Order Multi-row Product Test', () => {
  it('renders multi-row table in HTML', () => {
    const tableRows = [
      ['1', 'Chlorpyrifos 20% EC', 'UPL', 'B1', '2025 / 2027', '50 L', 'Seized'],
      ['2', 'Monocrotophos 36% SL', 'Bayer', 'B2', '2025 / 2027', '30 L', 'Seized'],
      ['3', 'Atrazine 50% WP', 'Tata', 'B3', '2025 / 2027', '20 kg', 'Seized'],
    ];

    const block: NoticeBlock = {
      kind: 'gridTable',
      header: ['S.No.', 'Name', 'Mfg', 'Batch', 'Dates', 'Qty', 'Remarks'],
      colWeights: [6, 24, 13, 11, 15, 15, 16],
      rows: tableRows,
    };

    const html = noticeBlocksHtml([block]);
    expect(html).toContain('Chlorpyrifos');
    expect(html).toContain('Monocrotophos');
    expect(html).toContain('Atrazine');
  });

  it('renders multi-row table in PDF without dropping rows', async () => {
    const tableRows = [
      ['1', 'Chlorpyrifos 20% EC', 'UPL', 'B1', '2025 / 2027', '50 L', 'Seized'],
      ['2', 'Monocrotophos 36% SL', 'Bayer', 'B2', '2025 / 2027', '30 L', 'Seized'],
      ['3', 'Atrazine 50% WP', 'Tata', 'B3', '2025 / 2027', '20 kg', 'Seized'],
    ];

    const block: NoticeBlock = {
      kind: 'gridTable',
      header: ['S.No.', 'Name', 'Mfg', 'Batch', 'Dates', 'Qty', 'Remarks'],
      colWeights: [6, 24, 13, 11, 15, 15, 16],
      rows: tableRows,
    };

    const doc = await renderNoticePdfDocument([block], 'Test Seizure Order');
    expect(doc).toBeDefined();
  });

  it('buildSeedSeizureModel preserves all added rows in Form IV', () => {
    const form = {
      refNumber: 'REC/S/2026-27',
      seizureDate: '2026-10-31',
      officerName: 'A. Rao',
      officerDesignation: 'Seed Inspector',
      mandal: 'Tiryani',
      manualMandal: '',
      district: 'Kumuram Bheem Asifabad',
      manualDistrict: '',
      division: 'Asifabad',
      firmName: 'Sri Laxmi Seeds',
      dealerAddress: 'Main Bazar',
      recordsDetails: 'Sales register seized',
      products: [
        { id: '1', crop: 'Paddy', cropOther: '', variety: 'MTU 1010', lotNo: 'L100', source: 'Telangana Seeds', quantity: '50 Bags', remarks: 'Seized' },
        { id: '2', crop: 'Cotton', cropOther: '', variety: 'Bollgard II', lotNo: 'L200', source: 'Kaveri Seeds', quantity: '30 Packets', remarks: 'Seized' },
        { id: '3', crop: 'Others', cropOther: 'Chilli', variety: 'Teja 4', lotNo: 'L300', source: 'Syngenta', quantity: '15 Packets', remarks: 'Seized' },
      ],
    };

    const blocks = buildSeedSeizureModel(form);
    const tableBlock = blocks.find((b): b is Extract<NoticeBlock, { kind: 'gridTable' }> => b.kind === 'gridTable');
    expect(tableBlock).toBeDefined();
    expect(tableBlock?.rows.length).toBe(3);
    expect(tableBlock?.rows[0][1]).toBe('Paddy / MTU 1010');
    expect(tableBlock?.rows[1][1]).toBe('Cotton / Bollgard II');
    expect(tableBlock?.rows[2][1]).toBe('Chilli / Teja 4');

    const html = noticeBlocksHtml(blocks);
    expect(html).toContain('Paddy / MTU 1010');
    expect(html).toContain('Cotton / Bollgard II');
    expect(html).toContain('Chilli / Teja 4');
  });

  it('buildPestSeizureModel preserves all added rows in Form V(B)', () => {
    const form = {
      refNumber: 'REC/P/2026-27',
      seizureDate: '2026-10-31',
      officerName: 'K. Reddy',
      officerDesignation: 'Insecticide Inspector',
      mandal: 'Tiryani',
      manualMandal: '',
      district: 'Kumuram Bheem Asifabad',
      manualDistrict: '',
      division: 'Asifabad',
      firmName: 'Kisan Pesticides',
      premisesAt: 'Shop No. 5, Market Yard',
      folioNo: '42',
      products: [
        { id: 'p1', name: 'Chlorpyrifos 20% EC', manufacturedBy: 'UPL', batchNo: 'B-101', mfgDate: '2025-01-10', expiryDate: '2027-01-09', quantity: '25 L', folioNo: '42', remarks: 'Good condition' },
        { id: 'p2', name: 'Monocrotophos 36% SL', manufacturedBy: 'Bayer', batchNo: 'B-202', mfgDate: '2025-02-15', expiryDate: '2027-02-14', quantity: '10 L', folioNo: '42', remarks: 'Good condition' },
        { id: 'p3', name: 'Acephate 75% SP', manufacturedBy: 'Rallis', batchNo: 'B-303', mfgDate: '2025-03-20', expiryDate: '2027-03-19', quantity: '15 Kg', folioNo: '43', remarks: 'Good condition' },
      ],
    };

    const blocks = buildPestSeizureModel(form);
    const tableBlock = blocks.find((b): b is Extract<NoticeBlock, { kind: 'gridTable' }> => b.kind === 'gridTable');
    expect(tableBlock).toBeDefined();
    expect(tableBlock?.colWeights).toEqual([7, 21, 16, 11, 15, 15, 15]);
    expect(tableBlock?.rows.length).toBe(3);
    expect(tableBlock?.rows[0][1]).toBe('Chlorpyrifos 20% EC');
    expect(tableBlock?.rows[1][1]).toBe('Monocrotophos 36% SL');
    expect(tableBlock?.rows[2][1]).toBe('Acephate 75% SP');

    const html = noticeBlocksHtml(blocks);
    expect(html).toContain('Chlorpyrifos 20% EC');
    expect(html).toContain('Monocrotophos 36% SL');
    expect(html).toContain('Acephate 75% SP');
  });

  it('buildFertSeizureModel preserves all added rows in Annexure AA', () => {
    const form = {
      orderNumber: 'SZR/F/2026-27',
      seizureDate: '2026-10-31',
      officerName: 'V. Rao',
      officerDesignation: 'Fertilizer Inspector',
      mandal: 'Tiryani',
      manualMandal: '',
      district: 'Kumuram Bheem Asifabad',
      manualDistrict: '',
      division: 'Asifabad',
      firmName: 'Green Fertilisers',
      dealerAddress: 'Station Road',
      fertilizerDesc: 'Urea and Complex',
      contravenedClause: 'Clause 19',
      premisesSameAsFirm: true,
      premises: '',
      witness1: 'Witness One',
      witness2: 'Witness Two',
      products: [
        { id: 'f1', name: 'Neem Coated Urea', manufacturer: 'NFL', quantityMt: '10 MT', batchNo: 'F-100', remarks: 'Seized' },
        { id: 'f2', name: 'DAP 18-46-0', manufacturer: 'IFFCO', quantityMt: '5 MT', batchNo: 'F-200', remarks: 'Seized' },
      ],
    };

    const blocks = buildFertSeizureModel(form);
    const tableBlock = blocks.find((b): b is Extract<NoticeBlock, { kind: 'gridTable' }> => b.kind === 'gridTable');
    expect(tableBlock).toBeDefined();
    expect(tableBlock?.rows.length).toBe(2);
    expect(tableBlock?.rows[0][1]).toBe('Neem Coated Urea');
    expect(tableBlock?.rows[1][1]).toBe('DAP 18-46-0');
  });

  it('normalizeProducts safely handles undefined and partial rows', () => {
    const rawPest = [{ name: 'Test Insecticide' }];
    const normalizedPest = normalizePestProducts(rawPest);
    expect(normalizedPest.length).toBe(1);
    expect(normalizedPest[0].id).toBeDefined();
    expect(normalizedPest[0].manufacturedBy).toBe('');
    expect(normalizedPest[0].folioNo).toBe('');
    expect(normalizedPest[0].remarks).toBe('');

    const rawSeed = [{ variety: 'Test Variety' }];
    const normalizedSeed = normalizeSeedProducts(rawSeed);
    expect(normalizedSeed.length).toBe(1);
    expect(normalizedSeed[0].id).toBeDefined();
    expect(normalizedSeed[0].crop).toBe('');
    expect(normalizedSeed[0].variety).toBe('Test Variety');

    const rawFert = [{ name: 'Test Fertilizer' }];
    const normalizedFert = normalizeFertProducts(rawFert);
    expect(normalizedFert.length).toBe(1);
    expect(normalizedFert[0].id).toBeDefined();
    expect(normalizedFert[0].manufacturer).toBe('');
  });
});
