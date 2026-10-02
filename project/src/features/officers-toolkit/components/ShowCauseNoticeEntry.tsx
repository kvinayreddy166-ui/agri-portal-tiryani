import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FileChild } from 'docx';
import { ChevronDown, Download, Edit3, FileText, FileType, Plus, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { currentFinancialYear, financialYearForDate } from '../../../shared/utils/financialYear';
import { useAuth } from '../../../shared/context/AuthContext';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { isAssistantDirectorOfAgriculture, statutoryDesignationDisplay, withOthersOption, effectiveLocationValue } from '../../../shared/data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import { setupPdfUnicodeFonts, DOCX_TELUGU_FONT } from '../../../shared/lib/pdfUnicodeFonts';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
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

export function readStatutoryDetails(category: NoticeCategory) {
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

export function designationOptionsFor(category: NoticeCategory) {
  const inspector = category === 'seed' ? 'Seed Inspector' : category === 'pesticide' ? 'Insecticide Inspector' : 'Fertilizer Inspector';
  return [
    { label: `Mandal Agriculture Officer & ${inspector}`, value: `Mandal Agriculture Officer & ${inspector}` },
    { label: `Asst. Director of Agriculture & ${inspector}`, value: `Asst. Director of Agriculture & ${inspector}` },
    { label: `District Agriculture Officer & ${inspector}`, value: `District Agriculture Officer & ${inspector}` },
  ];
}

export function resolveDistrict(value: string, manual = '') {
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

export function resolveMandal(district: string, value: string, manual = '') {
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

const FORM_DRAFT_PREFIX = `${STORAGE_KEY}-draft-`;

// Persist the in-progress form per category so it survives app/session closure
function readFormDraft(category: NoticeCategory): NoticeFormState | null {
  try {
    const raw = window.localStorage.getItem(`${FORM_DRAFT_PREFIX}${category}`);
    if (!raw) return null;
    return { ...makeInitialForm(category), ...(JSON.parse(raw) as Partial<NoticeFormState>), category };
  } catch {
    return null;
  }
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

export function formatNoticeDate(value: string) {
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

export function isAdaDesignation(designation: string): boolean {
  const lower = (designation || '').toLowerCase();
  return isAssistantDirectorOfAgriculture(designation)
    || ((lower.includes('asst') || lower.includes('assistant') || lower.trim() === 'ada') && lower.includes('director'));
}

export function isDaoDesignation(designation: string): boolean {
  const lower = (designation || '').toLowerCase();
  return lower.includes('district agriculture officer') || lower.trim() === 'dao';
}

export function isMaoDesignation(designation: string): boolean {
  const lower = (designation || '').toLowerCase();
  return lower.includes('mandal agriculture officer') || lower.trim() === 'mao';
}

export interface NoticeSegment {
  text: string;
  bold?: boolean;
}

export type NoticeBlock =
  | { kind: 'center'; text: string; bold?: boolean; underline?: boolean; size?: number; keepWithNext?: boolean }
  | { kind: 'memoRow'; left?: NoticeSegment[]; right?: NoticeSegment[]; leftLines?: NoticeSegment[][]; rightLines?: NoticeSegment[][]; keepWithNext?: boolean }
  | { kind: 'para'; segments: NoticeSegment[]; indent?: number; firstLineIndent?: number; keepWithNext?: boolean }
  | { kind: 'labelPara'; label: string; labelSuffix?: string; segments: NoticeSegment[]; indent?: number; labelPad?: string; labelBold?: boolean; keepWithNext?: boolean }
  | { kind: 'heading'; text: string; keepWithNext?: boolean }
  | { kind: 'lines'; items: NoticeSegment[][]; indent?: number; align?: 'right'; centerLines?: boolean; offsetX?: number; keepWithNext?: boolean }
  | { kind: 'table'; header: [string, string]; rows: { label: string; value: string }[]; keepWithNext?: boolean }
  | { kind: 'gridTable'; header: string[]; rows: string[][]; colWeights?: number[]; keepWithNext?: boolean }
  | { kind: 'rule'; keepWithNext?: boolean }
  | { kind: 'gap'; mm?: number; keepWithNext?: boolean };

const NOTICE_FONT_STACK = `'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', 'Nirmala UI', serif`;

// One-tab indent (mm) for "Sub:"/"Ref:" label lines, per standard memo/notice format
const SUBJECT_REF_INDENT = 10;

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
    ? (form.division.trim() ? form.division.trim() : '________________')
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
    [{ text: `M/s. ${form.firmName || form.dealerName || '__________________________________________'}` }],
    [{ text: form.dealerAddress || '_______________________________________________' }],
    [{ text: effectiveLocationValue(form.mandal, form.manualMandal) || '________________' }],
    [{ text: districtDisplay }],
  ];

  const dealerItems: NoticeSegment[][] = [
    ...addressLines.map((line, index) => {
      const suffix = index === addressLines.length - 1 ? '.' : ',';
      const last = line[line.length - 1];
      return [...line.slice(0, -1), { ...last, text: `${last.text.trimEnd()}${suffix}` }]
        .map((segment) => ({ ...segment, bold: true }));
    }),
    ...(form.licenceNumber.trim()
      ? [[{ text: 'Licence No.: ', bold: true }, { text: form.licenceNumber, bold: true }]]
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
  const signatureDesignationParts = officerDesignation.split('&').map((part) => part.trim()).filter(Boolean);
  const signatureItems: NoticeSegment[][] = signatureDesignationParts.length > 1
    ? [
        [{ text: `${displayDesignation} &`, bold: true }],
        [{ text: signatureDesignationParts.slice(1).join(' & ').replace(/,+$/, ''), bold: true }],
      ]
    : [[{ text: displayDesignation, bold: true }]];

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
          [{ text: designationParts.slice(1).join(' & ').replace(/,+$/, ''), bold: true }],
        ]
      : [[{ text: displayDesignation, bold: true }]];
    const memoCopyLines = `1. The Asst. Director of Agriculture (R), ${divisionName}, for favour of information and necessary action.\n2. The District Agriculture Officer, ${districtDisplay}, for favour of information and necessary action.\n3. Copy to Stock File.`.split('\n');
    const memoNoticedPhrase = violationItems.length > 0
      ? `the following irregularities and contraventions of the ${instrument} were noticed:`
      : `certain irregularities and contraventions of the ${instrument} were noticed.`;
    return [
      { kind: 'center', text: `Office of the ${displayDesignation}, ${officerLocation}`, bold: true, underline: true, size: 14 },
      { kind: 'gap', mm: 4 },
      {
        kind: 'memoRow',
        left: [{ text: 'Memo No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
        right: [{ text: 'Dt.: ' }, { text: form.inspectionDate ? noticeDate : ' '.repeat(11), bold: true }],
      },
      { kind: 'gap', mm: 4 },
      { kind: 'center', text: 'MEMO', bold: true, underline: true },
      { kind: 'gap', mm: 3 },
      {
        kind: 'labelPara',
        label: 'Sub:',
        indent: SUBJECT_REF_INDENT,
        segments: [
          { text: `${subjectLabel} – Inspection of dealer premises of ` },
          { text: firmDisplay, bold: true },
          { text: `, ${mandalValue}` },
          { text: ' – Irregularities noticed during inspection – Memo issued – Explanation called for – Reg.' },
        ],
      },
      {
        kind: 'labelPara',
        label: 'Ref:',
        labelSuffix: '1.',
        indent: SUBJECT_REF_INDENT,
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
        labelBold: false,
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
      ...violationItems.map((item, index): NoticeBlock => ({ kind: 'labelPara', label: `${toRoman(index + 1)})`, labelBold: false, segments: item, indent: 8 })),
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
        labelBold: false,
        segments: [
          { text: `The aforesaid irregularities constitute a violation of the mandatory provisions of the ${instrument} and the conditions of ${memoLicencePhrase}.` },
        ],
      },
      {
        kind: 'labelPara',
        label: '3.',
        labelBold: false,
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
        labelBold: false,
        segments: [
          { text: `If no written explanation is received within the stipulated period of ${explanationPeriod}, it will be construed that the firm has no explanation to offer, and the matter will be reported to the ` },
          { text: 'Notified Authority', bold: true },
          { text: ` without further reference to the firm for initiating/proposing appropriate action under the provisions of the ${instrument} and other applicable Act(s), Rules, and Orders.` },
        ],
      },
      { kind: 'gap', mm: 4, keepWithNext: true },
      ...(form.enclosures.trim()
        ? [{ kind: 'lines', items: [[{ text: 'Encl: ' }, { text: form.enclosures.trim(), bold: true }]], keepWithNext: true } as NoticeBlock]
        : []),
      { kind: 'gap', mm: 4, keepWithNext: true },
      { kind: 'lines', items: memoSignatureItems, align: 'right', centerLines: true, offsetX: 5, keepWithNext: true },
      { kind: 'gap', mm: 4, keepWithNext: true },
      { kind: 'lines', items: [[{ text: 'To', bold: true }]], keepWithNext: true },
      { kind: 'lines', items: dealerItems, indent: 8, keepWithNext: true },
      { kind: 'gap', mm: 3, keepWithNext: true },
      { kind: 'lines', items: [[{ text: 'Copy submitted to:', bold: true }]], keepWithNext: true },
      ...memoCopyLines.map((line, index): NoticeBlock => {
        const keepWithNext = index < memoCopyLines.length - 1;
        const match = line.match(/^(\d+\.)\s*(.*)$/);
        return match
          ? { kind: 'labelPara', label: match[1], labelBold: false, segments: [{ text: match[2] }], keepWithNext }
          : { kind: 'lines', items: [[{ text: line }]], keepWithNext };
      }),
    ];
  }

  // Formal Show Cause Notice format (ADA / DAO):
  // government + department heading, "Office of the ___" with address, Rc.No./Date row,
  // centred title, Sub + numbered Ref, "Whereas / And whereas" numbered paras with
  // roman-numbered violation items, addressee AFTER the signature, Copy To last.
  const inspectedByMao = form.inspectedBy === 'mao';
  const officeLocation = isDAO ? districtDisplay : officerLocation;
  const inspectionRef = inspectedByMao
    ? `Inspection report of the Mandal Agriculture Officer, ${mandalValue}${inspectionDate ? `, dt. ${inspectionDate}` : ''}.`
    : `Field inspection of the dealer premises conducted${inspectionDate ? ` on ${inspectionDate}` : ''}.`;
  const scnSectionBlocks: NoticeBlock[] = [
    ...violationItems.map((item, index): NoticeBlock => ({ kind: 'labelPara', label: `${toRoman(index + 1)})`, labelBold: false, segments: item, indent: 8 })),
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
    { kind: 'center', text: `Office of the ${displayDesignation}, ${officeLocation}`, bold: true, underline: true, size: 14 },
    { kind: 'gap', mm: 4 },
    {
      kind: 'memoRow',
      left: [{ text: 'Rc.No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
      right: [{ text: 'Date: ' }, { text: form.inspectionDate ? noticeDate : ' '.repeat(11), bold: true }],
    },
    { kind: 'gap', mm: 4 },
    { kind: 'center', text: noticeTitle, bold: true, underline: true },
    { kind: 'gap', mm: 3 },
    {
      kind: 'labelPara',
      label: 'Sub:',
      indent: SUBJECT_REF_INDENT,
      segments: [
        { text: `${subjectLabel} – Inspection of ` },
        { text: `${firmDisplay}, ${mandalValue}`, bold: true },
        { text: ` – Irregularities noticed under the ${instrumentSub} – ${noticeTitleText} issued – Explanation called for – Reg.` },
      ],
    },
    {
      kind: 'labelPara',
      label: 'Ref:',
      labelSuffix: '1.',
      indent: SUBJECT_REF_INDENT,
      segments: [
        { text: `${certificateTerm} held by ` },
        { text: `${firmDisplay}.`, bold: true },
      ],
    },
    { kind: 'labelPara', label: '2.', segments: [{ text: inspectionRef }], labelPad: 'Ref:', indent: SUBJECT_REF_INDENT, labelBold: false },
    { kind: 'gap', mm: 2 },
    { kind: 'center', text: '***' },
    { kind: 'gap', mm: 1 },
    {
      kind: 'labelPara',
      label: '1.',
      labelBold: false,
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
      labelBold: false,
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
      labelBold: false,
      segments: [
        { text: `The aforesaid irregularities constitute a violation of the mandatory provisions of the ${instrument} and ${licenceConditionPhrase}, warranting statutory and administrative action under the relevant provisions of the Order and applicable Acts/Rules.` },
      ],
    },
    {
      kind: 'labelPara',
      label: '4.',
      labelBold: false,
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
      labelBold: false,
      segments: [
        { text: `If no written explanation is received in this office within the stipulated period of ${explanationPeriod}, it will be construed that the firm has no explanation to offer, and the matter will be examined and decided ` },
        { text: 'ex-parte', bold: true },
        { text: ' based on the material available on record without any further reference, and further action as deemed fit will be initiated under the provisions of the applicable Act(s), Rules, and Orders.' },
      ],
    },
    ...(form.enclosures.trim()
      ? [{ kind: 'lines', items: [[{ text: 'Encl: ' }, { text: form.enclosures.trim(), bold: true }]], keepWithNext: true } as NoticeBlock]
      : []),
    { kind: 'gap', mm: 8, keepWithNext: true },
    { kind: 'lines', items: signatureItems, align: 'right', centerLines: true, offsetX: 5, keepWithNext: true },
    { kind: 'gap', mm: 4, keepWithNext: true },
    { kind: 'lines', items: [[{ text: 'To', bold: true }]], keepWithNext: true },
    { kind: 'lines', items: dealerItems, indent: 8, keepWithNext: true },
    { kind: 'gap', mm: 3, keepWithNext: true },
    { kind: 'lines', items: [[{ text: 'Copy to:', bold: true }]], keepWithNext: true },
    ...copyLines.map((line, index): NoticeBlock => {
      const keepWithNext = index < copyLines.length - 1;
      const match = line.match(/^(\d+\.)\s*(.*)$/);
      return match
        ? { kind: 'labelPara', label: match[1], labelBold: false, segments: [{ text: match[2] }], keepWithNext }
        : { kind: 'lines', items: [[{ text: line }]], keepWithNext };
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

export function noticeBlocksHtml(blocks: NoticeBlock[]) {
  const renderBlock = (block: NoticeBlock) => {
      switch (block.kind) {
        case 'center':
          return `<div style="text-align:center;${block.bold ? 'font-weight:700;' : ''}${block.underline ? 'text-decoration:underline;' : ''}${block.size ? `font-size:${block.size}pt;` : ''}">${escapeHtml(block.text)}</div>`;
        case 'memoRow': {
          const leftLines = block.leftLines ?? (block.left ? [block.left] : []);
          const rightLines = block.rightLines ?? (block.right ? [block.right] : []);
          const leftHtml = leftLines.map((line) => `<div>${segmentsHtml(line)}</div>`).join('');
          const rightInner = rightLines.map((line) => `<div>${segmentsHtml(line)}</div>`).join('');
          const rightHtml = block.rightLines
            ? `<span style="display:inline-block;text-align:center;">${rightInner}</span>`
            : `<span>${rightInner}</span>`;
          return `<div style="display:flex;justify-content:space-between;gap:12pt;"><span>${leftHtml}</span>${rightHtml}</div>`;
        }
        case 'para':
          return `<p style="margin:0 0 4pt ${block.indent || 0}mm;text-align:justify;${block.firstLineIndent ? `text-indent:${block.firstLineIndent}mm;` : ''}">${segmentsHtml(block.segments)}</p>`;
        case 'labelPara': {
          const pad = block.labelPad ? `<strong style="flex:none;visibility:hidden;">${escapeHtml(block.labelPad)}&nbsp;</strong>` : '';
          const labelTag = block.labelBold === false ? 'span' : 'strong';
          const suffix = block.labelSuffix ? `<span style="flex:none;">${escapeHtml(block.labelSuffix)}&nbsp;</span>` : '';
          return `<div style="display:flex;margin:0 0 4pt ${block.indent || 0}mm;">${pad}<${labelTag} style="flex:none;">${escapeHtml(block.label)}&nbsp;</${labelTag}>${suffix}<span style="flex:1;text-align:justify;">${segmentsHtml(block.segments)}</span></div>`;
        }
        case 'heading':
          return `<p style="margin:6pt 0 2pt;font-weight:700;">${escapeHtml(block.text)}</p>`;
        case 'lines': {
          const inner = block.items.map((item) => `<div>${segmentsHtml(item)}</div>`).join('');
          if (block.centerLines) {
            return `<div style="margin-left:${block.indent || 0}mm;text-align:right;transform:translateX(${block.offsetX || 0}mm);"><div style="display:inline-block;text-align:center;">${inner}</div></div>`;
          }
          return `<div style="margin-left:${block.indent || 0}mm;text-align:${block.align === 'right' ? 'right' : 'left'};transform:translateX(${block.offsetX || 0}mm);">${inner}</div>`;
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
        case 'gridTable': {
          const weights = block.colWeights && block.colWeights.length === block.header.length
            ? block.colWeights
            : block.header.map(() => 1);
          const total = weights.reduce((a, b) => a + b, 0);
          const cols = weights.map((w) => `<col style="width:${(w / total) * 100}%;"/>`).join('');
          return `<table style="width:100%;border-collapse:collapse;margin:2pt 0 4pt;table-layout:fixed;font-size:11pt;">${cols}<thead><tr>${block.header
            .map((cell) => `<th style="border:1pt solid #000;padding:2pt 4pt;text-align:center;font-weight:700;vertical-align:middle;overflow-wrap:break-word;">${escapeHtml(cell)}</th>`)
            .join('')}</tr></thead><tbody>${block.rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => `<td style="border:1pt solid #000;padding:2pt 4pt;text-align:center;vertical-align:middle;overflow-wrap:break-word;">${escapeHtml(cell) || '&nbsp;'}</td>`)
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
  return `<html><head><style>@page{size:A4;margin:18mm 20mm;}body{font-family:${NOTICE_FONT_STACK};font-size:12pt;line-height:1.5;color:#000;}</style></head><body>${noticeBlocksHtml(blocks)}</body></html>`;
}

export async function buildNoticeWordDocument(blocks: NoticeBlock[], docFont: NoticeDocFont = 'bookAntiqua') {
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

  const latinFont = docFont === 'robotoSerif' ? 'Roboto Serif' : 'Book Antiqua';
  const font = { ascii: latinFont, hAnsi: latinFont, eastAsia: latinFont, cs: DOCX_TELUGU_FONT };
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
          children: [new TextRun({ text: block.text, bold: block.bold, underline: block.underline ? { type: UnderlineType.SINGLE } : undefined, font, size: block.size ? block.size * 2 : fontSize })],
          alignment: AlignmentType.CENTER,
          keepNext: block.keepWithNext,
          spacing: { line: 360, after: 0 },
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
            spacing: { line: 360, after: 0 },
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
            spacing: { line: 360, after: 0 },
          }));
        }
        break;
      case 'para':
        children.push(new Paragraph({
          children: runs(block.segments),
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: mmToTwips(block.indent || 0),
            firstLine: mmToTwips(block.firstLineIndent || 0),
          },
          keepNext: block.keepWithNext,
          spacing: { line: 360, after: 80 },
        }));
        break;
      case 'labelPara': {
        const hanging = mmToTwips(7);
        // Approximate the bold leader's width so "2." aligns under "1." after "Ref:".
        const padTwips = block.labelPad ? mmToTwips(block.labelPad.length * 2.3 + 1.4) : 0;
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${block.label} `, bold: block.labelBold !== false, font, size: fontSize }),
            ...(block.labelSuffix ? [new TextRun({ text: `${block.labelSuffix} `, font, size: fontSize })] : []),
            ...runs(block.segments),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: mmToTwips(block.indent || 0) + padTwips + hanging, hanging },
          keepNext: block.keepWithNext,
          spacing: { line: 360, after: 80 },
        }));
        break;
      }
      case 'heading':
        children.push(new Paragraph({
          children: [new TextRun({ text: block.text, bold: true, font, size: fontSize })],
          keepNext: block.keepWithNext,
          spacing: { line: 360, before: 120, after: 40 },
        }));
        break;
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
            keepNext: block.keepWithNext,
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
      case 'gridTable': {
        const weights = block.colWeights && block.colWeights.length === block.header.length
          ? block.colWeights
          : block.header.map(() => 1);
        const total = weights.reduce((a, b) => a + b, 0);
        const contentWidth = mmToTwips(170);
        const cellPara = (text: string, bold = false) => new Paragraph({
          children: [new TextRun({ text, bold, font, size: fontSize - 2 })],
          alignment: AlignmentType.CENTER,
          spacing: { line: 360, after: 0 },
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
          spacing: { line: 360, after: 40 },
        }));
        break;
      case 'gap':
        children.push(new Paragraph({ children: [], keepNext: block.keepWithNext, spacing: { after: mmToTwips(block.mm ?? 2) } }));
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

export type NoticeDocFont = 'bookAntiqua' | 'robotoSerif';

export async function loadNoticeFonts(doc: { addFileToVFS: (name: string, data: string) => void; addFont: (file: string, name: string, style: string) => void }, font: NoticeDocFont = 'bookAntiqua') {
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

export async function renderNoticePdfDocument(noticeBlocks: NoticeBlock[], title: string, font: NoticeDocFont = 'bookAntiqua') {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({ title, subject: title, creator: 'AGRONIX' });
  const fontName = await loadNoticeFonts(doc, font);
  await setupPdfUnicodeFonts(doc);

  const PAGE_W = 210;
  const PAGE_H = 297;
  const ML = 20;
  const MR = 20;
  const MT = 15;
  const MB = 18;
  const CW = PAGE_W - ML - MR;
  const LH = 5.8;
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
    runs.forEach((run) => {
      doc.setFont(fontName, run.bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.text(run.text, cx, lineY);
      cx += doc.getTextWidth(run.text) + gap;
    });
  };

  const wrapSegments = (segments: NoticeSegment[], width: number, firstLineWidth?: number, size = 12): NoticeSegment[][] => {
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

  const GRID_FONT_SIZE = 11;
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
        return (block.size || 12) * 0.5;
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
        return lines.length * LH + 1;
      }
      case 'labelPara': {
        const padWidth = block.labelPad ? measure(`${block.labelPad} `, true) : 0;
        const labelBold = block.labelBold !== false;
        const suffix = block.labelSuffix ? `${block.labelSuffix} ` : '';
        const indent = (block.indent || 0) + padWidth;
        const labelWidth = measure(`${block.label} `, labelBold) + measure(suffix, false);
        return wrapSegments(block.segments, CW - indent - labelWidth).length * LH + 1;
      }
      case 'heading':
        return wrapSegments([{ text: block.text, bold: true }], CW).length * LH;
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
    doc.text("(Cont'd...)", PAGE_W - MR, PAGE_H - MB + 6, { align: 'right' });
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
        y += pt * 0.5;
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
        const padWidth = block.labelPad ? measure(`${block.labelPad} `, true) : 0;
        const labelBold = block.labelBold !== false;
        const suffix = block.labelSuffix ? `${block.labelSuffix} ` : '';
        const indent = (block.indent || 0) + padWidth;
        const labelWidth = measure(`${block.label} `, labelBold) + measure(suffix, false);
        const lineWidth = CW - indent - labelWidth;
        const lines = wrapSegments(block.segments, lineWidth);
        lines.forEach((runs, index) => {
          ensureSpace(LH);
          if (index === 0) {
            doc.setFontSize(12);
            doc.setFont(fontName, labelBold ? 'bold' : 'normal');
            doc.text(block.label, ML + indent, y);
            if (suffix) {
              doc.setFont(fontName, 'normal');
              doc.text(suffix, ML + indent + measure(`${block.label} `, labelBold), y);
            }
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

  return doc;
}

export function ShowCauseNoticeEntry({ lockedCategory }: { lockedCategory?: NoticeCategory } = {}) {
  const { isAdminUser, isTestUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser;
  const [form, setForm] = useState<NoticeFormState>(() => readFormDraft(lockedCategory ?? 'fertiliser') ?? makeInitialForm(lockedCategory ?? 'fertiliser'));
  const [savedNotices, setSavedNotices] = useState<SavedNotice[]>(() => readSavedNotices());
  const [savedSearch, setSavedSearch] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showNoticePreview, setShowNoticePreview] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const previewRef = useRef<HTMLDivElement>(null);
  const [resetSpinKey, setResetSpinKey] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo, showWarning } = useToast();

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

  useEffect(() => {
    try {
      window.localStorage.setItem(`${FORM_DRAFT_PREFIX}${form.category}`, JSON.stringify(form));
    } catch {}
  }, [form]);

  const updateForm = (patch: Partial<NoticeFormState>) => setForm((current) => ({ ...current, ...patch }));

  const changeCategory = (category: NoticeCategory) => {
    const draft = readFormDraft(category);
    if (draft) {
      setForm(draft);
      setShowProductDetails(Boolean(draft.productName || draft.batchLotNumber || draft.quantityInvolved || draft.productRemarks));
      setShowNoticePreview(false);
      return;
    }
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
    showSaved('Draft saved', form.memoNumber || 'Untitled notice');
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
    showLoaded('Draft loaded', notice.memoNumber || 'Untitled notice');
  };

  const resetNotice = () => {
    setResetConfirmOpen(true);
  };

  const performReset = () => {
    setResetSpinKey((current) => current + 1);
    const next = makeInitialForm(lockedCategory ?? form.category);
    setForm({
      ...next,
      dealerName: '',
      firmName: '',
      licenceNumber: '',
      dealerAddress: '',
      memoNumber: '',
      inspectionDate: '',
      noticeDate: '',
      deadline: '',
      officerName: '',
      officerDesignation: '',
      mandal: '',
      district: '',
      manualMandal: '',
      manualDistrict: '',
      division: '',
      enclosures: '',
    });
    setShowProductDetails(false);
    setShowNoticePreview(false);
    showReset('Form reset');
  };

  const deleteSavedNotice = (notice: SavedNotice) => {
    setSavedNotices((current) => current.filter((item) => item.id !== notice.id));
    showDeleted('Notice deleted', notice.memoNumber || 'Untitled notice');
  };

  const noticeFileName = () => `${form.memoNumber || 'show-cause-notice'}.pdf`.replace(/[\\/]/g, '-');
  const noticeWordFileName = () => `${form.memoNumber || 'show-cause-notice'}.docx`.replace(/[\\/]/g, '-');

  const buildNoticePdfDoc = () => renderNoticePdfDocument(noticeBlocks, form.memoNumber || 'Show Cause Notice');

  const downloadPdf = async () => {
    const doc = await buildNoticePdfDoc();
    doc.save(noticeFileName());
    showSuccess('PDF downloaded', noticeFileName());
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
      showSuccess('Word downloaded', noticeWordFileName());
    } catch (error) {
      console.error('Unable to generate notice Word document:', error);
      showWarning('Word export failed', 'Please try again.');
    }
  };

  const previewNotice = () => {
    setShowNoticePreview(true);
    showInfo('Preview ready');
    window.requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset form?"
        message="All entered details will be cleared."
        onConfirm={() => { setResetConfirmOpen(false); performReset(); }}
        onCancel={() => setResetConfirmOpen(false)}
      />
      {!lockedCategory && showCompactHeader && (
        <CompactToolkitHeader
          eyebrow="Inspection & Enforcement"
          title={config.title}
          subtitle="Show Cause Notice / Memo Entry"
        />
      )}
      {!lockedCategory && !showCompactHeader && (
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
              <RotateCcw key={resetSpinKey} className="h-4 w-4 reset-ccw-spin" aria-hidden="true" />
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
                  label="Division"
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
            style={{ fontFamily: NOTICE_FONT_STACK, fontSize: '12pt', lineHeight: 1.5 }}
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

export function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
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

export function TextInput({ label, value, onChange, type = 'text', optional = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; optional?: boolean }) {
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
