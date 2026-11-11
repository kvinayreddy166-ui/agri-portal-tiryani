import { localTodayDate } from '../../../shared/utils/dateUtils';
import { currentFinancialYear } from '../../../shared/utils/financialYear';
import {
  isAssistantDirectorOfAgriculture,
  statutoryDesignationDisplay,
  effectiveLocationValue,
} from '../../../shared/data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import { safeStorage } from '../../../shared/lib/safeStorage';
import {
  noticeCategoryConfigs,
  type NoticeCategory,
  type ShowCauseViolation,
} from '../data/showCauseViolationData';

export type NoticeStatus = 'Draft' | 'Issued' | 'Explanation Received' | 'Closed' | 'Action Proposed';

export interface NoticeFormState {
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

export interface SavedNotice extends NoticeFormState {
  id: string;
  savedAt: string;
  issuedAt?: string;
}

export const STORAGE_KEY = 'agri-legal-show-cause-notices';
export const today = () => localTodayDate();
export const ENCLOSURE_OPTIONS = [
  `'O' forms`,
  'Principal certificates',
  'Invoices/bills',
  'Cash/Credit Memo',
  'Stock Register',
  'Photo of Product',
  'Source Certificates',
  'Inspection report',
  'License Copy',
  'Authorization Letter',
  'Farmer Complaint',
];

// Sort key for a legal reference like "Rule 10(4)(i)", "Section 18(2)", "Clause 8A"
// Order: Sections first, then Clauses, then Rules, then Terms & Conditions / other refs.
// Within each instrument type, provisions sort in ascending numeric order;
// references with "r/w" sort after plain references to the same number.
export type ProvisionKey = (number | string)[];
export function provisionSortKey(reference: string): ProvisionKey {
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

export function compareProvisionKeys(a: ProvisionKey, b: ProvisionKey): number {
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x === y) continue;
    if (typeof x === 'number' && typeof y === 'number') return x - y;
    return String(x).localeCompare(String(y));
  }
  return 0;
}

export const NOTICE_INSPECTOR_LABELS: Record<NoticeCategory, string> = {
  fertiliser: 'Fertilizer Inspector',
  pesticide: 'Insecticide Inspector',
  seed: 'Seed Inspector',
};

export function baseNoticeDesignation(raw: string): string {
  const cleaned = raw.replace(/\s*\((?:R|T)\)\s*/gi, '').replace(/\s*&.*$/i, '').trim();
  if (/director/i.test(cleaned)) return 'Asst. Director of Agriculture';
  if (/district/i.test(cleaned)) return 'District Agriculture Officer';
  if (/mandal|\bmao\b|extension/i.test(cleaned)) return 'Mandal Agriculture Officer';
  return 'Mandal Agriculture Officer';
}

/** Statutory drafts store plain designations; order entries need the combined "X & Inspector" form. */
export function combinedNoticeDesignation(raw: string, category: NoticeCategory): string {
  const value = (raw || '').trim();
  if (!value) return designationOptionsFor(category)[0].value;
  if (value.includes('&')) return value;
  return `${baseNoticeDesignation(value)} & ${NOTICE_INSPECTOR_LABELS[category]}`;
}

