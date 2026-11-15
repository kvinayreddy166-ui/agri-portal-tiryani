import { safeStorage } from '../../../shared/lib/safeStorage';

export type ReanalysisUploadKind = 'formL' | 'dealerReply' | 'receipt' | 'other';

export interface ReanalysisUpload {
  id: string;
  kind: ReanalysisUploadKind;
  name: string;
  size: number;
  type: string;
  archivedId?: string;
  addedAt: string;
}

/** Snapshot of the linked Form J / K / P sample details. */
export interface ReanalysisSourceSample {
  sampleCode: string;
  fertilizerName: string;
  dealerName: string;
  dealerAddress: string;
  samplingDate: string;
  quantity: string;
  source: 'draft' | 'queue' | 'manual';
}

export interface ReanalysisDeclarationValues {
  name: string;
  designation: string;
  place: string;
  date: string;
  remarks: string;
  /** Dealer: father's name ("S/o ..."). */
  fatherName: string;
  /** Inspector: role line, e.g. "Mandal Agriculture Officer and Fertilizer Inspector". */
  role: string;
  /** Inspector/authority jurisdiction, e.g. "Sirpur T, Mandal of Kumurambheem Asifabad District". */
  jurisdiction: string;
  /** Authority: division and district for the signature block. */
  division: string;
  district: string;
  /** Authority: date the dealer portion was received for reanalysis. */
  receivedDate: string;
}

export interface ReanalysisScnValues {
  noticeNumber: string;
  noticeDate: string;
  replyByDate: string;
  violation: string;
  clauseReference: string;
  stockDescription: string;
  officerName: string;
  designation: string;
  officeAddress: string;
  formLNumber: string;
  formLDate: string;
  memoNumber: string;
  memoDate: string;
  communicatedDate: string;
  replyDays: string;
  division: string;
  district: string;
  manufacturerName: string;
  manufacturerAddress: string;
  distributorName: string;
  distributorAddress: string;
  /** Copy-to lines, one per entry. */
  copies: string[];
}

export interface ReanalysisLetterItem {
  id: string;
  label: string;
  reference: string;
  enclosure: string;
}

export interface ReanalysisCoveringLetter {
  letterNumber: string;
  letterDate: string;
  financialYear: string;
  authorityType: 'DAO' | 'ADA';
  memoNumber: string;
  memoDate: string;
  division: string;
  subject: string;
  salutation: string;
  body: string;
  closing: string;
  items: ReanalysisLetterItem[];
  fromName: string;
  fromDesignation: string;
  fromAddress: string;
  toName: string;
  toDesignation: string;
  toAddress: string;
  /** Reference lines, one per entry (rendered as "Ref:- 1. ... 2. ..."). */
  references: string[];
  /** Body paragraphs, one per entry. */
  paragraphs: string[];
  /** Copy/distribution lines, one per entry. */
  copies: string[];
}

export interface ReanalysisCase {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sample: ReanalysisSourceSample;
  uploads: ReanalysisUpload[];
  declarations: {
    dealer: ReanalysisDeclarationValues;
    inspector: ReanalysisDeclarationValues;
    authority: ReanalysisDeclarationValues;
  };
  scn: ReanalysisScnValues;
  letter: ReanalysisCoveringLetter;
}

const CASES_KEY = 'tiryani-fertilizer-reanalysis-cases';
const MAX_CASES = 50;

function readCases(): ReanalysisCase[] {
  try {
    const parsed = JSON.parse(safeStorage.getItem(CASES_KEY) || '[]');
    return Array.isArray(parsed) ? (parsed as ReanalysisCase[]) : [];
  } catch {
    return [];
  }
}

function writeCases(cases: ReanalysisCase[]) {
  safeStorage.setItem(CASES_KEY, JSON.stringify(cases.slice(0, MAX_CASES)));
}

export function listReanalysisCases(): ReanalysisCase[] {
  return readCases().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getReanalysisCase(id: string): ReanalysisCase | null {
  return readCases().find((c) => c.id === id) ?? null;
}

export function saveReanalysisCase(c: ReanalysisCase): ReanalysisCase {
  const cases = readCases();
  const idx = cases.findIndex((x) => x.id === c.id);
  const next = { ...c, updatedAt: new Date().toISOString() };
  if (idx >= 0) cases[idx] = next;
  else cases.unshift(next);
  writeCases(cases);
  return next;
}

export function deleteReanalysisCase(id: string) {
  writeCases(readCases().filter((c) => c.id !== id));
}

export function createReanalysisCaseId(): string {
  return `rean-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyDeclarationValues(): ReanalysisDeclarationValues {
  return {
    name: '',
    designation: '',
    place: '',
    date: new Date().toISOString().slice(0, 10),
    remarks: '',
    fatherName: '',
    role: '',
    jurisdiction: '',
    division: '',
    district: '',
    receivedDate: '',
  };
}

export function emptyScnValues(): ReanalysisScnValues {
  return {
    noticeNumber: '',
    noticeDate: new Date().toISOString().slice(0, 10),
    replyByDate: '',
    violation: '',
    clauseReference: 'clause 19(a)(c)(vii) of the Fertilizer Control Order, 1985',
    stockDescription: '',
    officerName: '',
    designation: '',
    officeAddress: '',
    formLNumber: '',
    formLDate: '',
    memoNumber: '',
    memoDate: '',
    communicatedDate: '',
    replyDays: '10',
    division: '',
    district: '',
    manufacturerName: '',
    manufacturerAddress: '',
    distributorName: '',
    distributorAddress: '',
    copies: [],
  };
}

export function emptyLetter(): ReanalysisCoveringLetter {
  return {
    letterNumber: '',
    letterDate: new Date().toISOString().slice(0, 10),
    financialYear: '',
    authorityType: 'ADA',
    memoNumber: '',
    memoDate: '',
    division: '',
    subject: '',
    salutation: 'Sir/Madam,',
    body: '',
    closing: 'Yours faithfully,',
    items: [],
    fromName: '',
    fromDesignation: '',
    fromAddress: '',
    toName: '',
    toDesignation: '',
    toAddress: '',
    references: [],
    paragraphs: [],
    copies: [],
  };
}

export function emptyReanalysisCase(sample?: Partial<ReanalysisSourceSample>): ReanalysisCase {
  const now = new Date().toISOString();
  return {
    id: createReanalysisCaseId(),
    title: sample?.sampleCode ? `Reanalysis — ${sample.sampleCode}` : 'New Reanalysis Case',
    createdAt: now,
    updatedAt: now,
    sample: {
      sampleCode: sample?.sampleCode ?? '',
      fertilizerName: sample?.fertilizerName ?? '',
      dealerName: sample?.dealerName ?? '',
      dealerAddress: sample?.dealerAddress ?? '',
      samplingDate: sample?.samplingDate ?? '',
      quantity: sample?.quantity ?? '',
      source: sample?.source ?? 'manual',
    },
    uploads: [],
    declarations: {
      dealer: emptyDeclarationValues(),
      inspector: emptyDeclarationValues(),
      authority: emptyDeclarationValues(),
    },
    scn: emptyScnValues(),
    letter: emptyLetter(),
  };
}
