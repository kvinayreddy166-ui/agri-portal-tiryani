import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Edit3, FileText, Plus, Printer, Save, Search, X } from 'lucide-react';
import { currentFinancialYear, financialYearForDate } from '../utils/financialYear';
import { isAssistantDirectorOfAgriculture, statutoryDesignationDisplay, withOthersOption, effectiveLocationValue } from '../data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../data/telanganaDistrictMandalData';
import {
  noticeCategoryConfigs,
  allShowCauseViolations,
  type NoticeCategory,
  type RecommendedAction,
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
  recommendedActions: RecommendedAction[];
  selectedViolationIds: string[];
  status: NoticeStatus;
}

interface SavedNotice extends NoticeFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-show-cause-notices';
const today = () => new Date().toISOString().slice(0, 10);

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

const recommendedActions: RecommendedAction[] = [
  'show cause',
];

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
    recommendedActions: ['show cause'],
    selectedViolationIds: [],
    status: 'Draft',
  };
}

function getConfig(category: NoticeCategory) {
  return noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
}

function formatNoticeDate(value: string) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
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
  | { kind: 'para'; segments: NoticeSegment[]; indent?: number }
  | { kind: 'labelPara'; label: string; segments: NoticeSegment[] }
  | { kind: 'heading'; text: string }
  | { kind: 'checks'; items: NoticeSegment[][] }
  | { kind: 'lines'; items: NoticeSegment[][]; indent?: number; align?: 'right' }
  | { kind: 'table'; header: [string, string]; rows: { label: string; value: string }[] }
  | { kind: 'gap'; mm?: number };

const NOTICE_FONT_STACK = `'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', serif`;

