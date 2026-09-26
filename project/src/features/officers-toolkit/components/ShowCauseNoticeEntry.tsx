import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FileChild } from 'docx';
import { ChevronDown, Download, Edit3, FileText, FileType, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { currentFinancialYear, financialYearForDate } from '../../../shared/utils/financialYear';
import { isAssistantDirectorOfAgriculture, statutoryDesignationDisplay, withOthersOption, effectiveLocationValue } from '../../../shared/data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import {
  noticeCategoryConfigs,
  allShowCauseViolations,
  type NoticeCategory,
  type ShowCauseViolation,
} from '../data/showCauseViolationData';

type NoticeStatus = 'Draft' | 'Issued' | 'Explanation Received' | 'Closed' | 'Action Proposed';

interface NoticeFormState {
  category: NoticeCategory;
  dealerName: string;
  firmName: string;
  licenceNumber: string;
  dealerAddress: string;
  memoNumber: string;
  financialYear: string;
  inspectionDate: string;
  noticeDate: string;
  inspectedBy: 'self' | 'mao';
  deadline: string;
  officerName: string;
  officerDesignation: string;
  mandal: string;
  district: string;
  manualMandal: string;
  manualDistrict: string;
  division: string;
  productName: string;
  batchLotNumber: string;
  quantityInvolved: string;
  invoiceDetails: string;
  productRemarks: string;
  observation: string;
  enclosures: string;
  selectedViolationIds: string[];
  status: NoticeStatus;
}

interface SavedNotice extends NoticeFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-show-cause-notices';
const today = () => new Date().toISOString().slice(0, 10);

// Sort key for a legal reference like "Rule 10(4)(i)", "Section 18(2)", "Clause 8A"
// Order: Sections first, then Clauses, then Rules, then Terms & Conditions / other refs.
// Within each instrument type, provisions sort in ascending numeric order;
// references with "r/w" sort after plain references to the same number.
type ProvisionKey = (number | string)[];
function provisionSortKey(reference: string): ProvisionKey {
  const instrumentRank = /\bSection/i.test(reference) ? 0
    : /\bClause/i.test(reference) ? 1
    : /\bRule/i.test(reference) ? 2
    : 3;
  const match = reference.match(/(\d+)\s*([A-Za-z])?\s*(?:\((\d+|[ivx]+)\))?\s*(?:\((\d+|[a-z]+)\))?/i);
  if (!match) return [instrumentRank, Number.MAX_SAFE_INTEGER, reference];
  const toOrder = (part?: string): number => {
    if (!part) return 0;
    if (/^\d+$/.test(part)) return parseInt(part, 10);
    const roman: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6 };
    return roman[part.toLowerCase()] ?? part.toLowerCase().charCodeAt(0) - 96;
  };
  return [
    instrumentRank,
    parseInt(match[1], 10),
    reference.includes('r/w') ? 1 : 0,
    (match[2] || '').toLowerCase(),
    toOrder(match[3]),
    (match[3] || '').toLowerCase(),
    toOrder(match[4]),
    (match[4] || '').toLowerCase(),
    reference,
  ];
}

function compareProvisionKeys(a: ProvisionKey, b: ProvisionKey): number {
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x).localeCompare(String(y));
  }
  return 0;
}

function readStatutoryDetails(category: NoticeCategory) {
  const storageKey = category === 'fertiliser'
    ? 'tiryani-fertilizer-forms-draft'
    : category === 'seed'
      ? 'tiryani-seed-forms-draft'
      : 'tiryani-pesticide-forms-draft';
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as Record<string, string>;
    return {
      officerName: saved.officerName || '',
      officerDesignation: saved.designation || saved.officerDesignation || 'Mandal Agriculture Officer',
      mandal: saved.placeOfCollectionMandal || saved.sampleDrawingMandal || saved.mandal || 'Tiryani',
      district: saved.district || 'Kumuram Bheem Asifabad',
      manualMandal: saved.manualMandal || '',
      manualDistrict: saved.manualDistrict || '',
      division: saved.division || saved.manualDivision || '',
      dealerName: saved.dealerName || '',
      dealerAddress: saved.dealerAddress || '',
    };
  } catch {
    return {};
  }
}

function designationOptionsFor(category: NoticeCategory) {
  const inspector = category === 'seed' ? 'Seed Inspector' : category === 'pesticide' ? 'Insecticide Inspector' : 'Fertilizer Inspector';
  return [
    { label: `Mandal Agriculture Officer & ${inspector}`, value: `Mandal Agriculture Officer & ${inspector}` },
    { label: `Asst. Director of Agriculture & ${inspector}`, value: `Asst. Director of Agriculture & ${inspector}` },
    { label: `District Agriculture Officer & ${inspector}`, value: `District Agriculture Officer & ${inspector}` },
  ];
}

function resolveDistrict(value: string, manual = '') {
  const trimmed = (value || '').trim();
  if (!trimmed) return { district: '', manualDistrict: '' };
  if (trimmed === 'Others') return { district: 'Others', manualDistrict: manual };
  const match = TELANGANA_DISTRICTS.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  if (match) return { district: match, manualDistrict: '' };
  const alias = trimmed.toLowerCase().replace(/\s+/g, ' ');
  if (alias === 'kumuram bheem asifabad' || alias === 'kumurambheem asifabad') {
    return { district: 'Kumrambheem Asifabad', manualDistrict: '' };
  }
  return { district: 'Others', manualDistrict: trimmed };
}

function resolveMandal(district: string, value: string, manual = '') {
  const trimmed = (value || '').trim();
  if (!trimmed) return { mandal: '', manualMandal: '' };
  if (trimmed === 'Others') return { mandal: 'Others', manualMandal: manual };
  const options = district && district !== 'Others' ? getMandalsForDistrict(district) : [];
  const match = options.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  return match ? { mandal: match, manualMandal: '' } : { mandal: 'Others', manualMandal: trimmed };
}

