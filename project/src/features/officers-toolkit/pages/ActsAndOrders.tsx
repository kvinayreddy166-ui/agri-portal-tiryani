import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  ClipboardList,
  FlaskConical,
  IndianRupee,
  ListOrdered,
  Microscope,
  Network,
  PackageCheck,
  Scale,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SprayCan,
  Sprout,
  Store,
  Truck,
} from 'lucide-react';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { type LegalCategory } from '../data/actsAndOrdersData';
import { fcoClauseCards, validateFcoClauseCoverage, type FcoClause, type FcoClauseCard, type FcoTabId, type FcoVariationNote } from '../data/fcoClauses';
import { insecticideActCards, insecticideForms, insecticideModuleCards, insecticideRuleCards, type InsecticideFormEntry } from '../data/insecticideActData';
import { fertilizerFormCategories, fertilizerForms, type FertilizerFormCategory, type FertilizerFormEntry } from '../../sampling-hub/data/fertilizerForms';
import { fertilizerSchedules, type FertilizerScheduleEntry } from '../../sampling-hub/data/fertilizerSchedules';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { enforcementDeadlines, enforcementMindMap, type EnforcementDeadline, type MindMapNode } from '../data/fcoEnforcementMindMap';
import { insecticideDeadlines, insecticideMindMap, insecticideOffenceEntries } from '../data/insecticideEnforcement';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { FertilizerFormPdfGenerator } from '../../sampling-hub/components/FertilizerFormPdfGenerator';
import { FcoImplementationModal } from '../../../shared/components/ui/FcoImplementationModal';
import { useAuth } from '../../../shared/context/AuthContext';

import { safeStorage } from '../../../shared/lib/safeStorage';
type ReckonerView = 'powers' | 'notice';
type MainLegalArea = 'fertilizer' | 'seed' | 'insecticide';
type FertilizerSection = 'clauses' | 'forms' | 'schedules' | 'duties';
type InsecticideSection = 'sections' | 'rules' | 'forms' | 'duties';

const BOOKMARK_KEY = 'agri-legal-reckoner-bookmarks';

function clauseRefKey(clause: FcoClause) {
  return `${(clause.clauseLabel ?? 'clause')} ${clause.clauseNo}`.toLowerCase();
}

// Accent theme for the shared clause/forms panels — sky for FCO, amber for
// Insecticides Act & Rules so the section matches its area card.
type FcoAccent = 'sky' | 'amber';

