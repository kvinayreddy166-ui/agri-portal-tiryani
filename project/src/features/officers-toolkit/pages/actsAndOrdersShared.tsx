import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Clock,
  FileText,
  FlaskConical,
  IndianRupee,
  Microscope,
  PackageCheck,
  Scale,
  ShieldAlert,
  ShieldCheck,
  SprayCan,
  Sprout,
  Store,
  Truck,
} from 'lucide-react';
import { safeStorage } from '../../../shared/lib/safeStorage';
import { fcoClauseCards, type FcoClause, type FcoClauseCard, type FcoTabId, type FcoVariationNote } from '../data/fcoClauses';
import { insecticideModuleCards } from '../data/insecticideActData';
import { type LegalCategory } from '../data/actsAndOrdersData';

export type ReckonerView = 'powers' | 'notice';
export type MainLegalArea = 'fertilizer' | 'seed' | 'insecticide';
export type FertilizerSection = 'clauses' | 'forms' | 'schedules' | 'duties';
export type InsecticideSection = 'sections' | 'rules' | 'forms' | 'duties';

export const BOOKMARK_KEY = 'agri-legal-reckoner-bookmarks';

export function clauseRefKey(clause: FcoClause) {
  return `${(clause.clauseLabel ?? 'clause')} ${clause.clauseNo}`.toLowerCase();
}

// Accent theme for the shared clause/forms panels — sky for FCO, amber for
// Insecticides Act & Rules so the section matches its area card.
export type FcoAccent = 'sky' | 'amber';

export const fcoAccentThemes = {
  sky: {
    gradient: 'from-indigo-500 via-indigo-600 to-violet-700',
    gradientDeep: 'from-indigo-600 via-violet-600 to-violet-700',
    shadow: 'shadow-indigo-500/20',
    border: 'border-slate-200 dark:border-slate-700',
    borderSoft: 'border-slate-200 dark:border-slate-800',
    borderMid: 'border-slate-200 dark:border-slate-700',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    activeTile: 'border-indigo-400 dark:border-indigo-600',
    tint: 'from-indigo-50/70 via-white to-violet-50/40 dark:from-indigo-950/20 dark:via-slate-900 dark:to-violet-950/15',
    tintActive: 'from-indigo-100/70 via-indigo-50 to-violet-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-violet-950/20',
    tintTile: 'from-indigo-50/80 via-white to-violet-50/70 dark:from-indigo-950/25 dark:via-slate-900 dark:to-violet-950/20',
    chip: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
    chipCount: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    chipAlt: 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-indigo-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/60',
    tabOff: 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20',
    labelText: 'text-slate-500 dark:text-slate-400',
    boldText: 'text-slate-800 dark:text-slate-100',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    iconTile: 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-1 ring-indigo-200/70 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/50',
    altText: 'text-slate-700 dark:text-slate-200',
    focus: 'focus:border-indigo-500 focus:ring-indigo-100',
    related: 'bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-white',
    provisoBox: 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40',
    provisoTitle: 'text-slate-800 dark:text-slate-100',
    provisoBody: 'text-slate-700 dark:text-slate-200',
    provisoSub: 'text-slate-500 dark:text-slate-400',
    panelBox: 'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40',
    panelTitle: 'text-slate-700 dark:text-slate-200',
    panelChip: 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
    stepperArrow: 'text-slate-300 dark:text-slate-600',
    stepperBadge: 'from-indigo-500 to-violet-600',
    stepperClock: 'text-slate-500 dark:text-slate-400',
    stepperBox: 'border-slate-200 dark:border-slate-700',
    dot: 'from-indigo-400 to-violet-400',
    hoverTint: 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
  },
  amber: {
    gradient: 'from-orange-500 via-amber-500 to-amber-600',
    gradientDeep: 'from-orange-600 via-amber-500 to-amber-700',
    shadow: 'shadow-orange-500/20',
    border: 'border-slate-200 dark:border-slate-700',
    borderSoft: 'border-slate-200 dark:border-slate-800',
    borderMid: 'border-slate-200 dark:border-slate-700',
    hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
    activeTile: 'border-orange-400 dark:border-orange-600',
    tint: 'from-orange-50/70 via-white to-amber-50/40 dark:from-orange-950/20 dark:via-slate-900 dark:to-amber-950/15',
    tintActive: 'from-orange-100/70 via-orange-50 to-amber-50/60 dark:from-orange-950/30 dark:via-slate-900 dark:to-amber-950/20',
    tintTile: 'from-orange-50/80 via-white to-amber-50/70 dark:from-orange-950/25 dark:via-slate-900 dark:to-amber-950/20',
    chip: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
    chipCount: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    chipAlt: 'bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800 ring-orange-200 dark:from-orange-950/40 dark:to-amber-950/30 dark:text-orange-200 dark:ring-orange-800/60',
    tabOff: 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-800 dark:hover:bg-orange-950/20',
    labelText: 'text-slate-500 dark:text-slate-400',
    boldText: 'text-slate-800 dark:text-slate-100',
    iconText: 'text-orange-600 dark:text-orange-400',
    iconTile: 'bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 ring-1 ring-orange-200/70 dark:from-orange-950/40 dark:to-amber-950/30 dark:text-orange-300 dark:ring-orange-800/50',
    altText: 'text-slate-700 dark:text-slate-200',
    focus: 'focus:border-orange-500 focus:ring-orange-100',
    related: 'bg-slate-50 text-slate-700 ring-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-white',
    provisoBox: 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/40',
    provisoTitle: 'text-slate-800 dark:text-slate-100',
    provisoBody: 'text-slate-700 dark:text-slate-200',
    provisoSub: 'text-slate-500 dark:text-slate-400',
    panelBox: 'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40',
    panelTitle: 'text-slate-700 dark:text-slate-200',
    panelChip: 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
    stepperArrow: 'text-slate-300 dark:text-slate-600',
    stepperBadge: 'from-orange-500 to-amber-600',
    stepperClock: 'text-slate-500 dark:text-slate-400',
    stepperBox: 'border-slate-200 dark:border-slate-700',
    dot: 'from-orange-400 to-amber-400',
    hoverTint: 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
  },
} as const;