function buildNoticeModel(form: NoticeFormState, selectedViolations: ShowCauseViolation[]): NoticeBlock[] {
  const inspectionDate = formatNoticeDate(form.inspectionDate);
  const noticeDate = formatNoticeDate(today());
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
  const districtUpper = districtDisplay.toUpperCase();
  const districtLine = /district$/i.test(districtUpper.trim()) ? districtUpper : `${districtUpper} DISTRICT`;
  const explanationPeriod = form.deadline || '7 (seven) days';

  // Copies submitted to - mirrors the covering-letter pattern based on issuing officer's designation
  const isADA = isAdaDesignation(officerDesignation);
  const isDAO = isDaoDesignation(officerDesignation);
  const isMAO = isMaoDesignation(officerDesignation);
  const noticeTitle = isMAO ? 'MEMO' : 'SHOW CAUSE NOTICE';
  const noticeTitleText = isMAO ? 'Memo' : 'Show Cause Notice';
  const divisionName = (form.division || '').toUpperCase() || '________________';
  // ADA officers operate at division level, DAO at district level, others at mandal level
  const officerLocation = isADA
    ? (form.division.trim() ? `${form.division.trim()} Division` : '________________')
    : isDAO
      ? districtDisplay
      : mandalValue;
  const copyLines = (isDAO
    ? 'The Commissioner & Director of Agriculture, Telangana State, for information and necessary action.'
    : isADA
      ? `The District Agriculture Officer, ${districtDisplay}, for information and necessary action.`
      : `1. The Asst. Director of Agriculture (R), ${divisionName}, for information and necessary action.\n2. The District Agriculture Officer, ${districtDisplay}, for information and necessary action.`
  ).split('\n');

  const dealerItems: NoticeSegment[][] = [
    [{ text: `M/s. ${form.firmName || form.dealerName || '__________________________________________'}`, bold: true }],
    [{ text: form.dealerAddress || '_______________________________________________', bold: true }],
    ...((isADA || isDAO)
      ? [
          [{ text: effectiveLocationValue(form.mandal, form.manualMandal) || '________________', bold: true }],
          [{ text: districtDisplay, bold: true }],
        ]
      : []),
    [{ text: 'Licence No.: ' }, { text: form.licenceNumber || '___________________________________', bold: true }],
  ];

  // Violation line: "description which is contravention to <Ref> <Act/Order/Rules>"
  // - Section -> parent Act, Clause -> Control Order, Rule -> Rules (actOrOrder already names the instrument)
  const violationItems: NoticeSegment[][] = selectedViolations.map((item) => [
    { text: item.shortDescription.replace(/\.+$/, '') },
    { text: ` which is contravention to ${item.exactReference} ${item.actOrOrder.replace(/,/g, '')}`, bold: true },
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

  // Sections are numbered dynamically and shown only when they have content
  let sectionNumber = 0;
  const sectionBlocks: NoticeBlock[] = [];
  if (violationItems.length > 0) {
    sectionBlocks.push(
      { kind: 'heading', text: `${++sectionNumber}. Irregularity / Violation noticed:` },
      { kind: 'checks', items: violationItems },
      { kind: 'gap', mm: 2 },
    );
  }
  if (productRows.length > 0) {
    sectionBlocks.push(
      { kind: 'heading', text: `${++sectionNumber}. Product details, wherever applicable:` },
      { kind: 'table', header: ['Particulars', 'Details'], rows: productRows },
      { kind: 'gap', mm: 2 },
    );
  }
  if (observation) {
    sectionBlocks.push(
      { kind: 'heading', text: `${++sectionNumber}. Specific observation:` },
      { kind: 'para', indent: 8, segments: [{ text: observation, bold: true }] },
      { kind: 'gap', mm: 1 },
    );
  }

  return [
    { kind: 'center', text: `OFFICE OF THE ${officerTitle}, ${officerLocation.toUpperCase()}`, bold: true, underline: true },
    // District line omitted for the standard designations (MAO/ADA/DAO); kept only for unusual designations
    ...(isADA || isDAO || isMAO ? [] : [{ kind: 'center' as const, text: districtLine, bold: true }]),
    { kind: 'gap', mm: 4 },
    {
      kind: 'memoRow',
      left: [{ text: 'No. ' }, { text: form.memoNumber || 'Draft', bold: true }],
      right: [{ text: 'Date: ' }, { text: noticeDate, bold: true }],
    },
    { kind: 'gap', mm: 4 },
    { kind: 'center', text: noticeTitle, bold: true, underline: true },
    { kind: 'gap', mm: 3 },
    { kind: 'lines', items: [[{ text: 'To', bold: true }]] },
    { kind: 'lines', items: dealerItems, indent: 8 },
    { kind: 'gap', mm: 3 },
    {
      kind: 'labelPara',
      label: 'Sub:',
      segments: [
        { text: `${subjectLabel} – Inspection of dealer premises – Irregularities noticed during inspection on ` },
        { text: inspectionDate, bold: true },
        { text: ` – ${noticeTitleText} – Explanation called for – Reg.` },
      ],
    },
    {
      kind: 'labelPara',
      label: 'Ref:',
      segments: [
        { text: 'Field inspection conducted on ' },
        { text: inspectionDate, bold: true },
        { text: '.' },
      ],
    },
    { kind: 'gap', mm: 2 },
    {
      kind: 'para',
      indent: 10,
      segments: sectionBlocks.length > 0
        ? [
            { text: 'It is informed that during the inspection of the above-mentioned dealer/firm premises on ' },
            { text: inspectionDate, bold: true },
            { text: ', the following irregularities were noticed:' },
          ]
        : [
            { text: 'It is informed that during the inspection of the above-mentioned dealer/firm premises on ' },
            { text: inspectionDate, bold: true },
            { text: ', certain irregularities were noticed.' },
          ],
    },
    ...sectionBlocks,
    { kind: 'gap', mm: 1 },
    {
      kind: 'para',
      indent: 10,
      segments: [
        { text: 'In view of the above, you are hereby directed to submit your ' },
        { text: `written explanation within ${explanationPeriod} from the date of receipt of this notice`, bold: true },
        { text: ', duly explaining the above irregularities and enclosing relevant supporting documents, if any.' },
      ],
    },
    {
      kind: 'para',
      indent: 10,
      segments: [
        { text: 'If no explanation is received within the stipulated period, the matter will be considered ' },
        { text: 'without further reference to you', bold: true },
        { text: ', and further action may be initiated/proposed under the provisions of the ' },
        { text: 'applicable Act(s), Rules and Orders', bold: true },
        { text: ', as applicable.' },
      ],
    },
    { kind: 'gap', mm: 8 },
    { kind: 'lines', items: signatureItems, align: 'right' },
    { kind: 'gap', mm: 4 },
    { kind: 'lines', items: [[{ text: 'Copy submitted to:', bold: true }]] },
    { kind: 'lines', items: copyLines.map((line) => [{ text: line }]) },
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
          return `<p style="margin:0 0 4pt ${block.indent || 0}mm;text-align:justify;">${segmentsHtml(block.segments)}</p>`;
        case 'labelPara':
          return `<div style="display:flex;margin:0 0 4pt;"><strong style="flex:none;">${escapeHtml(block.label)}&nbsp;</strong><span style="flex:1;text-align:justify;">${segmentsHtml(block.segments)}</span></div>`;
        case 'heading':
          return `<p style="margin:6pt 0 2pt;font-weight:700;">${escapeHtml(block.text)}</p>`;
        case 'checks':
          return block.items
            .map((item) => `<div style="margin:1pt 0 1pt 8mm;">&#9744;&nbsp;${segmentsHtml(item)}</div>`)
            .join('');
        case 'lines':
          return `<div style="margin-left:${block.indent || 0}mm;${block.align === 'right' ? 'text-align:right;' : ''}">${block.items
            .map((item) => `<div>${segmentsHtml(item)}</div>`)
            .join('')}</div>`;
        case 'table':
          return `<table style="width:92%;border-collapse:collapse;margin:2pt 0 2pt 8mm;"><thead><tr>${block.header
            .map((cell) => `<th style="border:1pt solid #000;padding:2pt 6pt;text-align:left;font-weight:700;">${escapeHtml(cell)}</th>`)
            .join('')}</tr></thead><tbody>${block.rows
            .map(
              (row) =>
                `<tr><td style="border:1pt solid #000;padding:2pt 6pt;">${escapeHtml(row.label)}</td><td style="border:1pt solid #000;padding:2pt 6pt;font-weight:700;">${escapeHtml(row.value || '______________________________')}</td></tr>`
            )
            .join('')}</tbody></table>`;
        case 'gap':
          return `<div style="height:${block.mm ?? 2}mm;"></div>`;
        default:
          return '';
      }
    })
    .join('');
}