function readSavedNotices(): SavedNotice[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedNotices(notices: SavedNotice[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
}

function makeInitialForm(category: NoticeCategory): NoticeFormState {
  const config = noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails(category);
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumuram Bheem Asifabad', statutory.manualDistrict || '');
  const resolvedMandal = resolveMandal(resolvedDistrict.district, statutory.mandal || 'Tiryani', statutory.manualMandal || '');
  return {
    category,
    dealerName: statutory.dealerName || '',
    firmName: statutory.dealerName || '',
    licenceNumber: '',
    dealerAddress: statutory.dealerAddress || '',
    memoNumber: `${config.memoPrefix}/${fy}`,
    financialYear: fy,
    inspectionDate: today(),
    noticeDate: today(),
    inspectedBy: 'self',
    deadline: '7 (seven) days',
    officerName: statutory.officerName || '',
    officerDesignation: statutory.officerDesignation || designationOptionsFor(category)[0].value,
    mandal: resolvedMandal.mandal,
    district: resolvedDistrict.district,
    manualMandal: resolvedMandal.manualMandal,
    manualDistrict: resolvedDistrict.manualDistrict,
    division: statutory.division || '',
    productName: '',
    batchLotNumber: '',
    quantityInvolved: '',
    invoiceDetails: '',
    productRemarks: '',
    observation: '',
    enclosures: '',
    selectedViolationIds: [],
    status: 'Draft',
  };
}

function getConfig(category: NoticeCategory) {
  return noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
}

function legalSourceBadge(actOrOrder: string) {
  const source = actOrOrder.toLowerCase();
  if (source.includes('fertiliser (control) order')) return 'FCO';
  if (source.includes('essential commodities act')) return 'ECA';
  if (source.includes('seed (control) order')) return 'SCO';
  if (source.includes('seeds act')) return 'Seed Act';
  if (source.includes('seeds rules')) return 'Seed Rules';
  if (source.includes('insecticides act')) return 'IA';
  if (source.includes('insecticides rules')) return 'IR';
  return null;
}

function formatNoticeDate(value: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
}

function toRoman(value: number) {
  const numerals: [number, string][] = [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of numerals) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

function isAdaDesignation(designation: string): boolean {
  const lower = (designation || '').toLowerCase();
  return isAssistantDirectorOfAgriculture(designation)
    || ((lower.includes('asst') || lower.includes('assistant') || lower.trim() === 'ada') && lower.includes('director'));
}

function isDaoDesignation(designation: string): boolean {
  const lower = (designation || '').toLowerCase();
  return lower.includes('district agriculture officer') || lower.trim() === 'dao';
}

function isMaoDesignation(designation: string): boolean {
  const lower = (designation || '').toLowerCase();
  return lower.includes('mandal agriculture officer') || lower.trim() === 'mao';
}

interface NoticeSegment {
  text: string;
  bold?: boolean;
}

type NoticeBlock =
  | { kind: 'center'; text: string; bold?: boolean; underline?: boolean }
  | { kind: 'memoRow'; left: NoticeSegment[]; right: NoticeSegment[] }
  | { kind: 'para'; segments: NoticeSegment[]; indent?: number; firstLineIndent?: number }
  | { kind: 'labelPara'; label: string; segments: NoticeSegment[]; indent?: number }
  | { kind: 'heading'; text: string }
  | { kind: 'lines'; items: NoticeSegment[][]; indent?: number; align?: 'right'; centerLines?: boolean; offsetX?: number }
  | { kind: 'table'; header: [string, string]; rows: { label: string; value: string }[] }
  | { kind: 'rule' }
  | { kind: 'gap'; mm?: number };

const NOTICE_FONT_STACK = `'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', serif`;

function buildNoticeModel(form: NoticeFormState, selectedViolations: ShowCauseViolation[]): NoticeBlock[] {
  const inspectionDate = formatNoticeDate(form.inspectionDate);
  const noticeDate = formatNoticeDate(form.noticeDate || today());
  const subjectLabel = form.category === 'pesticide' ? 'Pesticides' : form.category === 'seed' ? 'Seeds' : 'Fertilizers';
  const officerDesignation = form.officerDesignation || 'Agriculture Officer';
  // Document shows the bare designation - "& Seed/Fertilizer/Insecticide Inspector" suffix is not printed
  // ADA renders as "Asst. Director of Agriculture (R)" in the signature, matching statutory forms
  const displayDesignation = statutoryDesignationDisplay(
    officerDesignation.replace(/\s*&\s*.*$/, '').trim() || officerDesignation
  );
  const officerTitle = displayDesignation.toUpperCase();
  const mandalValue = effectiveLocationValue(form.mandal, form.manualMandal) || 'Tiryani';
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || 'Kumuram Bheem Asifabad';
  const districtDisplay = districtValue.toLowerCase() === 'kumrambheem asifabad' ? 'Kumuram Bheem Asifabad' : districtValue;
  const explanationPeriod = form.deadline || '7 (seven) days';

  const instrument = form.category === 'fertiliser'
    ? 'Fertiliser (Control) Order, 1985'
    : form.category === 'seed'
      ? 'Seeds Act, 1966 read with Seed (Control) Order, 1983'
      : 'Insecticides Act, 1968 read with Insecticides Rules, 1971';
  const instrumentSub = form.category === 'fertiliser'
    ? 'Fertiliser (Control) Order, 1985'
    : form.category === 'seed'
      ? 'Seeds Act, 1966 and Seed (Control) Order, 1983'
      : 'Insecticides Act, 1968 and Insecticides Rules, 1971';
  const certificateTerm = form.category === 'fertiliser'
    ? 'Certificate of Registration / Letter of Authorization'
    : form.category === 'seed'
      ? 'Seed Dealer Licence'
      : 'Insecticide Licence';
  const businessTerm = form.category === 'fertiliser'
    ? 'selling fertilizers'
    : form.category === 'seed'
      ? 'selling seeds'
      : 'selling insecticides';
  const licenceConditionPhrase = form.category === 'fertiliser'
    ? 'the conditions of registration/authorization governing the sale of fertilizers'
    : form.category === 'seed'
      ? 'the conditions of the dealer licence governing the sale of seeds'
      : 'the conditions of the licence governing the sale of insecticides';
  const memoLicencePhrase = form.category === 'fertiliser'
    ? 'the Letter of Authorization / Registration governing the sale of fertilizers'
    : form.category === 'seed'
      ? 'the dealer licence governing the sale of seeds'
      : 'the insecticide licence governing the sale of insecticides';
  const firmDisplay = `M/s. ${form.firmName || form.dealerName || '________________'}`;
  const dealerAddressInline = form.dealerAddress.replace(/\s+/g, ' ').trim();
  const dealerFullAddress = [dealerAddressInline, effectiveLocationValue(form.mandal, form.manualMandal), districtDisplay]
    .filter(Boolean)
    .join(', ');

  // Copies submitted to - mirrors the covering-letter pattern based on issuing officer's designation
  const isADA = isAdaDesignation(officerDesignation);
  const isDAO = isDaoDesignation(officerDesignation);
  const isMAO = isMaoDesignation(officerDesignation);
  const noticeTitle = isMAO ? 'MEMO' : 'SHOW CAUSE NOTICE';
  const noticeTitleText = isMAO ? 'Memo' : 'Show Cause Notice';
  const divisionName = form.division.trim() || '________________';
  // ADA officers operate at division level, DAO at district level, others at mandal level
  const officerLocation = isADA
    ? (form.division.trim() ? `${form.division.trim()} Division` : '________________')
    : isDAO
      ? districtDisplay
      : mandalValue;
  const copyLines = (isDAO
    ? `1. The Commissioner & Director of Agriculture, Telangana State, for favour of information and necessary action.\n2. The Asst. Director of Agriculture (R) concerned, for information and to serve the notice on the dealer under proper dated acknowledgement.\n3. Stock File / Spare.`
    : isADA
      ? `1. The District Agriculture Officer, ${districtDisplay}, for favour of information and necessary action.\n2. The Mandal Agriculture Officer concerned, for information and to serve the notice on the dealer under proper dated acknowledgement.\n3. Stock File / Spare.`
      : `1. The Asst. Director of Agriculture (R), ${divisionName}, for information and necessary action.\n2. The District Agriculture Officer, ${districtDisplay}, for information and necessary action.`
  ).split('\n');

  const addressLines: NoticeSegment[][] = [
    [{ text: `M/s. ${form.firmName || form.dealerName || '__________________________________________'}`, bold: true }],
    [{ text: form.dealerAddress || '_______________________________________________', bold: true }],
    [{ text: effectiveLocationValue(form.mandal, form.manualMandal) || '________________', bold: true }],
    [{ text: districtDisplay, bold: true }],
  ];

  const dealerItems: NoticeSegment[][] = [
    ...addressLines.map((line, index) => {
      const suffix = index === addressLines.length - 1 ? '.' : ',';
      const last = line[line.length - 1];
      return [...line.slice(0, -1), { ...last, text: `${last.text.trimEnd()}${suffix}` }];
    }),
    ...(form.licenceNumber.trim()
      ? [[{ text: 'Licence No.: ' }, { text: form.licenceNumber, bold: true }]]
      : []),
  ];

  // Violation line: "description which is contravention to <Ref> <Act/Order/Rules>"
  // - Section -> parent Act, Clause -> Control Order, Rule -> Rules (actOrOrder already names the instrument)
  const violationItems: NoticeSegment[][] = selectedViolations.map((item) => [
    { text: item.shortDescription.replace(/\.+$/, '') },
    { text: ` which is contravention to ${item.exactReference.replace(/\br\/w\b/g, 'read with')} of ${item.actOrOrder.replace(/,/g, '').replace(/\br\/w\b/g, 'read with')}.`, bold: true },
  ]);

  const productRows = [
    { label: 'Product Name', value: form.productName },
    { label: 'Batch/Lot No.', value: form.batchLotNumber },
    { label: 'Quantity', value: form.quantityInvolved },
    { label: 'Remarks', value: form.productRemarks },
  ].filter((row) => row.value.trim());

  const observation = form.observation.trim();
  const signatureItems: NoticeSegment[][] = [
    [{ text: displayDesignation, bold: true }],
    [{ text: officerLocation, bold: true }],
  ];

  // Traditional memo format (District Office Manual / drafting & noting):
  // government + department heading, "Office of the ___" with station, Memo No./Dt. row,
  // centred MEMORANDUM title, Sub + Ref, "***" separator, numbered paras with the
  // violation list under para 1, Encl at the left end, full designation signature,
  // addressee AFTER the signature, Copy submitted to last.
  if (isMAO) {
    const designationParts = officerDesignation.split('&').map((part) => part.trim()).filter(Boolean);
    const memoSignatureItems: NoticeSegment[][] = designationParts.length > 1
      ? [
          [{ text: `${designationParts[0]} &`, bold: true }],
          [{ text: `${designationParts.slice(1).join(' & ').replace(/,+$/, '')},`, bold: true }],
          [{ text: officerLocation, bold: true }],
        ]
      : [
          [{ text: `${displayDesignation},`, bold: true }],
          [{ text: officerLocation, bold: true }],
        ];
    const memoCopyLines = `1. The Asst. Director of Agriculture (R), ${divisionName}, for favour of information and necessary action.\n2. The District Agriculture Officer, ${districtDisplay}, for favour of information and necessary action.\n3. Copy to Stock File.`.split('\n');
    const memoNoticedPhrase = violationItems.length > 0
      ? `the following irregularities and contraventions of the ${instrument} were noticed:`
      : `certain irregularities and contraventions of the ${instrument} were noticed.`;
    return [
      { kind: 'center', text: 'GOVERNMENT OF TELANGANA', bold: true },
      { kind: 'center', text: 'DEPARTMENT OF AGRICULTURE', bold: true },
      { kind: 'gap', mm: 3 },
      { kind: 'center', text: `OFFICE OF THE ${officerTitle},`, bold: true, underline: true },
      { kind: 'center', text: officerLocation.toUpperCase(), bold: true, underline: true },
      { kind: 'gap', mm: 4 },
      {
        kind: 'memoRow',
        left: [{ text: 'Memo No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
        right: [{ text: 'Dt.: ' }, { text: form.inspectionDate ? noticeDate : ' '.repeat(11), bold: true }],
      },
      { kind: 'gap', mm: 4 },
      { kind: 'center', text: 'MEMORANDUM', bold: true },
      { kind: 'gap', mm: 3 },
      {
        kind: 'labelPara',
        label: 'Sub:',
        segments: [
          { text: `${subjectLabel} – Inspection of dealer premises of ` },
          { text: firmDisplay, bold: true },
          { text: `, ${mandalValue}` },
          ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
          { text: ' – Irregularities noticed during inspection – Memo issued – Explanation called for – Reg.' },
        ],
      },
      {
        kind: 'labelPara',
        label: 'Ref:',
        segments: [
          { text: `Field inspection conducted by the ${officerDesignation}, ${mandalValue}` },
          ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
          { text: '.' },
        ],
      },
      { kind: 'gap', mm: 2 },
      { kind: 'center', text: '***' },
      { kind: 'gap', mm: 1 },
      {
        kind: 'labelPara',
        label: '1.',
        segments: [
          { text: 'It is informed that during the field inspection of the business premises of ' },
          { text: firmDisplay, bold: true },
          { text: ', located at ' },
          { text: `${dealerAddressInline || '________________'}, ${mandalValue} Mandal, ${districtDisplay} District`, bold: true },
          { text: ', conducted' },
          ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
          { text: ` (vide reference cited), ${memoNoticedPhrase}` },
        ],
      },
      ...(violationItems.length > 0
        ? [{ kind: 'heading', text: 'Irregularities / Violations Noticed:' } as NoticeBlock]
        : []),
      ...violationItems.map((item, index): NoticeBlock => ({ kind: 'labelPara', label: `${toRoman(index + 1)})`, segments: item, indent: 8 })),
      ...(violationItems.length > 0 ? [{ kind: 'gap', mm: 2 } as NoticeBlock] : []),
      ...(productRows.length > 0
        ? [
            { kind: 'heading', text: 'Product details, wherever applicable:' } as NoticeBlock,
            { kind: 'table', header: ['Particulars', 'Details'], rows: productRows } as NoticeBlock,
            { kind: 'gap', mm: 2 } as NoticeBlock,
          ]
        : []),
      ...(observation
        ? [
            { kind: 'heading', text: 'Specific observation:' } as NoticeBlock,
            { kind: 'para', indent: 8, segments: [{ text: observation, bold: true }] } as NoticeBlock,
            { kind: 'gap', mm: 1 } as NoticeBlock,
          ]
        : []),
      {
        kind: 'labelPara',
        label: '2.',
        segments: [
          { text: `The aforesaid irregularities constitute a violation of the mandatory provisions of the ${instrument} and the conditions of ${memoLicencePhrase}.` },
        ],
      },
      {
        kind: 'labelPara',
        label: '3.',
        segments: [
          { text: 'In view of the above, ' },
          { text: firmDisplay, bold: true },
          { text: ' is hereby directed to submit a ' },
          { text: `written explanation to the undersigned within ${explanationPeriod} from the date of receipt of this Memo`, bold: true },
          { text: ', duly explaining each of the above irregularities and enclosing relevant supporting documents, if any.' },
        ],
      },
      {
        kind: 'labelPara',
        label: '4.',
        segments: [
          { text: `If no written explanation is received within the stipulated period of ${explanationPeriod}, it will be construed that the firm has no explanation to offer, and the matter will be reported to the ` },
          { text: 'Notified Authority', bold: true },
          { text: ` without further reference to the firm for initiating/proposing appropriate action under the provisions of the ${instrument} and other applicable Act(s), Rules, and Orders.` },
        ],
      },
      { kind: 'gap', mm: 4 },
      ...(form.enclosures.trim()
        ? [{ kind: 'lines', items: [[{ text: 'Encl: ' }, { text: form.enclosures.trim(), bold: true }]] } as NoticeBlock]
        : []),
      { kind: 'gap', mm: 4 },
      { kind: 'lines', items: memoSignatureItems, align: 'right', centerLines: true, offsetX: 5 },
      { kind: 'gap', mm: 4 },
      { kind: 'lines', items: [[{ text: 'To', bold: true }]] },
      { kind: 'lines', items: dealerItems, indent: 8 },
      { kind: 'gap', mm: 3 },
      { kind: 'lines', items: [[{ text: 'Copy submitted to:', bold: true }]] },
      ...memoCopyLines.map((line): NoticeBlock => {
        const match = line.match(/^(\d+\.)\s*(.*)$/);
        return match
          ? { kind: 'labelPara', label: match[1], segments: [{ text: match[2] }] }
          : { kind: 'lines', items: [[{ text: line }]] };
      }),
    ];
  }

  // Formal Show Cause Notice format (ADA / DAO):
  // government + department heading, "Office of the ___" with address, Rc.No./Date row,
  // centred title, Sub + numbered Ref, "Whereas / And whereas" numbered paras with
  // roman-numbered violation items, addressee AFTER the signature, Copy To last.
  const inspectedByMao = form.inspectedBy === 'mao';
  const officeLocation = isDAO
    ? (/district$/i.test(districtDisplay.trim()) ? districtDisplay : `${districtDisplay} District`)
    : officerLocation;
  const inspectionRef = inspectedByMao
    ? `Inspection report of the Mandal Agriculture Officer, ${mandalValue}${inspectionDate ? `, dt. ${inspectionDate}` : ''}.`
    : `Field inspection of the dealer premises conducted${inspectionDate ? ` on ${inspectionDate}` : ''}.`;
  const scnSectionBlocks: NoticeBlock[] = [
    ...violationItems.map((item, index): NoticeBlock => ({ kind: 'labelPara', label: `${toRoman(index + 1)})`, segments: item, indent: 8 })),
    ...(violationItems.length > 0 ? [{ kind: 'gap', mm: 2 } as NoticeBlock] : []),
    ...(productRows.length > 0
      ? [
          { kind: 'heading', text: 'Product details, wherever applicable:' } as NoticeBlock,
          { kind: 'table', header: ['Particulars', 'Details'], rows: productRows } as NoticeBlock,
          { kind: 'gap', mm: 2 } as NoticeBlock,
        ]
      : []),
    ...(observation
      ? [
          { kind: 'heading', text: 'Specific observation:' } as NoticeBlock,
          { kind: 'para', indent: 8, segments: [{ text: observation, bold: true }] } as NoticeBlock,
          { kind: 'gap', mm: 1 } as NoticeBlock,
        ]
      : []),
  ];
  const noticedPhrase = scnSectionBlocks.length > 0
    ? `the following irregularities and contraventions of the ${instrument} were noticed:`
    : `certain irregularities and contraventions of the ${instrument} were noticed.`;

  return [
    { kind: 'center', text: 'GOVERNMENT OF TELANGANA', bold: true },
    { kind: 'center', text: 'DEPARTMENT OF AGRICULTURE', bold: true },
    { kind: 'gap', mm: 3 },
    { kind: 'center', text: `Office of the ${displayDesignation},`, bold: true, underline: true },
    { kind: 'center', text: officeLocation, bold: true, underline: true },
    { kind: 'gap', mm: 4 },
    {
      kind: 'memoRow',
      left: [{ text: 'Rc.No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
      right: [{ text: 'Date: ' }, { text: form.inspectionDate ? noticeDate : ' '.repeat(11), bold: true }],
    },
    { kind: 'gap', mm: 4 },
    { kind: 'center', text: noticeTitle, bold: true },
    { kind: 'gap', mm: 3 },
    {
      kind: 'labelPara',
      label: 'Sub:',
      segments: [
        { text: `${subjectLabel} – Inspection of ` },
        { text: `${firmDisplay}, ${mandalValue}`, bold: true },
        ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
        { text: ` – Irregularities noticed under the ${instrumentSub} – ${noticeTitleText} issued – Explanation called for – Reg.` },
      ],
    },
    {
      kind: 'labelPara',
      label: 'Ref:',
      segments: [
        { text: `1. ${certificateTerm} held by ` },
        { text: `${firmDisplay}.`, bold: true },
      ],
    },
    { kind: 'lines', items: [[{ text: `2. ${inspectionRef}` }]], indent: 7 },
    { kind: 'gap', mm: 2 },
    { kind: 'center', text: '***' },
    { kind: 'gap', mm: 1 },
    {
      kind: 'labelPara',
      label: '1.',
      segments: [
        { text: 'Whereas, ' },
        { text: firmDisplay, bold: true },
        { text: ', located at ' },
        { text: dealerFullAddress || '________________', bold: true },
        { text: `, holds a ${certificateTerm} (vide reference 1st cited) to carry on the business of ${businessTerm}, subject to strict compliance with the provisions of the ${instrument} and the terms and conditions stipulated therein.` },
      ],
    },
    {
      kind: 'labelPara',
      label: '2.',
      segments: inspectedByMao
        ? [
            { text: 'And whereas, based on the report of the ' },
            { text: `Mandal Agriculture Officer, ${mandalValue}`, bold: true },
            { text: ', in respect of the field inspection of the business premises of the said dealer/firm conducted' },
            ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
            { text: ` (vide reference 2nd cited), ${noticedPhrase}` },
          ]
        : [
            { text: 'And whereas, during the field inspection of the business premises of the said dealer/firm conducted' },
            ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
            { text: ` (vide reference 2nd cited), ${noticedPhrase}` },
          ],
    },
    ...scnSectionBlocks,
    {
      kind: 'labelPara',
      label: '3.',
      segments: [
        { text: `The aforesaid irregularities constitute a violation of the mandatory provisions of the ${instrument} and ${licenceConditionPhrase}, warranting statutory and administrative action under the relevant provisions of the Order and applicable Acts/Rules.` },
      ],
    },
    {
      kind: 'labelPara',
      label: '4.',
      segments: [
        { text: 'In view of the above, ' },
        { text: firmDisplay, bold: true },
        { text: ' is hereby directed to ' },
        { text: 'Show Cause', bold: true },
        { text: ' and submit a ' },
        { text: `written explanation within ${explanationPeriod} from the date of receipt of this notice`, bold: true },
        { text: `, duly explaining each of the above irregularities along with relevant supporting documents, if any, as to why appropriate action should not be initiated against the firm under the provisions of the ${instrument} and other applicable Acts and Rules.` },
      ],
    },
    {
      kind: 'labelPara',
      label: '5.',
      segments: [
        { text: `If no written explanation is received in this office within the stipulated period of ${explanationPeriod}, it will be construed that the firm has no explanation to offer, and the matter will be examined and decided ` },
        { text: 'ex-parte', bold: true },
        { text: ' based on the material available on record without any further reference, and further action as deemed fit will be initiated under the provisions of the applicable Act(s), Rules, and Orders.' },
      ],
    },
    ...(form.enclosures.trim()
      ? [{ kind: 'lines', items: [[{ text: 'Encl: ' }, { text: form.enclosures.trim(), bold: true }]] } as NoticeBlock]
      : []),
    { kind: 'gap', mm: 8 },
    { kind: 'lines', items: signatureItems, align: 'right', centerLines: true, offsetX: 5 },
    { kind: 'gap', mm: 4 },
    { kind: 'lines', items: [[{ text: 'To', bold: true }]] },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 3 },
    { kind: 'lines', items: [[{ text: 'Copy to:', bold: true }]] },
    ...copyLines.map((line): NoticeBlock => {
      const match = line.match(/^(\d+\.)\s*(.*)$/);
      return match
        ? { kind: 'labelPara', label: match[1], segments: [{ text: match[2] }] }
        : { kind: 'lines', items: [[{ text: line }]] };
    }),
  ];
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function segmentsHtml(segments: NoticeSegment[]) {
  return segments
    .map((segment) => (segment.bold ? `<strong>${escapeHtml(segment.text)}</strong>` : escapeHtml(segment.text)))
    .join('');
}

function noticeBlocksHtml(blocks: NoticeBlock[]) {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case 'center':
          return `<div style="text-align:center;${block.bold ? 'font-weight:700;' : ''}${block.underline ? 'text-decoration:underline;' : ''}">${escapeHtml(block.text)}</div>`;
        case 'memoRow':
          return `<div style="display:flex;justify-content:space-between;gap:12pt;"><span>${segmentsHtml(block.left)}</span><span>${segmentsHtml(block.right)}</span></div>`;
        case 'para':
          return `<p style="margin:0 0 4pt ${block.indent || 0}mm;text-align:justify;${block.firstLineIndent ? `text-indent:${block.firstLineIndent}mm;` : ''}">${segmentsHtml(block.segments)}</p>`;
        case 'labelPara':
          return `<div style="display:flex;margin:0 0 4pt ${block.indent || 0}mm;"><strong style="flex:none;">${escapeHtml(block.label)}&nbsp;</strong><span style="flex:1;text-align:justify;">${segmentsHtml(block.segments)}</span></div>`;
        case 'heading':
          return `<p style="margin:6pt 0 2pt;font-weight:700;">${escapeHtml(block.text)}</p>`;
        case 'lines': {
          const inner = block.items.map((item) => `<div>${segmentsHtml(item)}</div>`).join('');
          if (block.centerLines) {
            return `<div style="margin-left:${block.indent || 0}mm;text-align:right;transform:translateX(${block.offsetX || 0}mm);"><div style="display:inline-block;text-align:center;">${inner}</div></div>`;
          }
          return `<div style="margin-left:${block.indent || 0}mm;${block.align === 'right' ? 'text-align:right;' : ''}transform:translateX(${block.offsetX || 0}mm);">${inner}</div>`;
        }
        case 'table':
          return `<table style="width:92%;border-collapse:collapse;margin:2pt 0 2pt 8mm;"><thead><tr>${block.header
            .map((cell) => `<th style="border:1pt solid #000;padding:2pt 6pt;text-align:left;font-weight:700;">${escapeHtml(cell)}</th>`)
            .join('')}</tr></thead><tbody>${block.rows
            .map(
              (row) =>
                `<tr><td style="border:1pt solid #000;padding:2pt 6pt;">${escapeHtml(row.label)}</td><td style="border:1pt solid #000;padding:2pt 6pt;font-weight:700;">${escapeHtml(row.value || '______________________________')}</td></tr>`
            )
            .join('')}</tbody></table>`;
        case 'rule':
          return '<hr style="border:none;border-top:1pt dashed #000;margin:2pt 0;"/>';
        case 'gap':
          return `<div style="height:${block.mm ?? 2}mm;"></div>`;
        default:
          return '';
      }
    })
    .join('');
}

export function noticeDocumentHtml(blocks: NoticeBlock[]) {
  return `<html><head><style>@page{size:A4;margin:18mm 20mm;}body{font-family:${NOTICE_FONT_STACK};font-size:12pt;line-height:1.5;color:#000;}</style></head><body>${noticeBlocksHtml(blocks)}</body></html>`;
}

async function buildNoticeWordDocument(blocks: NoticeBlock[]) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
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

  const font = 'Book Antiqua';
  const fontSize = 24;
  const mmToTwips = (mm: number) => Math.round(mm * 56.6929);
  const runs = (segments: NoticeSegment[]) => segments.map((segment) => new TextRun({ text: segment.text, bold: segment.bold, font, size: fontSize }));
  const children: FileChild[] = [];
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };
  const tableBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
  const tableBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder, insideHorizontal: tableBorder, insideVertical: tableBorder };

  blocks.forEach((block) => {
    switch (block.kind) {
      case 'center':
        children.push(new Paragraph({
          children: [new TextRun({ text: block.text, bold: block.bold, underline: block.underline ? { type: UnderlineType.SINGLE } : undefined, font, size: fontSize })],
          alignment: AlignmentType.CENTER,
          spacing: { line: 360, after: 0 },
        }));
        break;
      case 'memoRow':
        children.push(new Paragraph({
          children: [...runs(block.left), new TextRun({ text: '\t', font, size: fontSize }), ...runs(block.right)],
          tabStops: [{ type: TabStopType.RIGHT, position: mmToTwips(165) }],
          spacing: { line: 360, after: 0 },
        }));
        break;
      case 'para':
        children.push(new Paragraph({
          children: runs(block.segments),
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: mmToTwips(block.indent || 0),
            firstLine: mmToTwips(block.firstLineIndent || 0),
          },
          spacing: { line: 360, after: 80 },
        }));
        break;
      case 'labelPara': {
        const hanging = mmToTwips(7);
        children.push(new Paragraph({
          children: [new TextRun({ text: `${block.label} `, bold: true, font, size: fontSize }), ...runs(block.segments)],
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: mmToTwips(block.indent || 0) + hanging, hanging },
          spacing: { line: 360, after: 80 },
        }));
        break;
      }
      case 'heading':
        children.push(new Paragraph({
          children: [new TextRun({ text: block.text, bold: true, font, size: fontSize })],
          spacing: { line: 360, before: 120, after: 40 },
        }));
        break;
      case 'lines':
        if (block.centerLines) {
          children.push(new Table({
            rows: [new TableRow({
              children: [new TableCell({
                children: block.items.map((item) => new Paragraph({
                  children: runs(item),
                  alignment: AlignmentType.CENTER,
                  spacing: { line: 360, after: 0 },
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
            spacing: { line: 360, after: 0 },
          })));
        }
        break;
      case 'table': {
        const cellParagraph = (text: string, bold = false) => new Paragraph({
          children: [new TextRun({ text, bold, font, size: fontSize })],
          spacing: { line: 360, after: 0 },
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
      case 'rule':
        children.push(new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.DASHED, size: 6, color: '000000', space: 1 } },
          spacing: { line: 360, after: 40 },
        }));
        break;
      case 'gap':
        children.push(new Paragraph({ children: [], spacing: { after: mmToTwips(block.mm ?? 2) } }));
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
          paragraph: { spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
          margin: { top: mmToTwips(18), right: mmToTwips(20), bottom: mmToTwips(18), left: mmToTwips(20) },
        },
      },
      children,
    }],
  });

  return Packer.toBlob(document);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

async function loadNoticeFonts(doc: { addFileToVFS: (name: string, data: string) => void; addFont: (file: string, name: string, style: string) => void }) {
  try {
    const load = async (url: string) => arrayBufferToBase64(await (await fetch(url)).arrayBuffer());
    doc.addFileToVFS('BookAntiqua.ttf', await load('/fonts/BookAntiqua.ttf'));
    doc.addFont('BookAntiqua.ttf', 'BookAntiqua', 'normal');
    doc.addFileToVFS('BookAntiqua-Bold.ttf', await load('/fonts/BookAntiqua-Bold.ttf'));
    doc.addFont('BookAntiqua-Bold.ttf', 'BookAntiqua', 'bold');
    return 'BookAntiqua';
  } catch {
    return 'times';
  }
}

export function ShowCauseNoticeEntry({ lockedCategory }: { lockedCategory?: NoticeCategory } = {}) {
  const [form, setForm] = useState<NoticeFormState>(() => makeInitialForm(lockedCategory ?? 'fertiliser'));
  const [savedNotices, setSavedNotices] = useState<SavedNotice[]>(() => readSavedNotices());
  const [savedSearch, setSavedSearch] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showNoticePreview, setShowNoticePreview] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const previewRef = useRef<HTMLDivElement>(null);

  const config = useMemo(() => getConfig(form.category), [form.category]);
  const categoryViolations = useMemo(
    () => allShowCauseViolations.filter((item) => item.category === form.category),
    [form.category]
  );
  const violationGroups = useMemo(() => {
    const groups: { label: string; items: ShowCauseViolation[] }[] = [];
    const byLabel = new Map<string, ShowCauseViolation[]>();
    for (const item of categoryViolations) {
      const label = item.group || '';
      let bucket = byLabel.get(label);
      if (!bucket) {
        bucket = [];
        byLabel.set(label, bucket);
        groups.push({ label, items: bucket });
      }
      bucket.push(item);
    }
    for (const bucket of byLabel.values()) {
      bucket.sort((a, b) => compareProvisionKeys(provisionSortKey(a.exactReference), provisionSortKey(b.exactReference)));
    }
    return groups;
  }, [categoryViolations]);
  const hasViolationGroups = useMemo(() => violationGroups.some((group) => group.label !== ''), [violationGroups]);
  const selectedViolations = useMemo(
    () => allShowCauseViolations.filter((item) => form.selectedViolationIds.includes(item.violationId)),
    [form.selectedViolationIds]
  );
  const noticeBlocks = useMemo(() => buildNoticeModel(form, selectedViolations), [form, selectedViolations]);
  const noticeHtml = useMemo(() => noticeBlocksHtml(noticeBlocks), [noticeBlocks]);

  const districtOptions = useMemo(
    () => withOthersOption(TELANGANA_DISTRICTS.map((item) => ({ label: item, value: item }))),
    []
  );
  const mandalOptions = useMemo(() => {
    if (form.district && form.district !== 'Others') {
      return withOthersOption(getMandalsForDistrict(form.district).map((item) => ({ label: item, value: item })));
    }
    return [{ label: 'Others', value: 'Others' }];
  }, [form.district]);
  const designationOptions = useMemo(() => {
    const base = designationOptionsFor(form.category);
    return form.officerDesignation && !base.some((item) => item.value === form.officerDesignation)
      ? [{ label: form.officerDesignation, value: form.officerDesignation }, ...base]
      : base;
  }, [form.category, form.officerDesignation]);

  // ADA uses Division for the office location; ADA and DAO use a district-based Place of Inspection
  const isADAOfficer = isAdaDesignation(form.officerDesignation);
  const isDAOOfficer = isDaoDesignation(form.officerDesignation);
  const isMAOOfficer = isMaoDesignation(form.officerDesignation);
  const usesPlaceOfInspection = isADAOfficer || isDAOOfficer;

  const filteredSaved = useMemo(() => {
    const scoped = lockedCategory ? savedNotices.filter((notice) => notice.category === lockedCategory) : savedNotices;
    const term = savedSearch.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter((notice) =>
      [notice.memoNumber, notice.dealerName, notice.firmName, notice.category, notice.inspectionDate, notice.status]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [savedNotices, savedSearch, lockedCategory]);

  useEffect(() => {
    writeSavedNotices(savedNotices);
  }, [savedNotices]);

  const updateForm = (patch: Partial<NoticeFormState>) => setForm((current) => ({ ...current, ...patch }));

  const changeCategory = (category: NoticeCategory) => {
    const next = makeInitialForm(category);
    updateForm({
      category,
      memoNumber: next.memoNumber,
      noticeDate: next.noticeDate,
      selectedViolationIds: [],
      observation: '',
      dealerName: '',
      firmName: '',
      productName: '',
      batchLotNumber: '',
      quantityInvolved: '',
      productRemarks: '',
      enclosures: '',
      inspectedBy: 'self',
    });
    setShowProductDetails(false);
    setShowNoticePreview(false);
  };

  const toggleViolation = (violationId: string) => {
    setForm((current) => {
      const selected = new Set(current.selectedViolationIds);
      if (selected.has(violationId)) selected.delete(violationId);
      else selected.add(violationId);
      return { ...current, selectedViolationIds: Array.from(selected) };
    });
  };

  const toggleViolationGroup = (label: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      const key = label || '__default';
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderViolationCard = (violation: ShowCauseViolation) => {
    const sourceBadge = legalSourceBadge(violation.actOrOrder);
    return (
      <label key={violation.violationId} title={violation.shortDescription} className={`flex h-full cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm transition ${config.theme.card}`}>
        <input
          type="checkbox"
          checked={form.selectedViolationIds.includes(violation.violationId)}
          onChange={() => toggleViolation(violation.violationId)}
          className={`mt-0.5 h-[18px] w-[18px] min-h-[18px] min-w-[18px] shrink-0 rounded ${config.theme.checkbox}`}
        />
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex flex-wrap items-center gap-1.5">
            {sourceBadge && (
              <span className="inline-flex shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black leading-tight text-white">
                {sourceBadge}
              </span>
            )}
            <span className={`inline-flex max-w-full whitespace-normal break-normal rounded-full px-2 py-0.5 text-[11px] font-black leading-tight [overflow-wrap:normal] [word-break:normal] ${config.theme.badge}`}>
              {violation.exactReference}
            </span>
          </span>
          <span className="block whitespace-normal break-normal text-sm font-bold leading-snug text-slate-900 dark:text-white [overflow-wrap:normal] [word-break:normal]">{violation.shortDescription}</span>
        </span>
      </label>
    );
  };

  const saveNotice = () => {
    const id = `${form.memoNumber || 'draft'}-${Date.now()}`;
    const saved: SavedNotice = { ...form, id, savedAt: new Date().toISOString() };
    setSavedNotices((current) => [saved, ...current.filter((item) => item.memoNumber !== form.memoNumber)]);
  };

  const editSavedNotice = (notice: SavedNotice) => {
    const resolvedDistrict = resolveDistrict(notice.district || '', notice.manualDistrict || '');
    const resolvedMandal = resolveMandal(resolvedDistrict.district, notice.mandal || '', notice.manualMandal || '');
    const noticeForm: NoticeFormState = {
      category: notice.category,
      dealerName: notice.dealerName,
      firmName: notice.firmName,
      licenceNumber: notice.licenceNumber,
      dealerAddress: notice.dealerAddress,
      memoNumber: notice.memoNumber,
      financialYear: notice.inspectionDate ? financialYearForDate(notice.inspectionDate) : currentFinancialYear(),
      inspectionDate: notice.inspectionDate,
      noticeDate: notice.noticeDate || today(),
      inspectedBy: notice.inspectedBy || 'self',
      deadline: notice.deadline,
      officerName: notice.officerName,
      officerDesignation: notice.officerDesignation,
      mandal: resolvedMandal.mandal,
      district: resolvedDistrict.district,
      manualMandal: resolvedMandal.manualMandal,
      manualDistrict: resolvedDistrict.manualDistrict,
      division: notice.division || '',
      productName: notice.productName,
      batchLotNumber: notice.batchLotNumber,
      quantityInvolved: notice.quantityInvolved,
      invoiceDetails: notice.invoiceDetails || '',
      productRemarks: notice.productRemarks || '',
      observation: notice.observation,
      enclosures: notice.enclosures || '',
      selectedViolationIds: notice.selectedViolationIds,
      status: notice.status,
    };
    setForm(noticeForm);
    setShowProductDetails(Boolean(notice.productName || notice.batchLotNumber || notice.quantityInvolved || notice.productRemarks));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetNotice = () => {
    if (!window.confirm('Reset the form? Unsaved entries will be lost.')) return;
    setForm(makeInitialForm(lockedCategory ?? form.category));
    setShowProductDetails(false);
    setShowNoticePreview(false);
  };

  const deleteSavedNotice = (notice: SavedNotice) => {
    if (!window.confirm(`Delete saved notice "${notice.memoNumber || 'Untitled'}"?`)) return;
    setSavedNotices((current) => current.filter((item) => item.id !== notice.id));
  };

  const noticeFileName = () => `${form.memoNumber || 'show-cause-notice'}.pdf`.replace(/[\\/]/g, '-');
  const noticeWordFileName = () => `${form.memoNumber || 'show-cause-notice'}.docx`.replace(/[\\/]/g, '-');

  const buildNoticePdfDoc = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    doc.setProperties({ title: form.memoNumber || 'Show Cause Notice', subject: 'Show Cause Notice', creator: 'AGRONIX' });
    const fontName = await loadNoticeFonts(doc);

    const PAGE_W = 210;
    const PAGE_H = 297;
    const ML = 20;
    const MR = 20;
    const MT = 15;
    const MB = 18;
    const CW = PAGE_W - ML - MR;
    const LH = 5.8;
    let y = MT;

    const measure = (text: string, bold: boolean) => {
      doc.setFont(fontName, bold ? 'bold' : 'normal');
      doc.setFontSize(12);
      return doc.getTextWidth(text);
    };
    const spaceWidth = () => measure(' ', false);
    const runsWidth = (runs: NoticeSegment[]) =>
      runs.reduce((total, run) => total + measure(run.text, !!run.bold), 0) + Math.max(runs.length - 1, 0) * spaceWidth();

    const drawRuns = (runs: NoticeSegment[], x: number, lineY: number, justifyToWidth?: number) => {
      let cx = x;
      let gap = spaceWidth();
      if (justifyToWidth && runs.length > 1) {
        const extra = justifyToWidth - runsWidth(runs);
        if (extra > 0) gap += extra / (runs.length - 1);
      }
      runs.forEach((run) => {
        doc.setFont(fontName, run.bold ? 'bold' : 'normal');
        doc.setFontSize(12);
        doc.text(run.text, cx, lineY);
        cx += doc.getTextWidth(run.text) + gap;
      });
    };

    const wrapSegments = (segments: NoticeSegment[], width: number, firstLineWidth?: number): NoticeSegment[][] => {
      const words: NoticeSegment[] = [];
      segments.forEach((segment) => {
        segment.text
          .split(/\s+/)
          .filter(Boolean)
          .forEach((word) => words.push({ text: word, bold: segment.bold }));
      });
      const lines: NoticeSegment[][] = [];
      let current: NoticeSegment[] = [];
      let limit = firstLineWidth ?? width;
      words.forEach((word) => {
        const candidate = [...current, word];
        if (current.length > 0 && runsWidth(candidate) > limit) {
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

    const pageBreak = () => {
      doc.setFont(fontName, 'normal');
      doc.setFontSize(10);
      doc.text("(Cont'd...)", PAGE_W - MR, PAGE_H - MB + 6, { align: 'right' });
      doc.addPage();
      doc.setFontSize(12);
      y = MT;
    };
    const ensureSpace = (needed: number) => {
      if (y + needed > PAGE_H - MB) pageBreak();
    };

    doc.setFontSize(12);
    noticeBlocks.forEach((block) => {
      switch (block.kind) {
        case 'center': {
          const bold = !!block.bold;
          const width = measure(block.text, bold);
          ensureSpace(LH);
          doc.setFont(fontName, bold ? 'bold' : 'normal');
          doc.setFontSize(12);
          const x = (PAGE_W - width) / 2;
          doc.text(block.text, x, y);
          if (block.underline) doc.line(x, y + 0.8, x + width, y + 0.8);
          y += LH;
          break;
        }
        case 'memoRow': {
          ensureSpace(LH);
          drawRuns(block.left, ML, y);
          drawRuns(block.right, PAGE_W - MR - runsWidth(block.right), y);
          y += LH;
          break;
        }
        case 'para': {
          const indent = block.indent || 0;
          const firstLineIndent = block.firstLineIndent || 0;
          const lineWidth = CW - indent;
          const lines = wrapSegments(block.segments, lineWidth, firstLineIndent ? lineWidth - firstLineIndent : undefined);
          lines.forEach((runs, index) => {
            ensureSpace(LH);
            const isLastLine = index === lines.length - 1;
            const offset = index === 0 ? firstLineIndent : 0;
            drawRuns(runs, ML + indent + offset, y, isLastLine ? undefined : lineWidth - offset);
            y += LH;
          });
          y += 1;
          break;
        }
        case 'labelPara': {
          const indent = block.indent || 0;
          const labelWidth = measure(`${block.label} `, true);
          const lineWidth = CW - indent - labelWidth;
          const lines = wrapSegments(block.segments, lineWidth);
          lines.forEach((runs, index) => {
            ensureSpace(LH);
            if (index === 0) {
              doc.setFont(fontName, 'bold');
              doc.setFontSize(12);
              doc.text(block.label, ML + indent, y);
            }
            const isLastLine = index === lines.length - 1;
            drawRuns(runs, ML + indent + labelWidth, y, isLastLine ? undefined : lineWidth);
            y += LH;
          });
          y += 1;
          break;
        }
        case 'heading': {
          const lines = wrapSegments([{ text: block.text, bold: true }], CW);
          lines.forEach((runs) => {
            ensureSpace(LH);
            drawRuns(runs, ML, y);
            y += LH;
          });
          break;
        }
        case 'lines': {
          const indent = block.indent || 0;
          const wrapped = block.items.map((item) => wrapSegments(item, CW - indent));
          const blockWidth = block.centerLines
            ? Math.max(...wrapped.flat().map((runs) => runsWidth(runs)))
            : 0;
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

    return doc;
  };

  const downloadPdf = async () => {
    const doc = await buildNoticePdfDoc();
    doc.save(noticeFileName());
  };

  const downloadWord = async () => {
    try {
      const blob = await buildNoticeWordDocument(noticeBlocks);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = noticeWordFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      console.error('Unable to generate notice Word document:', error);
      window.alert('Word document could not be generated. Please try again.');
    }
  };

  const previewNotice = () => {
    setShowNoticePreview(true);
    window.requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="space-y-4">
      {!lockedCategory && (
        <div className={`overflow-hidden rounded-lg bg-gradient-to-r ${config.theme.header} px-4 py-3 text-white shadow-sm`}>
          <div>
            <h2 className="text-lg font-black">{config.title}</h2>
            <p className="text-xs font-semibold text-white/85">Show Cause Notice / Memo Entry</p>
          </div>
        </div>
      )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {!lockedCategory ? (
            <div className="inline-flex flex-wrap rounded-lg border border-white bg-white dark:bg-slate-900 p-1 shadow-sm">
              {noticeCategoryConfigs.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => changeCategory(item.category)}
                  className={`rounded-md px-3 py-2 text-sm font-black transition ${
                    form.category === item.category ? `${config.theme.button} text-white` : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.tabLabel}
                </button>
              ))}
            </div>
            ) : <span />}
            <button type="button" onClick={resetNotice} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-800/50 dark:bg-slate-900 dark:text-red-300 sm:text-sm">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Officer Details</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="Inspecting Officer" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
              <SelectInput label="Designation" value={form.officerDesignation} onChange={(value) => updateForm({ officerDesignation: value })} options={designationOptions} />
              <SelectInput
                label="District"
                value={form.district}
                onChange={(value) => updateForm({ district: value, mandal: '', manualMandal: '', manualDistrict: '' })}
                options={districtOptions}
              />
              {form.district === 'Others' && (
                <TextInput label="Enter District Name" value={form.manualDistrict} onChange={(value) => updateForm({ manualDistrict: value })} />
              )}
              {(isADAOfficer || isMAOOfficer) && (
                <TextInput
                  label={isADAOfficer ? 'Division' : 'Division (Copy to ADA)'}
                  value={form.division}
                  onChange={(value) => updateForm({ division: value })}
                />
              )}
              <SelectInput
                label={usesPlaceOfInspection ? 'Place of Inspection' : 'Mandal'}
                value={form.mandal}
                onChange={(value) => updateForm({ mandal: value, manualMandal: value === 'Others' ? form.manualMandal : '' })}
                options={mandalOptions}
              />
              {form.mandal === 'Others' && (
                <TextInput
                  label={usesPlaceOfInspection ? 'Enter Place of Inspection' : 'Enter Mandal Name'}
                  value={form.manualMandal}
                  onChange={(value) => updateForm({ manualMandal: value })}
                />
              )}
              <TextInput label="Memo/Lr. No" value={form.memoNumber} onChange={(value) => updateForm({ memoNumber: value })} />
              <TextInput
                label="Inspection Date"
                type="date"
                value={form.inspectionDate}
                onChange={(value) => updateForm({
                  inspectionDate: value,
                  financialYear: value ? financialYearForDate(value) : currentFinancialYear(),
                })}
              />
              <TextInput
                label="Notice Date"
                type="date"
                value={form.noticeDate}
                onChange={(value) => updateForm({ noticeDate: value })}
              />
              {!isMAOOfficer && (
                <SelectInput
                  label="Inspection Conducted By"
                  value={form.inspectedBy}
                  onChange={(value) => updateForm({ inspectedBy: value as 'self' | 'mao' })}
                  options={[
                    { label: 'Direct (by issuing officer)', value: 'self' },
                    { label: 'Mandal Agriculture Officer', value: 'mao' },
                  ]}
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Dealer Details</h3>
            <div className="grid gap-3 md:grid-cols-4">
            <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value, dealerName: value })} />
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Firm Address</span>
              <textarea
                value={form.dealerAddress}
                onChange={(event) => updateForm({ dealerAddress: event.target.value })}
                placeholder="D.No, Road, Village"
                rows={2}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <TextInput label="Licence Number" value={form.licenceNumber} onChange={(value) => updateForm({ licenceNumber: value })} optional />
            <SelectInput
              label="Deadline"
              value={form.deadline}
              onChange={(value) => updateForm({ deadline: value })}
              options={[
                { label: '3 (three) days', value: '3 (three) days' },
                { label: '5 (five) days', value: '5 (five) days' },
                { label: '7 (seven) days', value: '7 (seven) days' },
                { label: '10 (ten) days', value: '10 (ten) days' },
                { label: '15 (fifteen) days', value: '15 (fifteen) days' },
              ]}
            />
            <SelectInput
              label="Enclosures"
              value={form.enclosures}
              onChange={(value) => updateForm({ enclosures: value })}
              options={[
                ...(form.enclosures && !['Inspection report', 'License Copy', 'Authorization Letter', 'Farmer Complaint'].includes(form.enclosures)
                  ? [{ label: form.enclosures, value: form.enclosures }]
                  : []),
                { label: 'Inspection report', value: 'Inspection report' },
                { label: 'License Copy', value: 'License Copy' },
                { label: 'Authorization Letter', value: 'Authorization Letter' },
                { label: 'Farmer Complaint', value: 'Farmer Complaint' },
              ]}
            />
            </div>
          </div>

          <section>
            <h3 className={`mb-3 rounded-lg px-3 py-2 text-sm font-black ${config.theme.badge}`}>{config.heading}</h3>
            {hasViolationGroups ? (
              <div className="space-y-2">
                {violationGroups.map((group) => {
                  const groupKey = group.label || '__default';
                  const collapsed = !expandedGroups.has(groupKey);
                  const selectedCount = group.items.filter((item) => form.selectedViolationIds.includes(item.violationId)).length;
                  return (
                    <div key={groupKey} className={`overflow-hidden rounded-xl border shadow-sm ${config.theme.panel}`}>
                      <button
                        type="button"
                        onClick={() => toggleViolationGroup(group.label)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <span className="text-sm font-black leading-snug text-slate-800 dark:text-slate-100 sm:text-base">{group.label || 'Violations'}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {selectedCount > 0 && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${config.theme.badge}`}>{selectedCount} selected</span>
                          )}
                          <ChevronDown className={`h-5 w-5 text-slate-600 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                        </span>
                      </button>
                      {!collapsed && (
                        <div className="grid gap-2 p-2 md:grid-cols-2">
                          {group.items.map((violation) => renderViolationCard(violation))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {categoryViolations.map((violation) => renderViolationCard(violation))}
              </div>
            )}
          </section>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-slate-600 dark:text-slate-300">
                <span>{config.observationLabel}</span>
                {!showProductDetails && (
                  <button
                    type="button"
                    onClick={() => setShowProductDetails(true)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black text-white ${config.theme.button}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Product
                  </button>
                )}
              </span>
              <textarea
                value={form.observation}
                onChange={(event) => updateForm({ observation: event.target.value })}
                placeholder={config.observationPlaceholder}
                rows={4}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {showProductDetails && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">Product Details</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductDetails(false);
                      updateForm({ productName: '', batchLotNumber: '', quantityInvolved: '', productRemarks: '', invoiceDetails: '' });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <TextInput label="Product Name" value={form.productName} onChange={(value) => updateForm({ productName: value })} />
                  <TextInput label="Batch/Lot Number" value={form.batchLotNumber} onChange={(value) => updateForm({ batchLotNumber: value })} />
                  <TextInput label="Quantity" value={form.quantityInvolved} onChange={(value) => updateForm({ quantityInvolved: value })} />
                  <TextInput label="Remarks" value={form.productRemarks} onChange={(value) => updateForm({ productRemarks: value })} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={previewNotice} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black text-white shadow-sm transition sm:text-sm ${config.theme.button}`}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Preview
            </button>
            <button type="button" onClick={saveNotice} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-900 sm:text-sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Draft
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:text-sm"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
                <ChevronDown className={`h-4 w-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {exportOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close export menu"
                    onClick={() => setExportOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => { setExportOpen(false); void downloadPdf(); }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExportOpen(false); void downloadWord(); }}
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-xs font-black text-blue-700 transition hover:bg-blue-50 dark:border-slate-800 dark:text-blue-300 dark:hover:bg-slate-800 sm:text-sm"
                    >
                      <FileType className="h-4 w-4" aria-hidden="true" />
                      WORD
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

      {showNoticePreview && (
        <section ref={previewRef} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Notice Preview</h3>
            <button
              type="button"
              onClick={() => setShowNoticePreview(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              aria-label="Close notice preview"
            >
              <X className="h-4 w-4" />
              Close Preview
            </button>
          </div>
          <div
            className="max-h-[520px] overflow-auto rounded-lg bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-inner ring-1 ring-slate-100"
            style={{ fontFamily: `'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', serif`, fontSize: '12pt', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: noticeHtml }}
          />
        </section>
      )}

      <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Saved Notices</h3>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={savedSearch}
              onChange={(event) => setSavedSearch(event.target.value)}
              placeholder="Search saved notices"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Memo</th>
                <th className="px-3 py-2">Dealer</th>
                <th className="px-3 py-2">Inspection</th>
                <th className="px-3 py-2">Clauses/Sections/Rules</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSaved.map((notice) => (
                <tr key={notice.id}>
                  <td className="px-3 py-2 font-black">{notice.memoNumber}</td>
                  <td className="px-3 py-2">{notice.firmName || notice.dealerName || '-'}</td>
                  <td className="px-3 py-2">{notice.inspectionDate}</td>
                  <td className="px-3 py-2">{allShowCauseViolations.filter((item) => notice.selectedViolationIds.includes(item.violationId)).map((item) => item.exactReference).join(', ') || '-'}</td>
                  <td className="px-3 py-2">{notice.status}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => editSavedNotice(notice)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteSavedNotice(notice)} aria-label="Delete saved notice" className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 dark:text-red-300 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSaved.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center font-semibold text-slate-500 dark:text-slate-400">No saved notices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextInput({ label, value, onChange, type = 'text', optional = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; optional?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">
        {label}
        {optional && <span className="ml-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">(Optional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}