export const fcoClauseLocationByNo = new Map<string, { clauseId: string; cardId: string }>();
[...fcoClauseCards, ...insecticideModuleCards].forEach((card) => {
  card.clauses.forEach((clause) => {
    fcoClauseLocationByNo.set(clauseRefKey(clause), { clauseId: clause.id, cardId: card.id });
  });
});

export const fcoTabs: Array<{ id: FcoTabId; label: string; icon: typeof Clock }> = [
  { id: 'plainEnglish', label: 'Simple', icon: BookOpen },
  { id: 'fullText', label: 'Full Text', icon: FileText },
  { id: 'officerAction', label: 'Officer Action', icon: ClipboardList },
  { id: 'formsTimelines', label: 'Forms & Timelines', icon: Clock },
];
export const legalAreaCards: Array<{
  id: MainLegalArea;
  title: string;
  description: string;
  icon: typeof Scale;
  category: LegalCategory;
  color: string;
  panel: string;
  border: string;
  accent: string;
  chip: string;
  hover: string;
  statute: string;
  statuteShort: string;
  tags: string[];
  stats: string;
}> = [
  {
    id: 'fertilizer',
    title: 'Fertilizer Control Order',
    description: 'Statutory framework for dealer registration, quality standards, inspection powers, sampling, seizure & penalties under ECA 1955.',
    icon: PackageCheck,
    category: 'Fertiliser',
    statute: 'Fertiliser (Inorganic, Organic or Mixed) (Control) Order, 1985 & ECA, 1955',
    statuteShort: 'FCO 1985 & ECA',
    tags: ['38 Clauses', '28 Forms', 'Schedules I–VIII', 'Seizure & Stop Sale'],
    stats: '38 Clauses • 28 Forms • VIII Schedules',
    color: 'from-indigo-600 via-indigo-700 to-violet-800',
    panel: 'from-indigo-50/90 via-white to-violet-50/80 dark:from-indigo-950/30 dark:via-slate-900 dark:to-violet-950/30',
    border: 'border-indigo-200/90 dark:border-indigo-800/60',
    accent: 'text-indigo-700 dark:text-indigo-300',
    chip: 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-indigo-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/60',
    hover: 'hover:border-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30',
  },
  {
    id: 'seed',
    title: 'Seed Law & Regulations',
    description: 'Statutory controls under Seeds Act, Rules and Seed (Control) Order covering truth-in-labelling, certification, inspector duties and penalties.',
    icon: Sprout,
    category: 'Seeds',
    statute: 'The Seeds Act, 1966, Seeds Rules, 1968 & Seed (Control) Order, 1983',
    statuteShort: 'Seeds Act 1966 & Rules',
    tags: ['Stop Sale & Seizure', 'Sampling Protocols', 'Inspector Duties', 'Penalties'],
    stats: '25 Sections • Inspection Protocols',
    color: 'from-emerald-600 via-teal-700 to-emerald-800',
    panel: 'from-emerald-50/90 via-white to-teal-50/80 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/30',
    border: 'border-emerald-200/90 dark:border-emerald-800/60',
    accent: 'text-emerald-700 dark:text-emerald-300',
    chip: 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 ring-emerald-200 dark:from-emerald-950/40 dark:to-teal-950/30 dark:text-emerald-300 dark:ring-emerald-800/60',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30',
  },
  {
    id: 'insecticide',
    title: 'Insecticides Act & Rules',
    description: 'Comprehensive regulatory system for pesticide manufacture, licensing, distribution, packaging, labelling, enforcement and court procedures.',
    icon: SprayCan,
    category: 'Insecticides',
    statute: 'The Insecticides Act, 1968 & The Insecticides Rules, 1971',
    statuteShort: 'Insecticides Act 1968',
    tags: ['Sections 1–38', 'Rules 1–46', 'Forms I to XVIII', 'Analyst & Enforcement'],
    stats: '38 Sections • 46 Rules • 18 Forms',
    color: 'from-amber-600 via-orange-600 to-red-700',
    panel: 'from-amber-50/90 via-white to-orange-50/80 dark:from-amber-950/30 dark:via-slate-900 dark:to-orange-950/30',
    border: 'border-amber-200/90 dark:border-amber-800/60',
    accent: 'text-amber-700 dark:text-amber-300',
    chip: 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 ring-orange-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-orange-200 dark:ring-orange-800/60',
    hover: 'hover:border-amber-400 hover:bg-orange-50/60 dark:hover:bg-amber-950/30',
  },
];