function noticeDocumentHtml(blocks: NoticeBlock[]) {
  return `<html><head><style>@page{size:A4;margin:18mm 20mm;}body{font-family:${NOTICE_FONT_STACK};font-size:12pt;line-height:1.5;color:#000;}</style></head><body>${noticeBlocksHtml(blocks)}</body></html>`;
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
  const previewRef = useRef<HTMLDivElement>(null);

  const config = useMemo(() => getConfig(form.category), [form.category]);
  const categoryViolations = useMemo(
    () => allShowCauseViolations.filter((item) => item.category === form.category),
    [form.category]
  );
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
      selectedViolationIds: [],
      observation: '',
      dealerName: '',
      firmName: '',
      productName: '',
      batchLotNumber: '',
      quantityInvolved: '',
      productRemarks: '',
    });
    setShowProductDetails(false);
  };

  const toggleViolation = (violationId: string) => {
    setForm((current) => {
      const selected = new Set(current.selectedViolationIds);
      if (selected.has(violationId)) selected.delete(violationId);
      else selected.add(violationId);
      return { ...current, selectedViolationIds: Array.from(selected) };
    });
  };

  const toggleAction = (action: RecommendedAction) => {
    setForm((current) => {
      const selected = new Set(current.recommendedActions);
      if (selected.has(action) && selected.size > 1) selected.delete(action);
      else selected.add(action);
      return { ...current, recommendedActions: Array.from(selected) };
    });
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
      recommendedActions: notice.recommendedActions,
      selectedViolationIds: notice.selectedViolationIds,
      status: notice.status,
    };
    setForm(noticeForm);
    setShowProductDetails(Boolean(notice.productName || notice.batchLotNumber || notice.quantityInvolved || notice.productRemarks));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const printNotice = () => {
    const popup = window.open('', '_blank', 'width=900,height=1000');
    if (!popup) return;
    popup.document.write(noticeDocumentHtml(noticeBlocks).replace('<head>', `<head><title>${form.memoNumber || 'notice'}</title>`));
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadPdf = async () => {
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
      return doc.getTextWidth(text);
    };
    const spaceWidth = () => measure(' ', false);
    const runsWidth = (runs: NoticeSegment[]) =>
      runs.reduce((total, run) => total + measure(run.text, !!run.bold), 0) + Math.max(runs.length - 1, 0) * spaceWidth();

    const drawRuns = (runs: NoticeSegment[], x: number, lineY: number) => {
      let cx = x;
      const gap = spaceWidth();
      runs.forEach((run) => {
        doc.setFont(fontName, run.bold ? 'bold' : 'normal');
        doc.setFontSize(12);
        doc.text(run.text, cx, lineY);
        cx += doc.getTextWidth(run.text) + gap;
      });
    };

    const wrapSegments = (segments: NoticeSegment[], width: number): NoticeSegment[][] => {
      const words: NoticeSegment[] = [];
      segments.forEach((segment) => {
        segment.text
          .split(/\s+/)
          .filter(Boolean)
          .forEach((word) => words.push({ text: word, bold: segment.bold }));
      });
      const lines: NoticeSegment[][] = [];
      let current: NoticeSegment[] = [];
      words.forEach((word) => {
        const candidate = [...current, word];
        if (current.length > 0 && runsWidth(candidate) > width) {
          lines.push(current);
          current = [word];
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
          const lines = wrapSegments(block.segments, CW - indent);
          lines.forEach((runs) => {
            ensureSpace(LH);
            drawRuns(runs, ML + indent, y);
            y += LH;
          });
          y += 1;
          break;
        }
        case 'labelPara': {
          const labelWidth = measure(`${block.label} `, true);
          const lines = wrapSegments(block.segments, CW - labelWidth);
          lines.forEach((runs, index) => {
            ensureSpace(LH);
            if (index === 0) {
              doc.setFont(fontName, 'bold');
              doc.setFontSize(12);
              doc.text(block.label, ML, y);
            }
            drawRuns(runs, ML + labelWidth, y);
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
        case 'checks': {
          block.items.forEach((item) => {
            const lines = wrapSegments(item, CW - 14);
            lines.forEach((runs, index) => {
              ensureSpace(LH);
              if (index === 0) doc.rect(ML + 8, y - 3.2, 3.2, 3.2);
              drawRuns(runs, ML + 14, y);
              y += LH;
            });
          });
          break;
        }
        case 'lines': {
          const indent = block.indent || 0;
          block.items.forEach((item) => {
            const lines = wrapSegments(item, CW - indent);
            lines.forEach((runs) => {
              ensureSpace(LH);
              const x = block.align === 'right' ? PAGE_W - MR - runsWidth(runs) : ML + indent;
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
        case 'gap':
          y += block.mm ?? 2;
          break;
        default:
          break;
      }
    });

    doc.save(`${form.memoNumber || 'show-cause-notice'}.pdf`.replace(/[\\/]/g, '-'));
  };

  return (
    <div className="space-y-4">
      <div className={`overflow-hidden rounded-lg bg-gradient-to-r ${config.theme.header} px-4 py-3 text-white shadow-sm`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">{config.title}</h2>
            <p className="text-xs font-semibold text-white/85">Show Cause Notice / Memo Entry</p>
          </div>
          <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-black">FY {form.financialYear}</span>
        </div>
      </div>

          {!lockedCategory && (
          <div className="inline-flex flex-wrap rounded-lg border border-white bg-white p-1 shadow-sm">
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
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700">Officer Details</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="Inspecting Officer Name" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
              <SelectInput label="Officer Designation" value={form.officerDesignation} onChange={(value) => updateForm({ officerDesignation: value })} options={designationOptions} />
              <SelectInput
                label="District Name"
                value={form.district}
                onChange={(value) => updateForm({ district: value, mandal: '', manualMandal: '', manualDistrict: '' })}
                options={districtOptions}
              />
              {form.district === 'Others' && (
                <TextInput label="Enter District Name" value={form.manualDistrict} onChange={(value) => updateForm({ manualDistrict: value })} />
              )}
              {isADAOfficer && (
                <TextInput label="Division" value={form.division} onChange={(value) => updateForm({ division: value })} />
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
              <TextInput label="Memo Number" value={form.memoNumber} onChange={(value) => updateForm({ memoNumber: value })} />
              <TextInput
                label="Inspection Date"
                type="date"
                value={form.inspectionDate}
                onChange={(value) => updateForm({
                  inspectionDate: value,
                  financialYear: value ? financialYearForDate(value) : currentFinancialYear(),
                })}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700">Dealer Details</h3>
            <div className="grid gap-3 md:grid-cols-4">
            <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value, dealerName: value })} />
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-black text-slate-600">Firm Address</span>
              <textarea
                value={form.dealerAddress}
                onChange={(event) => updateForm({ dealerAddress: event.target.value })}
                placeholder="D.No, Road, Village"
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <TextInput label="Licence Number" value={form.licenceNumber} onChange={(value) => updateForm({ licenceNumber: value })} />
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
            </div>
          </div>

          <section>
            <h3 className={`mb-3 rounded-lg px-3 py-2 text-sm font-black ${config.theme.badge}`}>{config.heading}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {categoryViolations.map((violation) => (
                <label key={violation.violationId} className={`flex cursor-pointer gap-3 rounded-lg border p-3 shadow-sm transition ${config.theme.card}`}>
                  <input
                    type="checkbox"
                    checked={form.selectedViolationIds.includes(violation.violationId)}
                    onChange={() => toggleViolation(violation.violationId)}
                    className={`mt-1 h-4 w-4 rounded ${config.theme.checkbox}`}
                  />
                  <span className="min-w-0">
                    <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${config.theme.badge}`}>
                      {violation.exactReference}
                    </span>
                    <span className="block text-sm font-bold text-slate-900">{violation.shortDescription}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{violation.sourceStatus}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-slate-600">
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
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {showProductDetails && (
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">Product Details</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductDetails(false);
                      updateForm({ productName: '', batchLotNumber: '', quantityInvolved: '', productRemarks: '', invoiceDetails: '' });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50"
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

          <div>
            <p className="mb-2 text-xs font-black text-slate-600">Recommended action</p>
            <div className="flex flex-wrap gap-2">
              {recommendedActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggleAction(action)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-black capitalize transition ${
                    form.recommendedActions.includes(action) ? `${config.theme.button} border-transparent text-white` : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white shadow-sm ${config.theme.button}`}>
              <FileText className="h-4 w-4" />
              {config.previewButtonLabel}
            </button>
            <button type="button" onClick={saveNotice} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-900">
              <Save className="h-4 w-4" />
              Save Entry
            </button>
            <button type="button" onClick={printNotice} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>

      <section ref={previewRef} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-black text-slate-900">Notice Preview</h3>
        <div
          className="max-h-[520px] overflow-auto rounded-lg bg-white p-6 text-slate-900 shadow-inner ring-1 ring-slate-100"
          style={{ fontFamily: `'Book Antiqua', 'Palatino Linotype', Palatino, 'Times New Roman', serif`, fontSize: '12pt', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: noticeHtml }}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-black text-slate-900">Saved Notices</h3>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={savedSearch}
              onChange={(event) => setSavedSearch(event.target.value)}
              placeholder="Search saved notices"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Memo</th>
                <th className="px-3 py-2">Dealer</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Inspection</th>
                <th className="px-3 py-2">Clauses/Sections/Rules</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSaved.map((notice) => (
                <tr key={notice.id}>
                  <td className="px-3 py-2 font-black">{notice.memoNumber}</td>
                  <td className="px-3 py-2">{notice.firmName || notice.dealerName || '-'}</td>
                  <td className="px-3 py-2 capitalize">{notice.category}</td>
                  <td className="px-3 py-2">{notice.inspectionDate}</td>
                  <td className="px-3 py-2">{allShowCauseViolations.filter((item) => notice.selectedViolationIds.includes(item.violationId)).map((item) => item.exactReference).join(', ') || '-'}</td>
                  <td className="px-3 py-2">{notice.deadline}</td>
                  <td className="px-3 py-2">{notice.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => editSavedNotice(notice)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-50">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSaved.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center font-semibold text-slate-500">No saved notices yet.</td>
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
      <span className="mb-1 block text-xs font-black text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}