const fcoAccentThemes = {
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

const fcoClauseLocationByNo = new Map<string, { clauseId: string; cardId: string }>();
[...fcoClauseCards, ...insecticideModuleCards].forEach((card) => {
  card.clauses.forEach((clause) => {
    fcoClauseLocationByNo.set(clauseRefKey(clause), { clauseId: clause.id, cardId: card.id });
  });
});

const fcoTabs: Array<{ id: FcoTabId; label: string; icon: typeof Clock }> = [
  { id: 'plainEnglish', label: 'Simple', icon: BookOpen },
  { id: 'fullText', label: 'Full Text', icon: FileText },
  { id: 'officerAction', label: 'Officer Action', icon: ClipboardList },
  { id: 'formsTimelines', label: 'Forms & Timelines', icon: Clock },
];
const legalAreaCards: Array<{
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
}> = [
  { id: 'fertilizer', title: 'Fertilizer', description: 'FCO 1985, ECA, seizure, samples and prosecution references.', icon: PackageCheck, category: 'Fertiliser', color: 'from-indigo-500 via-indigo-600 to-violet-700', panel: 'from-indigo-50 via-white to-violet-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-violet-950/40', border: 'border-indigo-200/80 dark:border-indigo-800/60', accent: 'text-indigo-700 dark:text-indigo-300', chip: 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-indigo-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/60', hover: 'hover:border-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30' },
  { id: 'seed', title: 'Seed', description: 'Seed Act, Rules, labelling, sampling and penalty actions.', icon: Sprout, category: 'Seeds', color: 'from-emerald-500 via-emerald-600 to-teal-700', panel: 'from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/40', border: 'border-emerald-200/80 dark:border-emerald-800/60', accent: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 ring-emerald-200 dark:from-emerald-950/40 dark:to-teal-950/30 dark:text-emerald-300 dark:ring-emerald-800/60', hover: 'hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30' },
  { id: 'insecticide', title: 'Insecticide', description: 'Insecticides Act, Rules, stop-sale, seizure and records.', icon: SprayCan, category: 'Insecticides', color: 'from-orange-500 via-amber-500 to-amber-600', panel: 'from-orange-50 via-white to-amber-50 dark:from-orange-950/40 dark:via-slate-900 dark:to-amber-950/40', border: 'border-orange-200/80 dark:border-orange-800/60', accent: 'text-orange-700 dark:text-orange-300', chip: 'bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800 ring-orange-200 dark:from-orange-950/40 dark:to-amber-950/30 dark:text-orange-200 dark:ring-orange-800/60', hover: 'hover:border-orange-400 hover:bg-orange-50/60 dark:hover:bg-orange-950/30' },
];

const legalTopicCards: Record<MainLegalArea, Array<{
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

const fcoIconMap = {
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


function fcoVariationSearchText(note: FcoVariationNote) {
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

function fcoClauseSearchText(clause: FcoClause) {
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

function fcoCardSearchText(card: FcoClauseCard) {
  return [
    card.cardTitle,
    card.cardNo,
    card.clauseRange,
    card.summary,
    card.contains.join(' '),
    card.clauses.map(fcoClauseSearchText).join(' '),
  ].join(' ').toLowerCase();
}

function normalizeFcoReferenceQuery(value: string) {
  return value.trim().toLowerCase().replace(/^(clause|section|rule)\s+/, '').replace(/\s+/g, '');
}

function isFcoExactReferenceQuery(value: string) {
  return /^((clause|section|rule)\s*)?\d+[a-z]*(?:\(\d+[a-z]*\))*$/i.test(value.trim());
}

function fcoClauseMatchesQuery(clause: FcoClause, rawTerm: string) {
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

function filterFcoCardForQuery(card: FcoClauseCard, rawTerm: string): FcoClauseCard | null {
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

function readBookmarks() {
  try {
    const parsed = JSON.parse(safeStorage.getItem(BOOKMARK_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as string[] : [];
  } catch {
    return [];
  }
}

export function ActsAndOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminUser, isTestUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser;
  const [view, setView] = useState<ReckonerView>('powers');
  const [selectedLegalArea, setSelectedLegalArea] = useState<MainLegalArea | null>(null);
  const [query, setQuery] = useState('');
  const [, setCategory] = useState<LegalCategory>('Fertiliser');
  const [selectedFcoCardId, setSelectedFcoCardId] = useState<string | null>(null);
  const [fcoActiveTab, setFcoActiveTab] = useState<FcoTabId>('plainEnglish');
  const [bookmarks, setBookmarks] = useState<string[]>(() => readBookmarks());
  const [selectedFertilizerForm, setSelectedFertilizerForm] = useState<FertilizerFormEntry | null>(null);
  const [selectedInsecticideForm, setSelectedInsecticideForm] = useState<InsecticideFormEntry | null>(null);
  const [formSearch, setFormSearch] = useState('');
  const [formCategory, setFormCategory] = useState<'All' | FertilizerFormCategory>('All');
  const [fertilizerSection, setFertilizerSection] = useState<FertilizerSection | null>(null);
  const [insecticideSection, setInsecticideSection] = useState<InsecticideSection | null>(null);
  const [insecticideFormSearch, setInsecticideFormSearch] = useState('');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [showFcoStructureModal, setShowFcoStructureModal] = useState(false);
  const [showIaStructureModal, setShowIaStructureModal] = useState(false);
  const fcoStructureShownRef = useRef(false);
  const iaStructureShownRef = useRef(false);

  const areaFromPath = useMemo<MainLegalArea | null>(() => {
    const match = location.pathname.match(/\/acts-and-orders\/(fertilizer|seed|insecticide)\b/) || location.pathname.match(/\/legal-ready-reckoner\/(fertilizer|seed|insecticide)\b/);
    return (match?.[1] as MainLegalArea | undefined) ?? null;
  }, [location.pathname]);

  useEffect(() => {
    setSelectedLegalArea(areaFromPath);
    if (areaFromPath) {
      const card = legalAreaCards.find((item) => item.id === areaFromPath);
      if (card) setCategory(card.category);
    }
  }, [areaFromPath]);

  useEffect(() => {
    safeStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    validateFcoClauseCoverage();
  }, []);

  const filteredFcoCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return fcoClauseCards
      .map((card) => filterFcoCardForQuery(card, term))
      .filter((card): card is FcoClauseCard => Boolean(card));
  }, [query]);

  const activeFcoCard = useMemo(() => {
    const card = fcoClauseCards.find((item) => item.id === selectedFcoCardId);
    if (!card) return null;
    return filterFcoCardForQuery(card, query.trim().toLowerCase()) || card;
  }, [query, selectedFcoCardId]);

  const filteredInsecticideActCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return insecticideActCards
      .map((card) => filterFcoCardForQuery(card, term))
      .filter((card): card is FcoClauseCard => Boolean(card));
  }, [query]);

  const filteredInsecticideRuleCards = useMemo(() => {
    const term = query.trim().toLowerCase();
    return insecticideRuleCards
      .map((card) => filterFcoCardForQuery(card, term))
      .filter((card): card is FcoClauseCard => Boolean(card));
  }, [query]);

  const activeInsecticideCard = useMemo(() => {
    const card = insecticideModuleCards.find((item) => item.id === selectedFcoCardId);
    if (!card) return null;
    return filterFcoCardForQuery(card, query.trim().toLowerCase()) || card;
  }, [query, selectedFcoCardId]);

  const toggleBookmark = (entryId: string) => {
    setBookmarks((current) => current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId]);
  };

  const openLegalArea = (area: MainLegalArea) => {
    const areaCard = legalAreaCards.find((item) => item.id === area);
    if (area === 'fertilizer' && !fcoStructureShownRef.current) {
      fcoStructureShownRef.current = true;
      setShowFcoStructureModal(true);
    }
    if (area === 'insecticide' && !iaStructureShownRef.current) {
      iaStructureShownRef.current = true;
      setShowIaStructureModal(true);
    }
    setSelectedLegalArea(area);
    setView('powers');
    setQuery('');
    setSelectedFcoCardId(null);
    setInsecticideSection(null);
    if (areaCard) setCategory(areaCard.category);
    navigate(`/officer-toolkit/acts-and-orders/${area}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTopic = (topic: (typeof legalTopicCards)[MainLegalArea][number]) => {
    setView(topic.view || 'powers');
    setQuery(topic.query || '');
    setSelectedFcoCardId(null);
    if (topic.category) setCategory(topic.category);
  };

  const closeLegalArea = () => {
    setSelectedLegalArea(null);
    setQuery('');
    setSelectedFcoCardId(null);
    setInsecticideSection(null);
    setView('powers');
    if (areaFromPath) navigate('/officer-toolkit/acts-and-orders');
  };

  const handleBack = () => {
    if (selectedLegalArea === 'insecticide' && insecticideSection) {
      setInsecticideSection(null);
      setSelectedFcoCardId(null);
      setQuery('');
      return;
    }
    if (selectedLegalArea === 'fertilizer' && fertilizerSection) {
      setFertilizerSection(null);
      setSelectedFcoCardId(null);
      setSelectedFertilizerForm(null);
      setQuery('');
      return;
    }
    if (selectedLegalArea) {
      closeLegalArea();
      return;
    }
    navigate('/officer-toolkit');
  };

  const activeAreaCard = selectedLegalArea ? legalAreaCards.find((item) => item.id === selectedLegalArea) : null;
  const ActiveAreaIcon = activeAreaCard?.icon || Scale;

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 lg:px-8">
      {!selectedFcoCardId && showCompactHeader && (
        <CompactToolkitHeader
          className="mb-1"
          title={activeAreaCard?.title || 'Acts & Orders'}
          subtitle={activeAreaCard?.description || 'Agriculture laws, rules, and official procedures for Fertilizer, Seed, and Insecticide.'}
        />
      )}
      {!selectedFcoCardId && !showCompactHeader && (
      <section className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-white shadow-md ${
          activeAreaCard
            ? `border-white/20 bg-gradient-to-br ${activeAreaCard.color}`
            : 'border-emerald-700/40 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 dark:border-emerald-800/50'
        }`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-white/70 via-white/50 to-white/70" />
          <div className="flex items-center gap-3">
            <BackButton onClick={handleBack} tone="solid" className="self-center" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 shadow-sm ring-1 ring-white/30">
                <ActiveAreaIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{activeAreaCard ? 'Acts & Orders' : 'Officer Toolkit'}</p>
                <h1 className="text-lg font-black leading-tight sm:text-xl">{activeAreaCard?.title || 'Acts & Orders'}</h1>
                <p className="text-xs font-semibold text-white/90">
                  {activeAreaCard?.description || 'Search Acts, Rules, Orders, clauses, penal provisions, stop sale, seizure, sampling and notice workflows.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
      {!selectedLegalArea && (
        <LegalAreaOpeningScreen onOpen={openLegalArea} />
      )}

      {selectedLegalArea === 'fertilizer' && !fertilizerSection && (
        <FertilizerModuleHome onOpenSection={setFertilizerSection} />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'clauses' && (
        <FertilizerClausesPanel
          search={query}
          cards={filteredFcoCards}
          activeCard={activeFcoCard}
          activeCardId={selectedFcoCardId}
          activeTab={fcoActiveTab}
          bookmarks={bookmarks}
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
          onBackToCards={() => setSelectedFcoCardId(null)}
          onSelectCard={(cardId) => {
            setSelectedFcoCardId(cardId);
            setFcoActiveTab('plainEnglish');
          }}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'forms' && (
        <FertilizerFormsPanel
          search={formSearch}
          category={formCategory}
          onSearchChange={setFormSearch}
          onCategoryChange={setFormCategory}
          onViewForm={setSelectedFertilizerForm}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'schedules' && (
        <FertilizerSchedulesPanel
          search={scheduleSearch}
          onSearchChange={setScheduleSearch}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'duties' && (
        <EnforcementDutiesPanel config={fertilizerEnforcementConfig} />
      )}

      {selectedLegalArea === 'insecticide' && !insecticideSection && (
        <InsecticideModuleHome onOpenSection={setInsecticideSection} />
      )}

      {selectedLegalArea === 'insecticide' && insecticideSection === 'sections' && (
        <FertilizerClausesPanel
          search={query}
          cards={filteredInsecticideActCards}
          activeCard={activeInsecticideCard}
          activeCardId={selectedFcoCardId}
          activeTab={fcoActiveTab}
          bookmarks={bookmarks}
          badgeLabel="Act Sections"
          accent="amber"
          searchPlaceholder="Search Section 21, 21(1)(d), misbranded, Section 29, Schedule..."
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
          onBackToCards={() => setSelectedFcoCardId(null)}
          onSelectCard={(cardId) => {
            setSelectedFcoCardId(cardId);
            setFcoActiveTab('plainEnglish');
          }}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {selectedLegalArea === 'insecticide' && insecticideSection === 'rules' && (
        <FertilizerClausesPanel
          search={query}
          cards={filteredInsecticideRuleCards}
          activeCard={activeInsecticideCard}
          activeCardId={selectedFcoCardId}
          activeTab={fcoActiveTab}
          bookmarks={bookmarks}
          badgeLabel="Rules"
          accent="amber"
          searchPlaceholder="Search Rule 27, 10A, Form V(A), labelling, Appendix B, expired..."
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
          onBackToCards={() => setSelectedFcoCardId(null)}
          onSelectCard={(cardId) => {
            setSelectedFcoCardId(cardId);
            setFcoActiveTab('plainEnglish');
          }}
          onToggleBookmark={toggleBookmark}
        />
      )}

      {selectedLegalArea === 'insecticide' && insecticideSection === 'forms' && (
        <InsecticideFormsPanel
          search={insecticideFormSearch}
          onSearchChange={setInsecticideFormSearch}
          onViewForm={setSelectedInsecticideForm}
        />
      )}

      {selectedLegalArea === 'insecticide' && insecticideSection === 'duties' && (
        <EnforcementDutiesPanel config={insecticideEnforcementConfig} />
      )}

      {selectedLegalArea === 'seed' && legalTopicCards.seed.length > 0 && (
        <LegalTopicScreen
          area={selectedLegalArea}
          onOpenTopic={openTopic}
        />
      )}

      {selectedLegalArea === 'seed' && (
        <>
      <div className="grid gap-3 sm:grid-cols-2">
        <ViewButton active={view === 'powers'} icon={ShieldAlert} label="Stop Sale & Seizure" onClick={() => setView('powers')} area={selectedLegalArea || undefined} />
      </div>

      {view === 'powers' && selectedLegalArea && <PowersSection area={selectedLegalArea} />}
        </>
      )}
      {selectedFertilizerForm && (
        <FertilizerFormPdfGenerator form={selectedFertilizerForm} onClose={() => setSelectedFertilizerForm(null)} />
      )}
      {selectedInsecticideForm && (
        <FertilizerFormPdfGenerator form={selectedInsecticideForm} onClose={() => setSelectedInsecticideForm(null)} />
      )}
      <FcoImplementationModal isOpen={showFcoStructureModal} onClose={() => setShowFcoStructureModal(false)} />
      <FcoImplementationModal
        isOpen={showIaStructureModal}
        onClose={() => setShowIaStructureModal(false)}
        imageSrc="/images/insecticide-implementation-structure.jpg"
        imageAlt="Implementation of Insecticides Act, 1968 - Registration, Licensing, Quality Monitoring and Field Enforcement Structure"
      />
    </div>
  );
}


function FertilizerModuleHome({ onOpenSection }: { onOpenSection: (section: FertilizerSection) => void }) {
  const cards: Array<{ id: FertilizerSection; title: string; subtitle: string; description: string; icon: React.ElementType }> = [
    { id: 'clauses', title: 'Clauses', subtitle: '39 Clauses', description: 'FCO clause cards, sub-clauses, officer action and timelines.', icon: BookOpen },
    { id: 'forms', title: 'Forms', subtitle: '28 Forms', description: 'Registration, manufacturing, sampling and business record forms.', icon: FileText },
    { id: 'schedules', title: 'Schedules', subtitle: '8 Schedules', description: 'Specifications, sampling procedures, tolerance limits and analysis methods.', icon: ClipboardList },
    { id: 'duties', title: 'Enforcement Mind Map', subtitle: 'Duties & powers', description: 'Duties of enforcement officers — authorities, sampling, seizure and prosecution.', icon: Network },
  ];

  return (
    <section className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenSection(card.id)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-indigo-800/50 dark:from-indigo-950/25 dark:via-slate-950 dark:to-violet-950/20"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-1 ring-indigo-200/70 transition group-hover:scale-105 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/50">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 px-2 py-0.5 text-[10px] font-black text-indigo-800 ring-1 ring-indigo-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-200 dark:ring-indigo-800/60">{card.subtitle}</span>
              </div>
              <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{card.title}</h3>
              <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-700 transition group-hover:gap-1.5 dark:text-slate-300">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}



function InsecticideModuleHome({ onOpenSection }: { onOpenSection: (section: InsecticideSection) => void }) {
  const cards: Array<{ id: InsecticideSection; title: string; subtitle: string; extraBadges?: string[]; description: string; icon: React.ElementType }> = [
    { id: 'sections', title: 'Act Sections', subtitle: '38 Sections', description: 'Insecticides Act, 1968 — section cards, sub-sections, officer action and timelines.', icon: BookOpen },
    { id: 'rules', title: 'Rules', subtitle: '46 Rules + 3 Schedules', extraBadges: ['9 Chapters'], description: 'Insecticides Rules, 1971 — Chapters I-IX: licensing, labelling, inspector duties, Form V(A) stop-sale, seizure, sampling, storage, safety.', icon: ClipboardList },
    { id: 'forms', title: 'Forms', subtitle: `${insecticideForms.length} Forms`, description: 'First Schedule — Form III licence, Appendix A-E registers, Form IV analyst report, Forms V(A)-V(E) stop-sale / seizure / sampling.', icon: FileText },
    { id: 'duties', title: 'Enforcement Powers', subtitle: 'Duties & powers', description: 'Stop sale, seizure and sampling powers and procedures for insecticide officers.', icon: ShieldAlert },
  ];

  return (
    <section className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenSection(card.id)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-orange-200/70 bg-gradient-to-br from-orange-50/90 via-white to-amber-50/60 p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md dark:border-orange-800/50 dark:from-orange-950/25 dark:via-slate-950 dark:to-amber-950/20"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 ring-1 ring-orange-200/70 transition group-hover:scale-105 dark:from-orange-950/40 dark:to-amber-950/30 dark:text-orange-300 dark:ring-orange-800/50">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex max-w-[60%] flex-col items-end gap-1">
                  {card.extraBadges?.map((badge) => (
                    <span key={badge} className="rounded-full bg-gradient-to-br from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-black text-amber-800 ring-1 ring-amber-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-200 dark:ring-amber-800/60">{badge}</span>
                  ))}
                  <span className="rounded-full bg-gradient-to-br from-orange-50 to-amber-50 px-2 py-0.5 text-[10px] font-black text-orange-800 ring-1 ring-orange-200 dark:from-orange-950/40 dark:to-amber-950/30 dark:text-orange-200 dark:ring-orange-800/60">{card.subtitle}</span>
                </span>
              </div>
              <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{card.title}</h3>
              <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.description}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-700 transition group-hover:gap-1.5 dark:text-slate-300">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

const insecticideFormUserLabels: Record<InsecticideFormEntry['usedBy'], string> = {
  dealer: 'Dealer',
  officer: 'Officer',
  analyst: 'Analyst',
  manufacturer: 'Manufacturer / Importer',
  operator: 'Pest Control Operator',
};

function insecticideFormSearchText(form: InsecticideFormEntry) {
  return [form.formNo, form.title, form.rule, form.purpose, insecticideFormUserLabels[form.usedBy]].join(' ').toLowerCase();
}

function InsecticideFormsPanel({ search, onSearchChange, onViewForm, accent = 'amber' }: { search: string; onSearchChange: (value: string) => void; onViewForm: (form: InsecticideFormEntry) => void; accent?: FcoAccent }) {
  const t = fcoAccentThemes[accent];
  const term = search.trim().toLowerCase();
  const visibleForms = insecticideForms.filter((form) => !term || insecticideFormSearchText(form).includes(term));

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={FileText} label="Forms" meta="First Schedule" accent={accent} />
      <div className={`rounded-lg border ${t.border} bg-white p-3 shadow-sm dark:bg-slate-900`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search Form III, Form V(A), Appendix B, licence, seizure, register..."
            className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none ${t.focus} focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
          />
        </div>
        <div className="mt-2.5 flex justify-end">
          <span className={`rounded-full ${t.chipAlt} px-3 py-1 text-[11px] font-black ring-1`}>
            {visibleForms.length} forms
          </span>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {visibleForms.map((form, index) => (
          <div key={`${form.formNo}-${index}`} className={`flex flex-col rounded-lg border ${t.border} bg-gradient-to-br ${t.tintTile} p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 ${t.hoverBorder} hover:shadow-md`}>
            <div className="flex flex-1 items-start gap-2.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.iconTile}`}>
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className={`text-[10px] font-black uppercase tracking-wide ${t.labelText}`}>{form.formNo}</p>
                  <span className={`rounded-full ${t.chipAlt} px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ring-1`}>{insecticideFormUserLabels[form.usedBy]}</span>
                </div>
                <h3 className="mt-0.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{form.title}</h3>
                <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{form.purpose}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-gradient-to-br from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 ring-1 ring-amber-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-200 dark:ring-amber-800/60">{form.rule}</span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-900/50">
              <button type="button" onClick={() => onViewForm(form)} aria-label="View" title="View" className="inline-flex min-h-7 items-center gap-1 rounded-md bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:shadow-md hover:brightness-105">
                <Eye className="h-3.5 w-3.5" />
              </button>
              <a href={form.pdfPath} download className="inline-flex min-h-7 items-center gap-1 rounded-md border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-800 transition hover:to-slate-100 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-900 dark:text-slate-200 dark:hover:to-orange-950/30">
                <FileText className="h-3 w-3" /> PDF
              </a>
            </div>
          </div>
        ))}
        {visibleForms.length === 0 && (
          <p className={`rounded-lg border border-dashed ${t.border} p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2`}>No forms found</p>
        )}
      </div>
    </section>
  );
}

function FertilizerSectionBadge({ icon: Icon, label, meta, tone = 'gradient', accent = 'sky' }: { icon: React.ElementType; label: string; meta?: string; tone?: 'gradient' | 'onGradient'; accent?: FcoAccent }) {
  const t = fcoAccentThemes[accent];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-md ${
      tone === 'gradient'
        ? `${t.iconTile}`
        : 'bg-white/20 text-white ring-1 ring-white/30 shadow-none'
    }`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
      {meta && <span className="rounded-full bg-white/25 px-1.5 py-px text-[9px] normal-case tracking-normal">{meta}</span>}
    </span>
  );
}

function FertilizerClausesPanel({
  search,
  cards,
  activeCard,
  activeCardId,
  activeTab,
  bookmarks,
  badgeLabel = 'Clauses',
  searchPlaceholder = 'Search Clause 28, 28(2), stop sale, Form J, Schedule II...',
  accent = 'sky',
  onSearchChange,
  onTabChange,
  onBackToCards,
  onSelectCard,
  onToggleBookmark,
}: {
  search: string;
  cards: FcoClauseCard[];
  activeCard: FcoClauseCard | null;
  activeCardId: string | null;
  activeTab: FcoTabId;
  bookmarks: string[];
  badgeLabel?: string;
  searchPlaceholder?: string;
  accent?: FcoAccent;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: FcoTabId) => void;
  onBackToCards: () => void;
  onSelectCard: (cardId: string) => void;
  onToggleBookmark: (id: string) => void;
}) {
  const t = fcoAccentThemes[accent];
  if (activeCard) {
    return (
      <FcoCardDetailPage
        card={activeCard}
        activeTab={activeTab}
        badgeLabel={badgeLabel}
        accent={accent}
        bookmarks={bookmarks}
        onBack={onBackToCards}
        onToggleBookmark={onToggleBookmark}
        onTabChange={onTabChange}
        onOpenRelated={(target) => {
          onSelectCard(target.cardId);
          window.setTimeout(() => {
            document.getElementById(`fco-clause-${target.clauseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }}
      />
    );
  }

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={BookOpen} label={badgeLabel} accent={accent} />
      <div className={`rounded-lg border ${t.border} bg-white p-3 shadow-sm dark:bg-slate-900`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none ${t.focus} focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
          />
        </div>
      </div>
      {cards.length > 0 ? (
        <FcoDashboardCards
          cards={cards}
          activeCardId={activeCardId}
          showFormsCard={false}
          accent={accent}
          onOpenForms={() => undefined}
          onSelect={onSelectCard}
        />
      ) : (
        <p className={`rounded-lg border border-dashed ${t.border} p-8 text-center text-sm font-semibold text-slate-500`}>No clauses found</p>
      )}
    </section>
  );
}

function scheduleSearchText(schedule: FertilizerScheduleEntry) {
  return [schedule.scheduleNo, schedule.title, schedule.subtitle, schedule.parts.map((part) => part.label).join(' '), schedule.keywords.join(' ')].join(' ').toLowerCase();
}

function FertilizerSchedulesPanel({ search, onSearchChange }: { search: string; onSearchChange: (value: string) => void }) {
  const term = search.trim().toLowerCase();
  const visibleSchedules = fertilizerSchedules.filter((schedule) => !term || scheduleSearchText(schedule).includes(term));

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={ClipboardList} label="Schedules" />
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search schedule, part, sampling, tolerance, biofertiliser..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="mt-2.5 flex justify-end">
          <span className="rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-1 text-[11px] font-black text-indigo-800 ring-1 ring-indigo-200/80 dark:from-indigo-950/30 dark:to-violet-950/20 dark:text-indigo-200 dark:ring-indigo-900">
            {visibleSchedules.length} schedules
          </span>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {visibleSchedules.map((schedule) => (
          <details key={schedule.id} className="group overflow-hidden rounded-lg border border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-indigo-800/50 dark:from-indigo-950/25 dark:via-slate-950 dark:to-violet-950/20">
            <summary className="flex cursor-pointer list-none items-start gap-2.5 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-1 ring-indigo-200/70 transition group-hover:scale-105 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/50">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">{schedule.scheduleNo}</p>
                <h3 className="mt-0.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{schedule.title}</h3>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{schedule.subtitle}</p>
              </div>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition-transform group-open:rotate-180 dark:text-slate-300" />
            </summary>
            <ul className="space-y-1.5 border-t border-slate-100 px-3 pb-3 pt-2.5 dark:border-slate-900/40">
              {schedule.parts.map((part) => (
                <li key={part.id} className="flex items-start gap-2 rounded-md border border-slate-100 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold leading-4 text-slate-700 dark:border-slate-900/40 dark:bg-slate-900/60 dark:text-slate-200">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {part.label}
                </li>
              ))}
            </ul>
          </details>
        ))}
        {visibleSchedules.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2 dark:border-slate-800/50">No schedules found</p>
        )}
      </div>
    </section>
  );
}

function filterFcoOffences(entries: FcoOffenceEntry[], search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return entries;
  return entries.filter((entry) =>
    [entry.serialNumber, entry.offenceType, entry.contraventionProvision, entry.punishmentProvision, entry.useInField]
      .join(' ')
      .toLowerCase()
      .includes(term)
  );
}

function saveBlobAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function exportOffencesExcel(entries: FcoOffenceEntry[], meta: { filename: string; title: string; punishmentHeader: string }) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AGRONIX';
  const sheet = workbook.addWorksheet('Offences');
  sheet.columns = [
    { header: 'Sl.No', key: 'sl', width: 8 },
    { header: 'Type of offence', key: 'type', width: 55 },
    { header: 'Contravention provision', key: 'contra', width: 42 },
    { header: meta.punishmentHeader, key: 'punish', width: 48 },
  ];
  sheet.mergeCells('A1:D1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = meta.title;
  titleCell.font = { name: 'Times New Roman', size: 13, bold: true };
  titleCell.alignment = { horizontal: 'center' };
  const headerRow = sheet.addRow(['Sl.No', 'Type of offence', 'Contravention provision', meta.punishmentHeader]);
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  });
  entries.forEach((entry) => {
    const row = sheet.addRow([entry.serialNumber, entry.offenceType, entry.contraventionProvision, entry.punishmentProvision]);
    row.eachCell((cell) => {
      cell.font = { name: 'Times New Roman', size: 11 };
      cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  saveBlobAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), meta.filename);
}

async function exportOffencesPdf(entries: FcoOffenceEntry[], meta: { filename: string; title: string; punishmentHeader: string }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text(meta.title, doc.internal.pageSize.getWidth() / 2, 14, { align: 'center' });
  autoTable(doc, {
    startY: 20,
    head: [['Sl.No', 'Type of offence', 'Contravention provision', meta.punishmentHeader]],
    body: entries.map((entry) => [String(entry.serialNumber), entry.offenceType, entry.contraventionProvision, entry.punishmentProvision]),
    styles: { font: 'times', fontSize: 9, cellPadding: 1.6 },
    headStyles: { fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 95 }, 2: { cellWidth: 75 } },
  });
  doc.save(meta.filename);
}

function LegalAreaOpeningScreen({ onOpen }: { onOpen: (area: MainLegalArea) => void }) {
  return (
    <section>
      <h2 className="text-base font-black text-slate-900 dark:text-white">Select category</h2>
      <div className="mt-2.5 space-y-2">
        {legalAreaCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpen(card.id)}
              className={`group flex w-full items-center gap-3 rounded-xl border ${card.border} bg-gradient-to-r ${card.panel} px-3.5 py-2.5 text-left shadow-sm transition duration-300 hover:shadow-md ${card.hover} focus-visible:outline-violet-700 active:scale-[0.99]`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${card.color} text-white shadow-md`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-snug text-slate-900 dark:text-white">{card.title}</span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.description}</span>
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${card.accent}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LegalTopicScreen({
  area,
  onOpenTopic,
}: {
  area: MainLegalArea;
  onOpenTopic: (topic: (typeof legalTopicCards)[MainLegalArea][number]) => void;
}) {
  const areaCard = legalAreaCards.find((item) => item.id === area) || legalAreaCards[0];
  const AreaIcon = areaCard.icon;
  const topics = legalTopicCards[area];

  return (
    <section className={`rounded-lg border ${areaCard.border} bg-white p-4 shadow-sm dark:bg-slate-900`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${areaCard.color} text-white shadow-sm`}>
            <AreaIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">{areaCard.title} legal topics</h2>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Tap a topic card, then use search and filters below.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.title}
              type="button"
              onClick={() => onOpenTopic(topic)}
              className={`group flex w-full items-center gap-3.5 rounded-xl border ${areaCard.border} bg-gradient-to-r ${areaCard.panel} px-4 py-3 text-left shadow-sm transition duration-300 ${areaCard.hover} hover:shadow-md active:scale-[0.99]`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${areaCard.color} text-white shadow-sm transition group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-950 dark:text-white">{topic.title}</span>
                <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{topic.description}</span>
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${areaCard.accent}`} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ViewButton({ active, icon: Icon, label, onClick, area }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void; area?: MainLegalArea }) {
  const theme = legalAreaCards.find((item) => item.id === area) || legalAreaCards[0];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`agri-input-topic-card group flex min-h-[4.25rem] items-center gap-2.5 rounded-xl border p-2.5 text-left text-sm font-black shadow-sm transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.98] ${
        active
          ? `border-transparent bg-gradient-to-br ${theme.color} text-white shadow-lg`
          : `${theme.border} bg-gradient-to-br ${theme.panel} text-slate-800 ${theme.hover} hover:shadow-md dark:text-slate-200`
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 transition group-hover:scale-105 ${
        active
          ? 'bg-white/20 text-white ring-white/30'
          : theme.chip
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 leading-5">{label}</span>
    </button>
  );
}



function FcoCardDetailPage({
  card,
  activeTab,
  bookmarks,
  badgeLabel = 'Clauses',
  accent = 'sky',
  onBack,
  onToggleBookmark,
  onOpenRelated,
  onTabChange,
}: {
  card: FcoClauseCard;
  activeTab: FcoTabId;
  bookmarks: string[];
  badgeLabel?: string;
  accent?: FcoAccent;
  onBack: () => void;
  onToggleBookmark: (id: string) => void;
  onOpenRelated: (target: { clauseId: string; cardId: string }) => void;
  onTabChange: (tab: FcoTabId) => void;
}) {
  const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;
  const t = fcoAccentThemes[accent];

  return (
    <section className={`overflow-hidden rounded-2xl border ${t.borderSoft} bg-white shadow-md dark:bg-slate-950`}>
      <div className={`bg-gradient-to-br ${card.gradient} p-3 text-white`}>
        <div className="mb-2">
          <FertilizerSectionBadge icon={BookOpen} label={badgeLabel} tone="onGradient" accent={accent} />
        </div>
        <div className="flex items-start gap-2.5">
          <BackButton onClick={onBack} tone="solid" label="Back to cards" className="mt-0.5" />
          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-white/20 p-2 ring-1 ring-white/25">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-white/80">Card {card.cardNo} - {card.clauseRange}</p>
              <h2 className="mt-0.5 text-lg font-black leading-tight">{card.cardTitle}</h2>
              <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-white/90">{card.summary}</p>
            </div>
          </div>
        </div>
      </div>


      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-950">
        {fcoTabs.map((tab) => {
          const TabIcon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black transition ${
                selected
                  ? `bg-gradient-to-br ${t.gradient} text-white shadow-md ${t.shadow}`
                  : `border ${t.tabOff}`
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-2 p-2">
        {card.clauses.map((clause) => (
          <FcoClauseAccordion
            key={clause.id}
            clause={clause}
            activeTab={activeTab}
            accent={accent}
            bookmarked={bookmarks.includes(clause.id)}
            onToggleBookmark={() => onToggleBookmark(clause.id)}
            onOpenRelated={onOpenRelated}
          />
        ))}
      </div>
    </section>
  );
}

const fcoGlanceChipTones: Record<FcoAccent, Record<'slate' | 'amber' | 'blue' | 'emerald', string>> = {
  sky: {
    slate: 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 ring-slate-200 dark:from-slate-800 dark:to-slate-800/70 dark:text-slate-300 dark:ring-slate-700',
    amber: 'bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800 ring-orange-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-slate-300 dark:ring-slate-900',
    blue: 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-indigo-200 dark:from-violet-950/40 dark:to-indigo-950/30 dark:text-slate-300 dark:ring-slate-900',
    emerald: 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 ring-emerald-200 dark:from-violet-950/40 dark:to-indigo-950/30 dark:text-slate-300 dark:ring-slate-900',
  },
  amber: {
    slate: 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 ring-slate-200 dark:from-slate-800 dark:to-slate-800/70 dark:text-slate-300 dark:ring-slate-700',
    amber: 'bg-gradient-to-br from-orange-50 to-amber-50 text-orange-800 ring-orange-200 dark:from-orange-950/40 dark:to-amber-950/30 dark:text-slate-300 dark:ring-slate-900',
    blue: 'bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800 ring-amber-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-slate-300 dark:ring-slate-900',
    emerald: 'bg-gradient-to-br from-yellow-50 to-orange-50 text-yellow-800 ring-yellow-200 dark:from-orange-950/40 dark:to-yellow-950/30 dark:text-slate-300 dark:ring-slate-900',
  },
};

function FcoGlanceChip({ icon: Icon, label, tone = 'slate', accent = 'sky' }: { icon: typeof Clock; label: string; tone?: 'slate' | 'amber' | 'blue' | 'emerald'; accent?: FcoAccent }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${fcoGlanceChipTones[accent][tone]}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function fcoRealSubClauses(clause: FcoClause) {
  const clauseNo = clause.clauseNo.replace(/\s+/g, '').toLowerCase();
  return clause.subClauses.filter((item) => item.no.replace(/\s+/g, '').toLowerCase() !== clauseNo);
}

function FcoClauseAccordion({ clause, activeTab, bookmarked, accent = 'sky', onToggleBookmark, onOpenRelated }: { clause: FcoClause; activeTab: FcoTabId; bookmarked: boolean; accent?: FcoAccent; onToggleBookmark: () => void; onOpenRelated: (target: { clauseId: string; cardId: string }) => void }) {
  const t = fcoAccentThemes[accent];
  const subClauses = fcoRealSubClauses(clause);
  const copyClause = () => navigator.clipboard?.writeText(fcoClauseToText(clause));
  const shareClause = async () => {
    const text = fcoClauseToText(clause);
    if (navigator.share) await navigator.share({ title: `${clause.clauseLabel ?? 'FCO Clause'} ${clause.clauseNo}`, text });
    else await navigator.clipboard?.writeText(text);
  };

  return (
    <details id={`fco-clause-${clause.id}`} className={`group overflow-hidden rounded-lg border ${t.border} bg-white shadow-sm transition duration-300 ${t.hoverBorder} hover:shadow-md dark:bg-slate-900`} open>
      <summary className={`flex cursor-pointer list-none flex-col gap-2 border-b ${t.borderSoft} bg-gradient-to-br ${t.tint} p-2.5 sm:flex-row sm:items-start sm:justify-between`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wide ${t.labelText}`}>{clause.clauseLabel ?? 'Clause'} {clause.clauseNo} - {clause.category}</p>
          <h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{clause.title}</h3>
          <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">{clause.summary}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={(event) => { event.preventDefault(); onToggleBookmark(); }} className={`rounded-md border ${t.border} bg-white/80 p-1.5 ${t.altText} transition hover:opacity-80 dark:bg-slate-900`} aria-label="Bookmark clause">
            {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); copyClause(); }} className={`rounded-md border ${t.border} bg-white/80 p-1.5 ${t.boldText} transition hover:opacity-80 dark:bg-slate-900`} aria-label="Copy clause">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); void shareClause(); }} className={`rounded-md border ${t.border} bg-white/80 p-1.5 ${t.boldText} transition hover:opacity-80 dark:bg-slate-900`} aria-label="Share clause">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </summary>
      <div className="space-y-2.5 p-2.5">
        {(subClauses.length > 0 || clause.provisos.length > 0 || clause.forms.length > 0 || clause.timelines.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {subClauses.length > 0 && <FcoGlanceChip icon={ListOrdered} label={`${subClauses.length} sub-clause${subClauses.length === 1 ? '' : 's'}`} accent={accent} />}
            {clause.provisos.length > 0 && <FcoGlanceChip icon={AlertTriangle} label={`${clause.provisos.length} proviso${clause.provisos.length === 1 ? '' : 's'}`} tone="amber" accent={accent} />}
            {clause.forms.length > 0 && <FcoGlanceChip icon={FileText} label={`${clause.forms.length} form${clause.forms.length === 1 ? '' : 's'}`} tone="blue" accent={accent} />}
            {clause.timelines.length > 0 && <FcoGlanceChip icon={Clock} label={`${clause.timelines.length} timeline${clause.timelines.length === 1 ? '' : 's'}`} tone="emerald" accent={accent} />}
          </div>
        )}
        <FcoClauseTabContent clause={clause} activeTab={activeTab} accent={accent} />
        {clause.provisos.length > 0 && (
          <div className="space-y-1.5">
            {clause.provisos.map((proviso) => (
              <div key={proviso.title} className={`flex gap-2 rounded-lg border ${t.provisoBox} p-2.5`}>
                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${t.iconText}`} />
                <div className="min-w-0">
                  <p className={`text-[11px] font-black uppercase tracking-wide ${t.provisoTitle}`}>{proviso.title}</p>
                  <p className={`mt-0.5 text-[12px] font-semibold leading-5 ${t.provisoBody}`}>{proviso.plainEnglish}</p>
                  <p className={`mt-0.5 text-[11px] font-medium leading-4 ${t.provisoSub}`}>{proviso.legalText}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {subClauses.length > 0 && (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {subClauses.map((subClause) => (
              <details key={subClause.no} className={`overflow-hidden rounded-lg border ${t.borderSoft} bg-white dark:bg-slate-900`}>
                <summary className="flex cursor-pointer list-none items-center gap-2 p-2">
                  <span className={`flex h-7 min-w-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${t.gradient} px-1.5 text-[10px] font-black text-white shadow-sm`}>{subClause.no}</span>
                  <span className="text-[12px] font-bold leading-4 text-slate-800 dark:text-slate-100">{subClause.plainEnglish}</span>
                </summary>
                <div className={`space-y-1.5 border-t ${t.borderSoft} px-2.5 py-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200`}>
                  <p className="text-slate-500 dark:text-slate-400">{subClause.legalText}</p>
                  {subClause.officerAction && <p><span className={`font-black ${t.labelText}`}>Officer:</span> {subClause.officerAction.join('; ')}</p>}
                  {subClause.dealerObligation && <p><span className={`font-black ${t.altText}`}>Dealer:</span> {subClause.dealerObligation.join('; ')}</p>}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(`${subClause.no}: ${subClause.legalText}\n${subClause.plainEnglish}`)} className={`inline-flex items-center gap-1.5 rounded-md border ${t.border} bg-white px-2 py-1 text-[11px] font-black ${t.boldText} hover:opacity-80 dark:bg-slate-900`}>
                    <Copy className="h-3 w-3" /> Copy sub-clause
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
        {clause.related.length > 0 && (
          <div className={`flex flex-wrap items-center gap-1.5 border-t ${t.borderSoft} pt-2`}>
            <span className={`text-[10px] font-black uppercase tracking-wide ${t.labelText}`}>Related</span>
            {clause.related.map((item) => {
              const match = /^(clause|section|rule)\s+(.+)$/i.exec(item.trim());
              const target = match ? fcoClauseLocationByNo.get(`${match[1]} ${match[2]}`.toLowerCase()) : undefined;
              if (!target) {
                return (
                  <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">{item}</span>
                );
              }
              return (
                <button key={item} type="button" onClick={() => onOpenRelated(target)} className={`inline-flex items-center gap-1 rounded-full ${t.related} px-2 py-0.5 text-[10px] font-black ring-1 transition`}>
                  {item} <ArrowRight className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}


function FcoClauseTabContent({ clause, activeTab, accent = 'sky' }: { clause: FcoClause; activeTab: FcoTabId; accent?: FcoAccent }) {
  if (activeTab === 'fullText') return <FcoTextBlock items={[clause.legalText, ...clause.explanations.map((item) => `Explanation: ${item}`)]} />;
  if (activeTab === 'plainEnglish') return <FcoTextBlock items={[clause.plainEnglish, clause.summary]} />;
  if (activeTab === 'officerAction') return <FcoTextBlock items={clause.subClauses.flatMap((item) => item.officerAction || []).concat(clause.subClauses.flatMap((item) => item.dealerObligation?.map((obligationText) => `Dealer obligation: ${obligationText}`) || []))} empty="No specific officer action listed for this clause." />;
  if (activeTab === 'formsTimelines') return <FcoFormsTimelines clause={clause} accent={accent} />;
  return null;
}

function parseTimelineDuration(text: string): { value: number; unit: string; label: string } | null {
  const match = /(\d+)\s*[-–]?\s*(working\s+days?|days?|weeks?|months?|years?)/i.exec(text);
  if (!match) return null;
  const label = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:;,.()\-–—]*(for|of|from|within|after|in|by)?[\s:;,.()\-–—]*/i, '')
    .replace(/[\s:;,.()\-–—]*$/i, '')
    .trim();
  return { value: Number(match[1]), unit: match[2].replace(/\s+/g, ' '), label: label || text };
}

function FcoTimelineStepper({ timelines, accent = 'sky' }: { timelines: string[]; accent?: FcoAccent }) {
  const t = fcoAccentThemes[accent];
  return (
    <div className={`rounded-lg border ${t.panelBox} p-2.5`}>
      <p className={`text-[10px] font-black uppercase tracking-wide ${t.panelTitle}`}>Deadline track</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {timelines.map((timeline, index) => {
          const parsed = parseTimelineDuration(timeline);
          return (
            <React.Fragment key={timeline}>
              {index > 0 && <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${t.stepperArrow}`} />}
              <div className={`flex items-center gap-2 rounded-lg border ${t.stepperBox} bg-white px-2 py-1.5 shadow-sm dark:bg-slate-900`}>
                {parsed ? (
                  <span className={`flex h-8 min-w-8 shrink-0 flex-col items-center justify-center rounded-md bg-gradient-to-br ${t.stepperBadge} px-1 leading-none text-white`}>
                    <span className="text-[13px] font-black">{parsed.value}</span>
                    <span className="text-[7px] font-black uppercase">{parsed.unit.replace('working ', 'work ')}</span>
                  </span>
                ) : (
                  <Clock className={`h-4 w-4 shrink-0 ${t.stepperClock}`} />
                )}
                <span className="text-[11px] font-bold leading-4 text-slate-700 dark:text-slate-200">{parsed ? parsed.label : timeline}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function FcoFormsTimelines({ clause, accent = 'sky' }: { clause: FcoClause; accent?: FcoAccent }) {
  const t = fcoAccentThemes[accent];
  if (clause.forms.length === 0 && clause.timelines.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">No specific form or timeline listed for this clause.</p>;
  }
  return (
    <div className="space-y-2.5">
      {clause.timelines.length > 0 && <FcoTimelineStepper timelines={clause.timelines} accent={accent} />}
      {clause.forms.length > 0 && (
        <div className={`rounded-lg border ${t.panelBox} p-2.5`}>
          <p className={`text-[10px] font-black uppercase tracking-wide ${t.panelTitle}`}>Forms</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {clause.forms.map((form) => (
              <span key={form} className={`inline-flex items-center gap-1 rounded-full ${t.panelChip} px-2 py-1 text-[11px] font-black ring-1`}>
                <FileText className="h-3 w-3" /> {form}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FcoTextBlock({ items, empty = 'No matter available.' }: { items: string[]; empty?: string }) {
  const cleanItems = items.filter(Boolean);
  if (cleanItems.length === 0) return <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">{empty}</p>;
  return (
    <div className="space-y-2 rounded-lg border border-slate-100 bg-white p-3 text-sm font-semibold leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
      {cleanItems.map((item) => <p key={item}>{item}</p>)}
    </div>
  );
}

function fcoClauseToText(clause: FcoClause) {
  return [
    `${clause.clauseLabel ?? 'FCO Clause'} ${clause.clauseNo}: ${clause.title}`,
    clause.summary,
    clause.legalText,
    clause.plainEnglish,
    ...fcoRealSubClauses(clause).map((item) => `${item.no}: ${item.legalText} - ${item.plainEnglish}`),

  ].filter(Boolean).join('\n');
}
function FcoDashboardCards({
  cards,
  activeCardId,
  showFormsCard,
  accent = 'sky',
  onOpenForms,
  onSelect,
}: {
  cards: FcoClauseCard[];
  activeCardId: string | null;
  showFormsCard: boolean;
  accent?: FcoAccent;
  onOpenForms: () => void;
  onSelect: (cardId: string) => void;
}) {
  const t = fcoAccentThemes[accent];
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {showFormsCard && (
        <button
          type="button"
          onClick={onOpenForms}
          className={`group relative flex flex-col overflow-hidden rounded-lg border ${t.border} bg-gradient-to-br ${t.tintTile} p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${t.hoverBorder} hover:shadow-md`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.iconTile} transition group-hover:scale-105`}>
              <FileText className="h-4 w-4" />
            </span>
            <span className={`rounded-full ${t.chip} px-2 py-0.5 text-[10px] font-black ring-1`}>27 statutory forms</span>
          </div>
          <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">Forms</h3>
          <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">FCO statutory forms grouped for registration, manufacturing, sampling and records.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Search', 'Preview', 'Download'].map((item) => (
              <span key={item} className={`rounded-full ${t.chipAlt} px-2 py-0.5 text-[10px] font-black ring-1`}>
                {item}
              </span>
            ))}
          </div>
        </button>
      )}
      {cards.map((card) => {
        const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;
        const active = activeCardId === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={`group relative flex flex-col overflow-hidden rounded-lg border p-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 ${t.hoverBorder} hover:shadow-md ${
              active
                ? `${t.activeTile} bg-gradient-to-br ${t.tintActive} shadow-md`
                : `${t.border} bg-gradient-to-br ${t.tintTile}`
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.iconTile} transition group-hover:scale-105`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className={`rounded-full ${t.chip} px-2 py-0.5 text-[10px] font-black ring-1`}>{card.clauseRange}</span>
            </div>
            <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{card.cardTitle}</h3>
            <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {card.contains.slice(0, 5).map((item) => (
                <span key={item} className={`rounded-full ${t.chipAlt} px-2 py-0.5 text-[10px] font-black ring-1`}>
                  {item}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function fertilizerFormSearchText(form: FertilizerFormEntry) {
  return [form.formNo, form.title, form.category, form.clause || '', form.description, form.keywords.join(' ')].join(' ').toLowerCase();
}

function FertilizerFormsPanel({
  search,
  category,
  onSearchChange,
  onCategoryChange,
  onViewForm,
}: {
  search: string;
  category: 'All' | FertilizerFormCategory;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: 'All' | FertilizerFormCategory) => void;
  onViewForm: (form: FertilizerFormEntry) => void;
}) {
  const term = search.trim().toLowerCase();
  const visibleForms = fertilizerForms.filter((form) => {
    if (category !== 'All' && form.category !== category) return false;
    if (term && !fertilizerFormSearchText(form).includes(term)) return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <FertilizerSectionBadge icon={FileText} label="Forms" />
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800/50 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search form number, title, clause, category..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {fertilizerFormCategories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCategoryChange(item)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black transition sm:text-xs ${
                category === item
                  ? 'bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-400/20'
                  : 'border border-slate-200 bg-slate-50/60 text-slate-900 hover:border-indigo-300 hover:bg-slate-100 dark:border-slate-800/50 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:bg-slate-900/50'
              }`}
            >
              {item}
            </button>
          ))}
          <span className="ml-auto rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-1 text-[11px] font-black text-indigo-800 ring-1 ring-indigo-200/80 dark:from-indigo-950/30 dark:to-violet-950/20 dark:text-indigo-200 dark:ring-indigo-900">
            {visibleForms.length} forms
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {visibleForms.map((form) => (
          <article key={form.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-indigo-200/70 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-indigo-800/50 dark:from-indigo-950/25 dark:via-slate-950 dark:to-violet-950/20">
            <div className="flex items-start gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-700 ring-1 ring-indigo-200/70 transition group-hover:scale-105 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300 dark:ring-indigo-800/50">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">{form.formNo}</p>
                <h3 className="mt-0.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{form.title}</h3>
              </div>
            </div>
            <p className="mt-2 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{form.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 px-2 py-0.5 text-[10px] font-black text-indigo-800 ring-1 ring-indigo-200 dark:from-violet-950/40 dark:to-indigo-950/30 dark:text-indigo-200 dark:ring-indigo-800/60">
                {form.category}
              </span>
              {form.clause && (
                <span className="rounded-full bg-gradient-to-br from-violet-50 to-indigo-50 px-2 py-0.5 text-[10px] font-black text-violet-800 ring-1 ring-violet-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-200 dark:ring-indigo-800/60">
                  {form.clause}
                </span>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-900/50">
              <button type="button" onClick={() => onViewForm(form)} aria-label="View" title="View" className="inline-flex min-h-7 items-center gap-1 rounded-md bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:shadow-md hover:brightness-105">
                <Eye className="h-3.5 w-3.5" />
              </button>
              <a href={form.pdfPath} download className="inline-flex min-h-7 items-center gap-1 rounded-md border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-800 transition hover:to-slate-100 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-900 dark:text-slate-200 dark:hover:to-indigo-950/30">
                <FileText className="h-3 w-3" /> PDF
              </a>
            </div>
          </article>
        ))}
        {visibleForms.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 sm:col-span-2 xl:col-span-3 dark:border-slate-800/50">
            No forms found
          </p>
        )}
      </div>
    </section>
  );
}
function FcoOffencesSection({ entries, accent = 'sky', emptyText = 'No FCO offence entry matches the current search.', exportMeta }: { entries: FcoOffenceEntry[]; accent?: FcoAccent; emptyText?: string; exportMeta: { excelFilename: string; pdfFilename: string; title: string; punishmentHeader: string } }) {
  const t = fcoAccentThemes[accent];
  const [exportOpen, setExportOpen] = useState(false);
  const handleExport = (kind: 'excel' | 'pdf') => {
    setExportOpen(false);
    const meta = { filename: kind === 'excel' ? exportMeta.excelFilename : exportMeta.pdfFilename, title: exportMeta.title, punishmentHeader: exportMeta.punishmentHeader };
    void (kind === 'excel' ? exportOffencesExcel(entries, meta) : exportOffencesPdf(entries, meta));
  };
  return (
    <div className={`overflow-hidden rounded-lg border ${t.border} bg-white shadow-sm dark:bg-slate-950`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b ${t.borderSoft} bg-white px-4 py-3 dark:bg-slate-950`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportOpen((open) => !open)}
            className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-br ${t.gradient} px-3 py-2 text-sm font-black text-white shadow-sm transition hover:brightness-105`}
          >
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          {exportOpen && (
            <>
              <button type="button" aria-label="Close export menu" onClick={() => setExportOpen(false)} className="fixed inset-0 z-10 cursor-default" />
              <div className={`absolute left-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border ${t.border} bg-white shadow-lg dark:bg-slate-900`}>
                <button type="button" onClick={() => handleExport('excel')} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-black ${t.boldText} transition ${t.hoverTint}`}>
                  <FileText className="h-3.5 w-3.5" /> Excel (.xlsx)
                </button>
                <button type="button" onClick={() => handleExport('pdf')} className={`flex w-full items-center gap-2 border-t ${t.borderSoft} px-3 py-2 text-left text-xs font-black ${t.boldText} transition ${t.hoverTint}`}>
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
              </div>
            </>
          )}
        </div>
        <span className={`rounded-full ${t.chipCount} px-3 py-1 text-xs font-black ring-1`}>
          {entries.length} offences
        </span>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <article key={entry.serialNumber} className={`flex flex-col rounded-lg border ${t.borderSoft} bg-gradient-to-br ${t.tintTile} p-2.5 shadow-sm transition hover:-translate-y-0.5 ${t.hoverBorder} hover:shadow-md`}>
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${t.iconTile} text-[11px] font-black`}>
                {entry.serialNumber}
              </span>
              <p className="min-w-0 flex-1 text-xs font-black leading-4 text-slate-900 dark:text-white">{entry.offenceType}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full ${t.chip} px-2 py-0.5 text-[10px] font-black ring-1`}>
                {entry.contraventionProvision}
              </span>
              <span className="rounded-full bg-gradient-to-br from-red-50 to-slate-50 px-2 py-0.5 text-[10px] font-black text-red-700 ring-1 ring-red-200 dark:from-red-950/40 dark:to-amber-950/30 dark:text-red-300 dark:ring-red-800/60">
                {entry.punishmentProvision}
              </span>
            </div>
            {entry.useInField && (
              <p className="mt-1.5 text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{entry.useInField}</p>
            )}
          </article>
        ))}
        {entries.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 sm:col-span-2 xl:col-span-3 dark:border-slate-700">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}


function PowersSection({ area }: { area: MainLegalArea }) {
  const theme = legalAreaCards.find((item) => item.id === area) || legalAreaCards[0];
  const visibleMappings = stopSaleSeizureMappings.filter((item) => {
    if (area === 'fertilizer') return item.group === 'Fertiliser cases under FCO 1985' || item.group === 'Fertiliser Movement Control Order cases';
    if (area === 'seed') return item.group === 'Seed cases under Seeds Act, 1966';
    return item.group === 'Insecticide cases under Insecticides Act, 1968';
  });
  const groups = Array.from(new Set(visibleMappings.map((item) => item.group)));
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group} className={`rounded-lg border ${theme.border} bg-white p-4 shadow-sm dark:bg-slate-900`}>
          <h2 className={`text-lg font-black ${theme.accent}`}>{group}</h2>
          <div className={`mt-3 overflow-x-auto rounded-lg border ${theme.border}`}>
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className={`bg-gradient-to-br ${theme.panel} text-xs font-black uppercase ${theme.accent}`}>
                <tr>
                  <th className="px-3 py-2">Situation / violation</th>
                  <th className="px-3 py-2">Act / Order</th>
                  <th className="px-3 py-2">Exact reference</th>
                  <th className="px-3 py-2">Officer power</th>
                  <th className="px-3 py-2">Procedure</th>
                  <th className="px-3 py-2">Penal provision</th>
                  <th className="px-3 py-2">Required form / notice / report</th>
                  <th className="px-3 py-2">Caution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleMappings.filter((item) => item.group === group).map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-3 py-2 font-bold">{item.situation}</td>
                    <td className="px-3 py-2">{item.applicableLaw}</td>
                    <td className="px-3 py-2">{item.exactReference}</td>
                    <td className="px-3 py-2">{item.officerPower}</td>
                    <td className="px-3 py-2">{item.procedure.join('; ')}</td>
                    <td className="px-3 py-2">{item.penalProvision}</td>
                    <td className="px-3 py-2">{item.requiredFormNoticeReport}</td>
                    <td className="px-3 py-2">{item.caution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <section className="grid gap-3 md:grid-cols-3">
        {officerWorkflows.map((workflow) => (
          <div key={workflow.id} className={`rounded-lg border ${theme.border} bg-gradient-to-br ${theme.panel} p-4 shadow-sm`}>
            <h3 className={`font-black ${theme.accent}`}>{workflow.title}</h3>
            <ol className="mt-3 space-y-2">
              {workflow.steps.map((step, index) => <li key={step} className="text-sm font-semibold text-slate-600 dark:text-slate-300">{index + 1}. {step}</li>)}
            </ol>
          </div>
        ))}
      </section>
    </div>
  );
}

function collectMindMapNodeIds(nodes: MindMapNode[], bucket: Set<string> = new Set()) {
  nodes.forEach((node) => {
    bucket.add(node.id);
    if (node.children?.length) collectMindMapNodeIds(node.children, bucket);
  });
  return bucket;
}

interface EnforcementDutiesConfig {
  accent: FcoAccent;
  badgeLabel: string;
  deadlines: EnforcementDeadline[];
  mindMap: MindMapNode[];
  offences: FcoOffenceEntry[];
  offencesTitle: string;
  offencesSubtitle: string;
  offenceSearchPlaceholder: string;
  offencesEmpty: string;
  sourceNote: string;
  excelFilename: string;
  pdfFilename: string;
  exportTitle: string;
  punishmentHeader: string;
}

const fertilizerEnforcementConfig: EnforcementDutiesConfig = {
  accent: 'sky',
  badgeLabel: 'Enforcement Mind Map',
  deadlines: enforcementDeadlines,
  mindMap: enforcementMindMap,
  offences: fcoOffenceEntries,
  offencesTitle: 'FCO Offences & Penal Provisions',
  offencesSubtitle: 'Searchable offence reference with FCO contravention and ECA punishment provisions.',
  offenceSearchPlaceholder: 'Search offence, FCO provision, ECA punishment...',
  offencesEmpty: 'No FCO offence entry matches the current search.',
  sourceNote: 'Source: Central Fertilizer Quality Control & Training Institute (CFQCTI), Faridabad — Duties and Responsibilities of Enforcement Officers.',
  excelFilename: 'fco-offences-penal-provisions.xlsx',
  pdfFilename: 'fco-offences-penal-provisions.pdf',
  exportTitle: 'FCO Offences With Relevant FCO/ECA Provisions',
  punishmentHeader: 'Punishment provision under ECA',
};

const insecticideEnforcementConfig: EnforcementDutiesConfig = {
  accent: 'amber',
  badgeLabel: 'Enforcement Mind Map',
  deadlines: insecticideDeadlines,
  mindMap: insecticideMindMap,
  offences: insecticideOffenceEntries,
  offencesTitle: 'Insecticide Offences & Penal Provisions',
  offencesSubtitle: 'Searchable offence reference with Insecticides Act sections, Rules and departmental enforcement examples.',
  offenceSearchPlaceholder: 'Search offence, Section 29, Rule 10-A, misbranded...',
  offencesEmpty: 'No insecticide offence entry matches the current search.',
  sourceNote: 'Source: Insecticides Act, 1968 (Sec. 20-24, 27-29) and Insecticides Rules, 1971 (Rules 27-34) with departmental enforcement workflow.',
  excelFilename: 'insecticide-offences-penal-provisions.xlsx',
  pdfFilename: 'insecticide-offences-penal-provisions.pdf',
  exportTitle: 'Insecticide Offences With Relevant Act/Rules Provisions',
  punishmentHeader: 'Punishment provision under Insecticides Act',
};

function EnforcementDutiesPanel({ config }: { config: EnforcementDutiesConfig }) {
  const t = fcoAccentThemes[config.accent];
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(collectMindMapNodeIds(config.mindMap)));
  const [offenceSearch, setOffenceSearch] = useState('');
  const [offencesOpen, setOffencesOpen] = useState(false);
  const allNodeIds = useMemo(() => collectMindMapNodeIds(config.mindMap), [config.mindMap]);
  const filteredOffences = useMemo(() => filterFcoOffences(config.offences, offenceSearch), [config.offences, offenceSearch]);
  const allExpanded = collapsed.size === 0;

  const toggleNode = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <FertilizerSectionBadge icon={Network} label={config.badgeLabel} accent={config.accent} />
      <section className={`rounded-lg border ${t.border} bg-white p-3 shadow-sm dark:bg-slate-900`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-[11px] font-black uppercase tracking-wide ${t.labelText}`}>Key deadlines</p>
          <button
            type="button"
            onClick={() => setCollapsed(allExpanded ? new Set(allNodeIds) : new Set())}
            className={`rounded-full border ${t.tabOff} px-3 py-1 text-[11px] font-black transition`}
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {config.deadlines.map((item) => (
            <div key={item.action} className={`flex items-start gap-2 rounded-lg border ${t.borderSoft} bg-gradient-to-br ${t.panelBox} px-2.5 py-2`}>
              <Clock className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${t.iconText}`} />
              <div>
                <p className="text-[11px] font-black leading-4 text-slate-800 dark:text-slate-100">{item.limit}</p>
                <p className="text-[10px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        {config.mindMap.map((branch) => (
          <MindMapBranchCard key={branch.id} node={branch} collapsed={collapsed} accent={config.accent} onToggle={toggleNode} />
        ))}

        <section className={`overflow-hidden rounded-lg border ${t.border} bg-white shadow-sm dark:bg-slate-900 lg:col-span-2`}>
          <button
            type="button"
            onClick={() => setOffencesOpen((open) => !open)}
            className={`flex w-full items-start gap-2.5 bg-gradient-to-br ${t.tintTile} p-3 text-left transition hover:brightness-[1.03]`}
          >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.iconTile}`}>
              <Scale className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-slate-950 dark:text-white">{config.offencesTitle}</span>
              <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{config.offencesSubtitle}</span>
            </span>
            <ChevronDown className={`mt-1 h-4 w-4 shrink-0 ${t.labelText} transition-transform duration-200 ${offencesOpen ? '' : '-rotate-90'}`} />
          </button>
          {offencesOpen && (
            <div className={`space-y-3 border-t ${t.borderSoft} p-3`}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={offenceSearch}
                  onChange={(event) => setOffenceSearch(event.target.value)}
                  placeholder={config.offenceSearchPlaceholder}
                  className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none ${t.focus} focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
                />
              </div>
              <FcoOffencesSection
                entries={filteredOffences}
                accent={config.accent}
                emptyText={config.offencesEmpty}
                exportMeta={{
                  excelFilename: config.excelFilename,
                  pdfFilename: config.pdfFilename,
                  title: config.exportTitle,
                  punishmentHeader: config.punishmentHeader,
                }}
              />
            </div>
          )}
        </section>
      </div>

      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {config.sourceNote}
      </p>
    </div>
  );
}

function MindMapBranchCard({ node, collapsed, accent = 'sky', onToggle }: { node: MindMapNode; collapsed: Set<string>; accent?: FcoAccent; onToggle: (id: string) => void }) {
  const t = fcoAccentThemes[accent];
  const hasChildren = Boolean(node.children?.length);
  const isCollapsed = collapsed.has(node.id);

  return (
    <section className={`overflow-hidden rounded-lg border ${t.border} bg-white shadow-sm dark:bg-slate-900`}>
      <button
        type="button"
        onClick={() => hasChildren && onToggle(node.id)}
        className={`flex w-full items-start gap-2.5 bg-gradient-to-br ${t.tintTile} p-3 text-left transition hover:brightness-[1.03]`}
      >
        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${t.iconTile}`}>
          <Network className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-950 dark:text-white">{node.label}</span>
          {node.detail && <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{node.detail}</span>}
        </span>
        {hasChildren && (
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 ${t.labelText} transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
        )}
      </button>
      {hasChildren && !isCollapsed && (
        <ul className={`space-y-1 border-t ${t.borderSoft} p-3`}>
          {node.children!.map((child) => (
            <MindMapNodeRow key={child.id} node={child} depth={0} collapsed={collapsed} accent={accent} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MindMapNodeRow({ node, depth, collapsed, accent = 'sky', onToggle }: { node: MindMapNode; depth: number; collapsed: Set<string>; accent?: FcoAccent; onToggle: (id: string) => void }) {
  const t = fcoAccentThemes[accent];
  const hasChildren = Boolean(node.children?.length);
  const isCollapsed = collapsed.has(node.id);

  return (
    <li>
      <div className={`flex items-start gap-1.5 rounded-md px-1 py-1 transition ${t.hoverTint}`}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${t.labelText} transition ${t.hoverTint}`}
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
          </button>
        ) : (
          <span className={`mt-1.5 ml-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br ${t.dot}`} />
        )}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className="min-w-0 flex-1 text-left"
        >
          <span className={`block leading-5 ${depth === 0 ? 'text-[13px] font-black text-slate-900 dark:text-white' : 'text-xs font-bold text-slate-800 dark:text-slate-100'}`}>
            {node.label}
          </span>
          {node.detail && (
            <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{node.detail}</span>
          )}
        </button>
      </div>
      {hasChildren && !isCollapsed && (
        <ul className={`ml-2.5 space-y-0.5 border-l ${t.border} pl-2.5`}>
          {node.children!.map((child) => (
            <MindMapNodeRow key={child.id} node={child} depth={depth + 1} collapsed={collapsed} accent={accent} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </li>
  );
}