export const legalTopicCards: Record<MainLegalArea, Array<{
  title: string;
  description: string;
  icon: typeof Scale;
  category?: LegalCategory;
  view?: ReckonerView;
  query?: string;
}>> = {
  fertilizer: [],
  seed: [],
  insecticide: [],
};

export const fcoIconMap = {
  BookOpen,
  IndianRupee,
  Truck,
  Store,
  FlaskConical,
  ShieldAlert,
  ShieldCheck,
  Microscope,
  Scale,
  AlertTriangle,
};


export function fcoVariationSearchText(note: FcoVariationNote) {
  return [
    note.clause_no,
    note.subclause_no,
    note.title,
    note.existing_pdf2_title,
    note.authentic_pdf1_title,
    note.existing_pdf2_summary,
    note.authentic_pdf1_summary,
    note.variation_type,
    note.variation_description,
    note.officer_action_point,
    note.forms_linked.join(' '),
    note.schedule_linked.join(' '),
    note.authority_responsible,
    note.inspection_action,
    note.admin_action,
    note.legal_action,
    note.telugu_summary,
    note.old_pdf2_clause_no ? `Clause ${note.old_pdf2_clause_no}` : '',
    note.canonical_clause_no ? `Clause ${note.canonical_clause_no}` : '',
    note.search_keywords.join(' '),
    note.tags.join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function fcoClauseSearchText(clause: FcoClause) {
  return [
    `${clause.clauseLabel ?? 'Clause'} ${clause.clauseNo}`,
    clause.oldPdf2ClauseNo ? `Old PDF-2 Clause ${clause.oldPdf2ClauseNo}` : '',
    clause.canonicalClauseNo ? `Current PDF-1 Clause ${clause.canonicalClauseNo}` : '',
    clause.title,
    clause.category,
    clause.summary,
    clause.legalText,
    clause.plainEnglish,
    clause.forms.join(' '),
    clause.timelines.join(' '),
    clause.keywords.join(' '),
    clause.related.join(' '),
    clause.subClauses.map((item) => `${item.no} ${item.legalText} ${item.plainEnglish}`).join(' '),
    clause.variationNotes?.map(fcoVariationSearchText).join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function fcoCardSearchText(card: FcoClauseCard) {
  return [
    card.cardTitle,
    card.cardNo,
    card.clauseRange,
    card.summary,
    card.contains.join(' '),
    card.clauses.map(fcoClauseSearchText).join(' '),
  ].join(' ').toLowerCase();
}

export function normalizeFcoReferenceQuery(value: string) {
  return value.trim().toLowerCase().replace(/^(clause|section|rule)\s+/, '').replace(/\s+/g, '');
}

export function isFcoExactReferenceQuery(value: string) {
  return /^((clause|section|rule)\s*)?\d+[a-z]*(?:\(\d+[a-z]*\))*$/i.test(value.trim());
}

export function fcoClauseMatchesQuery(clause: FcoClause, rawTerm: string) {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return true;

  if (isFcoExactReferenceQuery(term)) {
    const reference = normalizeFcoReferenceQuery(term);
    const clauseNo = clause.clauseNo.toLowerCase();
    if (clauseNo === reference) return true;
    if (clause.oldPdf2ClauseNo?.toLowerCase() === reference) return true;
    if (clause.canonicalClauseNo?.toLowerCase() === reference) return true;
    return clause.subClauses.some((item) => {
      const subClause = item.no.toLowerCase().replace(/^clause\s+/, '').replace(/\s+/g, '');
      return subClause === reference || subClause.startsWith(`${reference}(`);
    });
  }

  return fcoClauseSearchText(clause).includes(term);
}

export function filterFcoCardForQuery(card: FcoClauseCard, rawTerm: string): FcoClauseCard | null {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return card;

  const matchingClauses = card.clauses.filter((clause) => fcoClauseMatchesQuery(clause, term));
  if (matchingClauses.length > 0) {
    return {
      ...card,
      clauses: matchingClauses,
      clauseRange: matchingClauses.length === 1 ? `${matchingClauses[0].clauseLabel ?? 'Clause'} ${matchingClauses[0].clauseNo}` : card.clauseRange,
    };
  }

  if (!isFcoExactReferenceQuery(term) && fcoCardSearchText(card).includes(term)) return card;
  return null;
}

export function readBookmarks() {
  try {
    const parsed = JSON.parse(safeStorage.getItem(BOOKMARK_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
}

export function renderHeadingTitle(title: string, isWhite = true) {
  const match = title.match(/^(.*?)\s*(\([^)]*\))\s*$/);
  if (match) {
    return (
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span>{match[1]}</span>
        <span className={`text-sm sm:text-base md:text-lg font-bold whitespace-nowrap ${isWhite ? 'text-white/90' : 'text-slate-600 dark:text-slate-400'}`}>
          {match[2]}
        </span>
      </span>
    );
  }
  return title;
}