export function readStatutoryDetails(category: NoticeCategory) {
  const storageKey = category === 'fertiliser'
    ? 'tiryani-fertilizer-forms-draft'
    : category === 'seed'
      ? 'tiryani-seed-forms-draft'
      : 'tiryani-pesticide-forms-draft';
  try {
    const saved = JSON.parse(safeStorage.getItem(storageKey) || '{}') as Record<string, string>;
    const rawDesignation = saved.designation || saved.officerDesignation || '';
    return {
      officerName: saved.officerName || '',
      officerDesignation: combinedNoticeDesignation(rawDesignation, category),
      mandal: saved.placeOfCollectionMandal || saved.sampleDrawingMandal || saved.mandal || 'Tiryani',
      district: saved.district || 'Kumurambheem Asifabad',
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
  if (alias === 'kumuram bheem asifabad' || alias === 'kumurambheem asifabad' || alias === 'kumrambheem asifabad') {
    return { district: 'Kumurambheem Asifabad', manualDistrict: '' };
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

export function readSavedNotices(): SavedNotice[] {
  try {
    const parsed = JSON.parse(safeStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSavedNotices(notices: SavedNotice[]) {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
}

export const FORM_DRAFT_PREFIX = `${STORAGE_KEY}-draft-`;

// Persist the in-progress form per category so it survives app/session closure
export function readFormDraft(category: NoticeCategory): NoticeFormState | null {
  try {
    const raw = safeStorage.getItem(`${FORM_DRAFT_PREFIX}${category}`);
    if (!raw) return null;
    return { ...makeInitialForm(category), ...(JSON.parse(raw) as Partial<NoticeFormState>), category };
  } catch {
    return null;
  }
}

export function makeInitialForm(category: NoticeCategory): NoticeFormState {
  const config = noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
  const fy = currentFinancialYear();
  const statutory = readStatutoryDetails(category);
  const resolvedDistrict = resolveDistrict(statutory.district || 'Kumurambheem Asifabad', statutory.manualDistrict || '');
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

export function getConfig(category: NoticeCategory) {
  return noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
}

export function legalSourceBadge(actOrOrder: string) {
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

export function toRoman(value: number) {
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
  underline?: boolean;
}

export type NoticeBlock =
  | { kind: 'center'; text: string; bold?: boolean; underline?: boolean; size?: number; keepWithNext?: boolean; spaceAfter?: number }
  | { kind: 'memoRow'; left?: NoticeSegment[]; right?: NoticeSegment[]; leftLines?: NoticeSegment[][]; rightLines?: NoticeSegment[][]; keepWithNext?: boolean }
  | { kind: 'para'; segments: NoticeSegment[]; indent?: number; firstLineIndent?: number; keepWithNext?: boolean; spaceAfter?: number }
  | { kind: 'labelPara'; label: string; labelSuffix?: string; segments: NoticeSegment[]; indent?: number; labelPad?: string; labelBold?: boolean; keepWithNext?: boolean; spaceAfter?: number }
  | { kind: 'heading'; text: string; keepWithNext?: boolean; spaceAfter?: number }
  | { kind: 'lines'; items: NoticeSegment[][]; indent?: number; align?: 'right'; centerLines?: boolean; offsetX?: number; keepWithNext?: boolean }
  | { kind: 'table'; header: [string, string]; rows: { label: string; value: string }[]; keepWithNext?: boolean }
  | { kind: 'gridTable'; header: string[]; rows: string[][]; colWeights?: number[]; keepWithNext?: boolean }
  | { kind: 'rule'; keepWithNext?: boolean }
  | { kind: 'gap'; mm?: number; keepWithNext?: boolean };

export const NOTICE_FONT_STACK = `'Times New Roman', Times, 'Noto Serif', serif`;

// One-tab indent (mm) for "Sub:"/"Ref:" label lines, per standard memo/notice format
export const SUBJECT_REF_INDENT = 10;

export function buildNoticeModel(form: NoticeFormState, selectedViolations: ShowCauseViolation[]): NoticeBlock[] {
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
  const districtValue = effectiveLocationValue(form.district, form.manualDistrict) || 'Kumurambheem Asifabad';
  const districtDisplay = ['kumurambheem asifabad', 'kumrambheem asifabad'].includes(districtValue.toLowerCase()) ? 'Kumurambheem Asifabad' : districtValue;
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
  const inspectedByMao = form.inspectedBy === 'mao';
  const inspectionRef = inspectedByMao
    ? `Inspection report of the Mandal Agriculture Officer, ${mandalValue}${inspectionDate ? `, dt. ${inspectionDate}` : ''}.`
    : `Field inspection of the dealer premises conducted${inspectionDate ? ` on ${inspectionDate}` : ''}.`;
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
  // government + department heading, "Office of the ___" with station, No./Dt. row,
  // centred MEMORANDUM title, Sub + Ref, "******" separator, numbered paras with the
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
        left: [{ text: 'No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
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
        indent: SUBJECT_REF_INDENT,
        segments: [
          { text: `Field inspection conducted by the ${officerDesignation}, ${mandalValue}` },
          ...(inspectionDate ? [{ text: ' on ' }, { text: inspectionDate, bold: true }] : []),
          { text: '.' },
        ],
      },
      { kind: 'gap', mm: 2 },
      { kind: 'center', text: '******', bold: true },
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
      ...violationItems.map((item, index): NoticeBlock => ({ kind: 'labelPara', label: `${toRoman(index + 1)})`, labelBold: true, segments: item, indent: 8 })),
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
      { kind: 'gap', mm: 3 },
      ...(form.enclosures.trim()
        ? [{ kind: 'lines', items: [[{ text: 'Encl: ', bold: true }, { text: form.enclosures.trim() }]] } as NoticeBlock]
        : []),
      { kind: 'gap', mm: 4 },
      { kind: 'lines', items: memoSignatureItems, align: 'right', centerLines: true, offsetX: 5 },
      { kind: 'gap', mm: 3 },
      { kind: 'lines', items: [[{ text: 'To', bold: true }]], keepWithNext: true },
      { kind: 'lines', items: dealerItems, indent: 8 },
      { kind: 'gap', mm: 3.06 },
      { kind: 'lines', items: [[{ text: 'Copy to:', bold: true }]], keepWithNext: true },
      ...memoCopyLines.map((line): NoticeBlock => {
        const keepWithNext = false;
        const match = line.match(/^(\d+\.)\s*(.*)$/);
        return match
          ? { kind: 'labelPara', label: match[1], labelBold: false, segments: [{ text: match[2] }], keepWithNext, spaceAfter: 0 }
          : { kind: 'lines', items: [[{ text: line }]], keepWithNext };
      }),
    ];
  }

  // Formal Show Cause Notice format (ADA / DAO):
  // government + department heading, "Office of the ___" with address, No./Date row,
  // centred title, Sub + numbered Ref, "Whereas / And whereas" numbered paras with
  // roman-numbered violation items, addressee AFTER the signature, Copy To last.
  const officeLocation = isDAO ? districtDisplay : officerLocation;
  const scnSectionBlocks: NoticeBlock[] = [
    ...violationItems.map((item, index): NoticeBlock => ({ kind: 'labelPara', label: `${toRoman(index + 1)})`, labelBold: true, segments: item, indent: 8 })),
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
      left: [{ text: 'No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
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
      spaceAfter: 0,
      segments: [
        { text: `${certificateTerm} held by ` },
        { text: `${firmDisplay}.`, bold: true },
      ],
    },
    { kind: 'labelPara', label: '2.', labelPad: 'Ref:', indent: SUBJECT_REF_INDENT, spaceAfter: 0, segments: [{ text: inspectionRef }] },
    { kind: 'gap', mm: 2 },
    { kind: 'center', text: '******', bold: true },
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
    { kind: 'gap', mm: 3 },
    ...(form.enclosures.trim()
      ? [{ kind: 'lines', items: [[{ text: 'Encl: ', bold: true }, { text: form.enclosures.trim() }]] } as NoticeBlock]
      : []),
    { kind: 'gap', mm: 5 },
    { kind: 'lines', items: signatureItems, align: 'right', centerLines: true, offsetX: 5 },
    { kind: 'gap', mm: 3 },
    { kind: 'lines', items: [[{ text: 'To', bold: true }]], keepWithNext: true },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 3.06 },
    { kind: 'lines', items: [[{ text: 'Copy to:', bold: true }]], keepWithNext: true },
    ...copyLines.map((line): NoticeBlock => {
      const keepWithNext = false;
      const match = line.match(/^(\d+\.)\s*(.*)$/);
      return match
        ? { kind: 'labelPara', label: match[1], labelBold: false, segments: [{ text: match[2] }], keepWithNext, spaceAfter: 0 }
        : { kind: 'lines', items: [[{ text: line }]], keepWithNext };
    }),
  ];
}
