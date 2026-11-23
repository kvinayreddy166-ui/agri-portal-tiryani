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
  ListOrdered,
  Network,
  PackageCheck,
  Scale,
  Search,
  Share2,
  Sparkles,
  ShieldAlert,
  SprayCan,
  Sprout,
} from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { OfficerDocumentArchiveService } from '../services/officerDocumentArchiveService';
import { fcoOffenceEntries, type FcoOffenceEntry } from '../data/fcoOffencesData';
import { type LegalCategory } from '../data/actsAndOrdersData';
import { fcoClauseCards, validateFcoClauseCoverage, type FcoClause, type FcoClauseCard, type FcoTabId } from '../data/fcoClauses';
import { insecticideActCards, insecticideForms, insecticideModuleCards, insecticideRuleCards, type InsecticideFormEntry } from '../data/insecticideActData';
import { fertilizerFormCategories, fertilizerForms, type FertilizerFormCategory, type FertilizerFormEntry } from '../../sampling-hub/data/fertilizerForms';
import { fertilizerSchedules, type FertilizerScheduleEntry } from '../../sampling-hub/data/fertilizerSchedules';
import { officerWorkflows, stopSaleSeizureMappings } from '../data/stopSaleSeizureData';
import { enforcementDeadlines, enforcementMindMap, type EnforcementDeadline, type MindMapNode } from '../data/fcoEnforcementMindMap';
import { insecticideDeadlines, insecticideMindMap, insecticideOffenceEntries } from '../data/insecticideEnforcement';
import { applyDeterministicPdfMetadata } from '../../../shared/lib/pdfDeterministic';
import { FertilizerFormPdfGenerator } from '../../sampling-hub/components/FertilizerFormPdfGenerator';
import { FcoExplorer, type FcoExplorerSection } from '../components/FcoExplorer';
import { InsecticideExplorer, type InsecticideExplorerSection } from '../components/InsecticideExplorer';
import { FcoImplementationModal } from '../../../shared/components/ui/FcoImplementationModal';

import { safeStorage } from '../../../shared/lib/safeStorage';
import { ACTS_AND_ORDERS_BACK_EVENT, setBreadcrumbTrail, clearBreadcrumbTrail, type BreadcrumbTrailCrumb } from '../../../shared/lib/breadcrumbTrail';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import {
  BOOKMARK_KEY,
  type FcoAccent,
  type FertilizerSection,
  fcoAccentThemes,
  fcoClauseLocationByNo,
  fcoIconMap,
  getLocalizedFcoTabs,
  getLocalizedLegalAreaCards,
  filterFcoCardForQuery,
  type InsecticideSection,
  legalAreaCards,
  legalTopicCards,
  type MainLegalArea,
  type ReckonerView,
  readBookmarks,
  renderHeadingTitle,
} from './actsAndOrdersShared';

export function ActsAndOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const { t } = useLanguage();
  const localizedLegalAreas = useMemo(() => getLocalizedLegalAreaCards(t), [t]);
  const showCompactHeader = !user || isAdminUser || isTestUser || isOfficerUser;
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
      const card = localizedLegalAreas.find((item) => item.id === areaFromPath);
      if (card) setCategory(card.category);
    }
  }, [areaFromPath, localizedLegalAreas]);

  // Route changes (e.g. tapping the "Acts & Orders" breadcrumb crumb) reset
  // every drill-down level so stale section/card/form state cannot leak into
  // the next visit. Keyed on the path only so a language switch does not kick
  // the user out of an open view.
  const prevAreaFromPathRef = useRef(areaFromPath);
  useEffect(() => {
    if (prevAreaFromPathRef.current === areaFromPath) return;
    prevAreaFromPathRef.current = areaFromPath;
    setSelectedFcoCardId(null);
    setFertilizerSection(null);
    setInsecticideSection(null);
    setSelectedFertilizerForm(null);
    setSelectedInsecticideForm(null);
    setQuery('');
    setView('powers');
  }, [areaFromPath]);

  // While a legal area / FCO view is open, surface the module itself in the
  // breadcrumb so users can tap back to the Acts & Orders home.
  useEffect(() => {
    if (!selectedLegalArea) {
      clearBreadcrumbTrail();
      return;
    }
    setBreadcrumbTrail([{ label: t('Acts & Orders', 'చట్టాలు & ఉత్తర్వులు'), page: 'acts-and-orders' }]);
  }, [selectedLegalArea, t]);

  useEffect(() => () => clearBreadcrumbTrail(), []);

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
    const areaCard = localizedLegalAreas.find((item) => item.id === area);
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
    setFertilizerSection(null);
    setInsecticideSection(null);
    setSelectedFertilizerForm(null);
    setSelectedInsecticideForm(null);
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
    setFertilizerSection(null);
    setInsecticideSection(null);
    setSelectedFertilizerForm(null);
    setSelectedInsecticideForm(null);
    setView('powers');
    if (areaFromPath) navigate('/officer-toolkit/acts-and-orders');
  };

  // Stepwise back: form modal → clause card → section → legal-area explorer →
  // module home. Used by both the in-page BackButton and the app-level back
  // event so every entry point unwinds the same hierarchy.
  const handleBack = () => {
    if (selectedFertilizerForm) {
      setSelectedFertilizerForm(null);
      return;
    }
    if (selectedInsecticideForm) {
      setSelectedInsecticideForm(null);
      return;
    }
    if (selectedFcoCardId) {
      setSelectedFcoCardId(null);
      setQuery('');
      return;
    }
    if (selectedLegalArea === 'insecticide' && insecticideSection) {
      setInsecticideSection(null);
      setQuery('');
      return;
    }
    if (selectedLegalArea === 'fertilizer' && fertilizerSection) {
      setFertilizerSection(null);
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

  const hasInternalDrillDown = Boolean(
    selectedFcoCardId ||
    fertilizerSection ||
    insecticideSection ||
    selectedFertilizerForm ||
    selectedInsecticideForm ||
    selectedLegalArea
  );

  // App-level Back (Layout back button) asks this page to unwind one drill-down
  // level at a time. Only intercept when a level is actually open — at module
  // home the default navigation proceeds so Back leaves the module normally.
  const drillDownOpenRef = useRef(false);
  const appBackHandlerRef = useRef<() => void>(() => {});
  useEffect(() => {
    drillDownOpenRef.current = hasInternalDrillDown;
    appBackHandlerRef.current = handleBack;
  });
  useEffect(() => {
    const handler = (event: Event) => {
      if (!drillDownOpenRef.current) return;
      event.preventDefault();
      appBackHandlerRef.current();
    };
    window.addEventListener(ACTS_AND_ORDERS_BACK_EVENT, handler);
    return () => window.removeEventListener(ACTS_AND_ORDERS_BACK_EVENT, handler);
  }, []);

  const activeAreaCard = selectedLegalArea ? localizedLegalAreas.find((item) => item.id === selectedLegalArea) : null;

  const currentMeta = useMemo(() => {
    if (!selectedLegalArea) {
      return {
        eyebrow: undefined,
        title: t('Acts & Orders', 'చట్టాలు & ఉత్తర్వులు'),
        subtitle: t('Agriculture laws, rules, and official procedures for Fertilizer, Seed, and Insecticide.', 'ఎరువులు, విత్తనాలు మరియు పురుగుమందుల చట్టాలు, నియమాలు మరియు అధికారిక ప్రక్రియలు.'),
        icon: Scale,
      };
    }

    if (selectedLegalArea === 'fertilizer') {
      if (fertilizerSection === 'clauses') {
        return {
          eyebrow: t('FCO 1985 • Statutory Clauses', 'FCO 1985 • చట్టబద్ధమైన క్లాజులు'),
          title: t('FCO 1985 Clauses & Provisions', 'FCO 1985 క్లాజులు & నిబంధనలు'),
          subtitle: t('Browse and search the 39 clauses of the Fertilizer (Control) Order, 1985.', 'ఎరువుల (నియంత్రణ) ఉత్తర్వు, 1985 లోని 39 క్లాజులను పరిశీలించండి మరియు శోధించండి.'),
          icon: BookOpen,
        };
      }
      if (fertilizerSection === 'forms') {
        return {
          eyebrow: t('FCO 1985 • Statutory Forms', 'FCO 1985 • చట్టబద్ధమైన ఫారాలు'),
          title: t('FCO 1985 Statutory Forms', 'FCO 1985 చట్టబద్ధమైన ఫారాలు'),
          subtitle: t('Official application, memorandum, inspection, stop-sale, and certificate forms.', 'అధికారిక దరఖాస్తు, మెమోరాండం, తనిఖీ, విక్రయాల నిలిపివేత మరియు ధృవీకరణ పత్రాల ఫారాలు.'),
          icon: FileText,
        };
      }
      if (fertilizerSection === 'schedules') {
        return {
          eyebrow: t('FCO 1985 • Specifications & Schedules', 'FCO 1985 • ప్రమాణాలు & షెడ్యూళ్లు'),
          title: t('FCO 1985 Schedules & Specifications', 'FCO 1985 షెడ్యూళ్లు & ప్రమాణాలు'),
          subtitle: t('Specifications of fertilizers, tolerance limits, and official sampling methods.', 'ఎరువుల రసాయన ప్రమాణాలు, టాలరెన్స్ పరిమితులు మరియు అధికారిక నమూనా సేకరణ పద్ధతులు.'),
          icon: ClipboardList,
        };
      }
      if (fertilizerSection === 'duties') {
        return {
          eyebrow: t('FCO 1985 • Enforcement & Powers', 'FCO 1985 • అమలు & అధికారాలు'),
          title: t('FCO Inspector Powers & Enforcement', 'FCO ఇన్‌స్పెక్టర్ అధికారాలు & అమలు'),
          subtitle: t('Mind maps, legal timelines, stop-sale powers, and penal provisions under ECA 1955.', 'మైండ్ మ్యాప్‌లు, చట్టపరమైన కాలపరిమితులు, స్టాప్-సేల్ అధికారాలు మరియు ECA 1955 శిక్షా నిబంధనలు.'),
          icon: Network,
        };
      }
      return {
        eyebrow: t('Acts & Orders • FCO 1985', 'చట్టాలు & ఉత్తర్వులు • FCO 1985'),
        title: t('Fertilizer Control Order', 'ఎరువుల నియంత్రణ ఉత్తర్వు (FCO)'),
        subtitle: activeAreaCard?.description || t('Clauses, schedules, forms, sampling procedures, dealer requirements, and non-standard prosecution paths under FCO 1985 and ECA 1955.', 'FCO 1985 మరియు ECA 1955 కింద క్లాజులు, షెడ్యూళ్లు, ఫారాలు, నమూనా సేకరణ పద్ధతులు మరియు డీలర్ నిబంధనలు.'),
        icon: activeAreaCard?.icon || PackageCheck,
      };
    }

    if (selectedLegalArea === 'insecticide') {
      if (insecticideSection === 'sections') {
        return {
          eyebrow: t('Insecticides Act, 1968 • Act Sections', 'పురుగుమందుల చట్టం, 1968 • చట్ట సెక్షన్లు'),
          title: t('Insecticides Act Sections', 'పురుగుమందుల చట్టం సెక్షన్లు'),
          subtitle: t('Browse all 38 statutory sections, offences, penalties, and inspector powers.', 'అన్ని 38 చట్టబద్ధమైన సెక్షన్లు, నేరాలు, జరిమానాలు మరియు ఇన్‌స్పెక్టర్ అధికారాలను చూడండి.'),
          icon: BookOpen,
        };
      }
      if (insecticideSection === 'rules') {
        return {
          eyebrow: t('Insecticides Rules, 1971', 'పురుగుమందుల నియమాలు, 1971'),
          title: t('Insecticides Rules & Schedules', 'పురుగుమందుల నియమాలు & షెడ్యూళ్లు'),
          subtitle: t('46 statutory rules, labelling mandates, safety guidelines, and schedule standards.', '46 చట్టబద్ధమైన నియమాలు, లేబులింగ్ నిబంధనలు, భద్రతా మార్గదర్శకాలు మరియు షెడ్యూల్ ప్రమాణాలు.'),
          icon: SprayCan,
        };
      }
      if (insecticideSection === 'forms') {
        return {
          eyebrow: t('Insecticides Act • Statutory Forms', 'పురుగుమందుల చట్టం • చట్టబద్ధమైన ఫారాలు'),
          title: t('Insecticide Regulatory Forms', 'పురుగుమందుల నియంత్రణ ఫారాలు'),
          subtitle: t('Statutory forms for licensing, inspection, sampling, and analyst reports.', 'లైసెన్సింగ్, తనిఖీ, నమూనా సేకరణ మరియు విశ్లేషకుల నివేదికల చట్టబద్ధమైన ఫారాలు.'),
          icon: FileText,
        };
      }
      if (insecticideSection === 'duties') {
        return {
          eyebrow: t('Insecticides Act • Enforcement & Powers', 'పురుగుమందుల చట్టం • అమలు & అధికారాలు'),
          title: t('Insecticide Inspector Powers & Duties', 'పురుగుమందుల ఇన్‌స్పెక్టర్ అధికారాలు & విధులు'),
          subtitle: t('Statutory deadlines, seizure workflows, stop sale, and penal provisions.', 'చట్టబద్ధమైన కాలపరిమితులు, జప్తి విధానాలు, విక్రయాల నిలిపివేత మరియు శిక్షా నిబంధనలు.'),
          icon: Network,
        };
      }
      return {
        eyebrow: t('Acts & Orders • Insecticides', 'చట్టాలు & ఉత్తర్వులు • పురుగుమందులు'),
        title: t('Insecticides Act, 1968 & Rules, 1971', 'పురుగుమందుల చట్టం, 1968 & నియమాలు, 1971'),
        subtitle: activeAreaCard?.description || t('Statutory sections, insecticidal rules, forms, quality standards, and enforcement powers under the Insecticides Act, 1968.', 'పురుగుమందుల చట్టం, 1968 కింద చట్టబద్ధమైన సెక్షన్లు, నియమాలు, ఫారాలు, నాణ్యతా ప్రమాణాలు మరియు అమలు అధికారాలు.'),
        icon: activeAreaCard?.icon || SprayCan,
      };
    }

    return {
      eyebrow: t('Acts & Orders • Seeds', 'చట్టాలు & ఉత్తర్వులు • విత్తనాలు'),
      title: activeAreaCard?.title || t('Seeds Act & Control Orders', 'విత్తన చట్టం & నియంత్రణ ఉత్తర్వులు'),
      subtitle: activeAreaCard?.description || t('Seeds Act 1966, Seeds Rules 1968, and Seeds (Control) Order 1983.', 'విత్తన చట్టం 1966, విత్తన నియమాలు 1968 మరియు విత్తన (నియంత్రణ) ఉత్తర్వు 1983.'),
      icon: activeAreaCard?.icon || Sprout,
    };
  }, [selectedLegalArea, fertilizerSection, insecticideSection, activeAreaCard, t]);

  const CurrentIcon = currentMeta.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 lg:px-8">
      {!selectedFcoCardId && (
        showCompactHeader ? (
          <ModulePageHeader
            className="mb-4"
            title={renderHeadingTitle(currentMeta.title, false)}
            subtitle={currentMeta.subtitle}
            icon={CurrentIcon}
          />
        ) : (
          <section className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 text-white shadow-lg ${
            activeAreaCard
              ? `border-white/20 bg-gradient-to-br ${activeAreaCard.color}`
              : selectedLegalArea === 'fertilizer'
              ? 'border-indigo-400/40 bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-950'
              : selectedLegalArea === 'insecticide'
              ? 'border-amber-400/40 bg-gradient-to-br from-amber-600 via-orange-700 to-red-800'
              : 'border-emerald-300/60 bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900'
          }`}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                      <CurrentIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {currentMeta.eyebrow && (
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/80 mb-0.5">
                          {currentMeta.eyebrow}
                        </p>
                      )}
                      <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight">
                        {renderHeadingTitle(currentMeta.title)}
                      </h1>
                      {currentMeta.subtitle && (
                        <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                          {currentMeta.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )
      )}
      {!selectedLegalArea && (
        <LegalAreaOpeningScreen cards={localizedLegalAreas} onOpen={openLegalArea} />
      )}

      {selectedLegalArea === 'fertilizer' && !fertilizerSection && (
        <FcoExplorer
          onOpenCard={(cardId) => {
            setFertilizerSection('clauses');
            setSelectedFcoCardId(cardId);
            setFcoActiveTab('plainEnglish');
          }}
          onOpenSection={(section: FcoExplorerSection, presetSearch) => {
            setSelectedFcoCardId(null);
            setFertilizerSection(section);
            if (presetSearch && section === 'schedules') setScheduleSearch(presetSearch);
          }}
          onViewForm={setSelectedFertilizerForm}
        />
      )}

      {selectedLegalArea === 'fertilizer' && fertilizerSection === 'clauses' && (
        <FertilizerClausesPanel
          search={query}
          cards={filteredFcoCards}
          activeCard={activeFcoCard}
          activeCardId={selectedFcoCardId}
          activeTab={fcoActiveTab}
          bare
          bookmarks={bookmarks}
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
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
        <InsecticideExplorer
          onOpenCard={(cardId, section) => {
            setInsecticideSection(section);
            setSelectedFcoCardId(cardId);
            setFcoActiveTab('plainEnglish');
          }}
          onOpenSection={(section: InsecticideExplorerSection) => {
            setSelectedFcoCardId(null);
            setInsecticideSection(section);
          }}
          onViewForm={setSelectedInsecticideForm}
        />
      )}

      {selectedLegalArea === 'insecticide' && insecticideSection === 'sections' && (
        <FertilizerClausesPanel
          search={query}
          cards={filteredInsecticideActCards}
          activeCard={activeInsecticideCard}
          activeCardId={selectedFcoCardId}
          activeTab={fcoActiveTab}
          bare
          bookmarks={bookmarks}
          badgeLabel="Act Sections"
          accent="amber"
          searchPlaceholder="Search Section 21 or 29..."
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
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
          bare
          bookmarks={bookmarks}
          badgeLabel="Rules"
          accent="amber"
          searchPlaceholder="Search Rule 27 or 10A..."
          onTabChange={setFcoActiveTab}
          onSearchChange={(value) => {
            setQuery(value);
            setSelectedFcoCardId(null);
          }}
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
        imageSrc="/images/insecticide-implementation-structure.webp"
        imageAlt="Implementation of Insecticides Act, 1968 - Registration, Licensing, Quality Monitoring and Field Enforcement Structure"
      />
    </div>
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
  const { t } = useLanguage();
  const acc = fcoAccentThemes[accent];
  const term = search.trim().toLowerCase();
  const visibleForms = insecticideForms.filter((form) => !term || insecticideFormSearchText(form).includes(term));

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span>{t('Insecticide Regulatory Forms', 'పురుగుమందుల నియంత్రణ ఫారాలు')}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t(
                'Statutory forms under Insecticides Rules (First Schedule) for licensing, inspection, sampling, and reports.',
                'లైసెన్సింగ్, తనిఖీ, నమూనా సేకరణ మరియు నివేదికల కోసం పురుగుమందుల నియమాల కింద చట్టబద్ధమైన ఫారాలు.'
              )}
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-800 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-800 whitespace-nowrap">
            {t(`${visibleForms.length} Forms`, `${visibleForms.length} ఫారాలు`)}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('Search form, clause or register...', 'ఫారమ్, క్లాజు లేదా రిజిస్టర్‌ను వెతకండి...')}
            className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ${acc.focus} focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
          />
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {visibleForms.map((form, index) => (
          <div key={`${form.formNo}-${index}`} className={`flex flex-col rounded-lg border ${acc.border} bg-gradient-to-br ${acc.tintTile} p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 ${acc.hoverBorder} hover:shadow-md`}>
            <div className="flex flex-1 items-start gap-2.5">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${acc.iconTile}`}>
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className={`text-[10px] font-black uppercase tracking-wide ${acc.labelText}`}>{form.formNo}</p>
                  <span className={`rounded-full ${acc.chipAlt} px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ring-1`}>{insecticideFormUserLabels[form.usedBy]}</span>
                </div>
                <h3 className="mt-0.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{form.title}</h3>
                <p className="mt-0.5 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{form.purpose}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-gradient-to-br from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 ring-1 ring-amber-200 dark:from-amber-950/40 dark:to-orange-950/30 dark:text-amber-200 dark:ring-amber-800/60 whitespace-nowrap">{form.rule}</span>
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-900/50">
              <button type="button" onClick={() => onViewForm(form)} aria-label={t('View', 'చూడండి')} title={t('View', 'చూడండి')} className="inline-flex min-h-7 items-center gap-1 rounded-md bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:shadow-md hover:brightness-105">
                <Eye className="h-3.5 w-3.5" />
              </button>
              <a href={form.pdfPath} download className="inline-flex min-h-7 items-center gap-1 rounded-md border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-800 transition hover:to-slate-100 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-900 dark:text-slate-200 dark:hover:to-orange-950/30">
                <FileText className="h-3 w-3" /> PDF
              </a>
            </div>
          </div>
        ))}
        {visibleForms.length === 0 && (
          <p className={`rounded-lg border border-dashed ${acc.border} p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2`}>{t('No forms found', 'ఫారాలు ఏవీ కనుగొనబడలేదు')}</p>
        )}
      </div>
    </section>
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
  searchPlaceholder = 'Search Clause 28 or Form J...',
  accent = 'sky',
  bare = false,
  simpleHeader = false,
  onSearchChange,
  onTabChange,
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
  bare?: boolean;
  simpleHeader?: boolean;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: FcoTabId) => void;
  onSelectCard: (cardId: string) => void;
  onToggleBookmark: (id: string) => void;
}) {
  const { t } = useLanguage();
  const acc = fcoAccentThemes[accent];
  if (activeCard) {
    return (
      <FcoCardDetailPage
        card={activeCard}
        activeTab={activeTab}
        badgeLabel={badgeLabel}
        accent={accent}
        bare={bare}
        simpleHeader={simpleHeader}
        bookmarks={bookmarks}
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
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <BookOpen className={`h-4 w-4 ${accent === 'amber' ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>{badgeLabel === 'Clauses' ? t('Clauses Directory', 'క్లాజుల డైరెక్టరీ') : badgeLabel === 'Sections' ? t('Sections Directory', 'సెక్షన్ల డైరెక్టరీ') : t('Rules Directory', 'నియమాల డైరెక్టరీ')}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('Search by clause number, keyword, schedule reference, or officer powers.', 'క్లాజు నంబర్, కీలకపదం, షెడ్యూల్ లేదా అధికారాల ద్వారా శోధించండి.')}
            </p>
          </div>
          <span className={`self-start sm:self-auto rounded-full px-2.5 py-1 text-[11px] font-black whitespace-nowrap ${
            accent === 'amber'
              ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800'
              : 'bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800'
          }`}>
            {t(`${cards.length} Cards Available`, `${cards.length} కార్డులు అందుబాటులో ఉన్నాయి`)}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ${acc.focus} focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
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
        <p className={`rounded-lg border border-dashed ${acc.border} p-8 text-center text-sm font-semibold text-slate-500`}>{t('No clauses found', 'క్లాజులు ఏవీ కనుగొనబడలేదు')}</p>
      )}
    </section>
  );
}

function scheduleSearchText(schedule: FertilizerScheduleEntry) {
  return [schedule.scheduleNo, schedule.title, schedule.subtitle, schedule.parts.map((part) => part.label).join(' '), schedule.keywords.join(' ')].join(' ').toLowerCase();
}

function FertilizerSchedulesPanel({ search, onSearchChange }: { search: string; onSearchChange: (value: string) => void }) {
  const { t } = useLanguage();
  const term = search.trim().toLowerCase();
  const visibleSchedules = fertilizerSchedules.filter((schedule) => !term || scheduleSearchText(schedule).includes(term));

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('Fertilizer Specifications & Schedules', 'ఎరువుల ప్రమాణాలు & షెడ్యూళ్లు')}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('Chemical specifications, tolerance limits, and official sampling methods under FCO 1985.', 'FCO 1985 కింద రసాయన ప్రమాణాలు, టాలరెన్స్ పరిమితులు మరియు అధికారిక నమూనా సేకరణ పద్ధతులు.')}
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800 whitespace-nowrap">
            {t(`${visibleSchedules.length} Schedules`, `${visibleSchedules.length} షెడ్యూళ్లు`)}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('Search schedule or tolerance...', 'షెడ్యూల్ లేదా టాలరెన్స్‌ను వెతకండి...')}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
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
          <p className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2 dark:border-slate-800/50">{t('No schedules found', 'షెడ్యూళ్లు ఏవీ కనుగొనబడలేదు')}</p>
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
  applyDeterministicPdfMetadata(doc, meta.filename);
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
  await OfficerDocumentArchiveService.archiveGeneratedDocument(doc.output('blob'), {
    filename: meta.filename,
    documentCategory: 'order',
    documentDate: new Date().toISOString().slice(0, 10),
    sourceModule: 'acts_and_orders',
    fileFormat: 'pdf',
    metadata: { title: meta.title },
  });
}

function LegalAreaOpeningScreen({ cards, onOpen }: { cards: typeof legalAreaCards; onOpen: (area: MainLegalArea) => void }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      {/* Category Overview Banner */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>{t('Statutory Acts, Rules & Orders', 'చట్టాలు, నియమాలు & ఉత్తర్వులు')}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('Select an agricultural domain to access legal clauses, statutory forms, inspection powers, stop-sale procedures, and penal provisions.', 'చట్టపరమైన క్లాజులు, చట్టబద్ధమైన ఫారాలు, తనిఖీ అధికారాలు, స్టాప్-సేల్ విధానాలు మరియు శిక్షా నిబంధనలను పరిశీలించడానికి వ్యవసాయ విభాగాన్ని ఎంచుకోండి.')}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 self-start sm:self-auto">
            <Scale className="h-3.5 w-3.5" />
            <span>{t('3 Regulatory Domains', '3 నియంత్రణ రంగాలు')}</span>
          </span>
        </div>
      </section>

      {/* 3 Domain Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onOpen(card.id)}
              className={`group relative flex flex-col justify-between rounded-2xl border ${card.border} bg-gradient-to-br ${card.panel} p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className={`rounded-full ${card.chip} px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1`}>
                    {card.statuteShort}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {card.statute}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Quick Tags */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs border border-slate-200/80 dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-slate-800">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">
                  {card.stats}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-black ${card.accent} group-hover:translate-x-0.5 transition-transform`}>
                  <span>{t('Explore', 'పరిశీలించండి')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
    <section className={`rounded-2xl border ${areaCard.border} bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${areaCard.color} text-white shadow-md`}>
            <AreaIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 dark:text-white sm:text-lg">{areaCard.title} Legal Topics</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Select a topic below to review powers, notices, and procedural guidelines.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.title}
              type="button"
              onClick={() => onOpenTopic(topic)}
              className={`group flex items-center gap-3.5 rounded-2xl border ${areaCard.border} bg-gradient-to-br ${areaCard.panel} p-4 text-left shadow-sm transition duration-300 ${areaCard.hover} hover:shadow-md active:scale-[0.99]`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${areaCard.color} text-white shadow-sm transition group-hover:scale-105`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-slate-950 dark:text-white">{topic.title}</span>
                <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">{topic.description}</span>
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${areaCard.accent} group-hover:translate-x-0.5 transition-transform`} />
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
  bare = false,
  simpleHeader: _simpleHeader = false,
  onToggleBookmark,
  onOpenRelated,
  onTabChange,
}: {
  card: FcoClauseCard;
  activeTab: FcoTabId;
  bookmarks: string[];
  badgeLabel?: string;
  accent?: FcoAccent;
  bare?: boolean;
  simpleHeader?: boolean;
  onToggleBookmark: (id: string) => void;
  onOpenRelated: (target: { clauseId: string; cardId: string }) => void;
  onTabChange: (tab: FcoTabId) => void;
}) {
  const { user, isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const { t } = useLanguage();
  const localizedTabs = useMemo(() => getLocalizedFcoTabs(t), [t]);
  const showCompactHeader = !user || isAdminUser || isTestUser || isOfficerUser;
  const Icon = fcoIconMap[card.icon as keyof typeof fcoIconMap] || Scale;
  const acc = fcoAccentThemes[accent];

  return (
    <section className="space-y-3">
      {showCompactHeader ? (
        <CompactToolkitHeader
          icon={Icon}
          eyebrow={`${badgeLabel} ${card.cardNo} • ${card.clauseRange}`}
          title={card.cardTitle}
          subtitle={card.summary}
          tone={accent === 'amber' ? 'amber' : 'indigo'}
          className="mb-1"
        />
      ) : (
        <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 text-white shadow-lg ${
          accent === 'amber'
            ? 'border-amber-300/60 bg-gradient-to-br from-amber-600 via-orange-600 to-red-700 dark:border-amber-700/60'
            : 'border-indigo-300/60 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 dark:border-indigo-700/60'
        }`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                    <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-snug tracking-tight">
                      {card.cardTitle}
                    </h1>
                    {card.summary && (
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                        {card.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className={`flex gap-1 overflow-x-auto bg-white px-2 py-2 dark:bg-slate-950 ${bare ? 'rounded-xl border border-slate-200 dark:border-slate-800' : 'border-b border-slate-100 dark:border-slate-800'}`}>
        {localizedTabs.map((tab) => {
          const TabIcon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-black transition ${
                selected
                  ? `bg-gradient-to-br ${acc.gradient} text-white shadow-md ${acc.shadow}`
                  : `border ${acc.tabOff}`
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className={`space-y-2 ${bare ? '' : 'p-2'}`}>
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
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 whitespace-nowrap ${fcoGlanceChipTones[accent][tone]}`}>
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
  const { language } = useLanguage();
  const isTe = language === 'te';
  const t = fcoAccentThemes[accent];
  const subClauses = fcoRealSubClauses(clause);
  const copyClause = () => navigator.clipboard?.writeText(fcoClauseToText(clause));
  const shareClause = async () => {
    const text = fcoClauseToText(clause);
    if (navigator.share) await navigator.share({ title: `${clause.clauseLabel ?? (isTe ? 'FCO క్లాజ్' : 'FCO Clause')} ${clause.clauseNo}`, text });
    else await navigator.clipboard?.writeText(text);
  };

  return (
    <details id={`fco-clause-${clause.id}`} className={`group overflow-hidden rounded-lg border ${t.border} bg-white shadow-sm transition duration-300 ${t.hoverBorder} hover:shadow-md dark:bg-slate-900`} open>
      <summary className={`flex cursor-pointer list-none flex-col gap-2 border-b ${t.borderSoft} bg-gradient-to-br ${t.tint} p-2.5 sm:flex-row sm:items-start sm:justify-between`}>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-wide ${t.labelText}`}>{clause.clauseLabel ?? (isTe ? 'క్లాజ్' : 'Clause')} {clause.clauseNo} - {clause.category}</p>
          <h3 className="mt-0.5 text-sm font-black text-slate-950 dark:text-white">{clause.title}</h3>
          <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">{clause.summary}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={(event) => { event.preventDefault(); onToggleBookmark(); }} className={`rounded-md border ${t.border} bg-white/80 p-1.5 ${t.altText} transition hover:opacity-80 dark:bg-slate-900`} aria-label={isTe ? 'క్లాజును బుక్‌మార్క్ చేయండి' : 'Bookmark clause'}>
            {bookmarked ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); copyClause(); }} className={`rounded-md border ${t.border} bg-white/80 p-1.5 ${t.boldText} transition hover:opacity-80 dark:bg-slate-900`} aria-label={isTe ? 'క్లాజును కాపీ చేయండి' : 'Copy clause'}>
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={(event) => { event.preventDefault(); void shareClause(); }} className={`rounded-md border ${t.border} bg-white/80 p-1.5 ${t.boldText} transition hover:opacity-80 dark:bg-slate-900`} aria-label={isTe ? 'క్లాజును షేర్ చేయండి' : 'Share clause'}>
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </summary>
      <div className="space-y-2.5 p-2.5">
        {(subClauses.length > 0 || clause.provisos.length > 0 || clause.forms.length > 0 || clause.timelines.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {subClauses.length > 0 && <FcoGlanceChip icon={ListOrdered} label={`${subClauses.length} ${isTe ? 'సబ్-క్లాజులు' : subClauses.length === 1 ? 'sub-clause' : 'sub-clauses'}`} accent={accent} />}
            {clause.provisos.length > 0 && <FcoGlanceChip icon={AlertTriangle} label={`${clause.provisos.length} ${isTe ? 'మినహాయింపులు' : clause.provisos.length === 1 ? 'proviso' : 'provisos'}`} tone="amber" accent={accent} />}
            {clause.forms.length > 0 && <FcoGlanceChip icon={FileText} label={`${clause.forms.length} ${isTe ? 'ఫారాలు' : clause.forms.length === 1 ? 'form' : 'forms'}`} tone="blue" accent={accent} />}
            {clause.timelines.length > 0 && <FcoGlanceChip icon={Clock} label={`${clause.timelines.length} ${isTe ? 'కాలపరిమితులు' : clause.timelines.length === 1 ? 'timeline' : 'timelines'}`} tone="emerald" accent={accent} />}
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
                  {subClause.officerAction && <p><span className={`font-black ${t.labelText}`}>{isTe ? 'అధికారి బాధ్యత:' : 'Officer:'}</span> {subClause.officerAction.join('; ')}</p>}
                  {subClause.dealerObligation && <p><span className={`font-black ${t.altText}`}>{isTe ? 'డీలర్ బాధ్యత:' : 'Dealer:'}</span> {subClause.dealerObligation.join('; ')}</p>}
                  <button type="button" onClick={() => navigator.clipboard?.writeText(`${subClause.no}: ${subClause.legalText}\n${subClause.plainEnglish}`)} className={`inline-flex items-center gap-1.5 rounded-md border ${t.border} bg-white px-2 py-1 text-[11px] font-black ${t.boldText} hover:opacity-80 dark:bg-slate-900`}>
                    <Copy className="h-3 w-3" /> {isTe ? 'సబ్-క్లాజు కాపీ చేయి' : 'Copy sub-clause'}
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
        {clause.related.length > 0 && (
          <div className={`flex flex-wrap items-center gap-1.5 border-t ${t.borderSoft} pt-2`}>
            <span className={`text-[10px] font-black uppercase tracking-wide ${t.labelText}`}>{isTe ? 'సంబంధిత సమాచారం' : 'Related'}</span>
            {clause.related.map((item) => {
              const match = /^(clause|section|rule)\s+(.+)$/i.exec(item.trim());
              const target = match ? fcoClauseLocationByNo.get(`${match[1]} ${match[2]}`.toLowerCase()) : undefined;
              if (!target) {
                return (
                  <span key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 whitespace-nowrap">{item}</span>
                );
              }
              return (
                <button key={item} type="button" onClick={() => onOpenRelated(target)} className={`inline-flex items-center gap-1 rounded-full ${t.related} px-2 py-0.5 text-[10px] font-black ring-1 transition whitespace-nowrap`}>
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
  const { language } = useLanguage();
  const isTe = language === 'te';
  if (activeTab === 'fullText') return <FcoTextBlock items={[clause.legalText, ...clause.explanations.map((item) => `${isTe ? 'వివరణ' : 'Explanation'}: ${item}`)]} />;
  if (activeTab === 'plainEnglish') return <FcoTextBlock items={[clause.plainEnglish, clause.summary]} />;
  if (activeTab === 'officerAction') return <FcoTextBlock items={clause.subClauses.flatMap((item) => item.officerAction || []).concat(clause.subClauses.flatMap((item) => item.dealerObligation?.map((obligationText) => `${isTe ? 'డీలర్ బాధ్యత' : 'Dealer obligation'}: ${obligationText}`) || []))} empty={isTe ? 'ఈ క్లాజుకు సంబంధించి నిర్దిష్ట అధికారి చర్యలు పేర్కొనబడలేదు.' : 'No specific officer action listed for this clause.'} />;
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
  const { language } = useLanguage();
  const isTe = language === 'te';
  const t = fcoAccentThemes[accent];
  return (
    <div className={`rounded-lg border ${t.panelBox} p-2.5`}>
      <p className={`text-[10px] font-black uppercase tracking-wide ${t.panelTitle}`}>{isTe ? 'గడువుల ట్రాక్' : 'Deadline track'}</p>
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
  const { language } = useLanguage();
  const isTe = language === 'te';
  const t = fcoAccentThemes[accent];
  if (clause.forms.length === 0 && clause.timelines.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">{isTe ? 'ఈ క్లాజుకు సంబంధించి నిర్దిష్ట ఫారమ్ లేదా కాలపరిమితి పేర్కొనబడలేదు.' : 'No specific form or timeline listed for this clause.'}</p>;
  }
  return (
    <div className="space-y-2.5">
      {clause.timelines.length > 0 && <FcoTimelineStepper timelines={clause.timelines} accent={accent} />}
      {clause.forms.length > 0 && (
        <div className={`rounded-lg border ${t.panelBox} p-2.5`}>
          <p className={`text-[10px] font-black uppercase tracking-wide ${t.panelTitle}`}>{isTe ? 'ఫారాలు' : 'Forms'}</p>
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

function FcoTextBlock({ items, empty }: { items: string[]; empty?: string }) {
  const { language } = useLanguage();
  const defaultEmpty = language === 'te' ? 'సమాచారం అందుబాటులో లేదు.' : 'No matter available.';
  const cleanItems = items.filter(Boolean);
  if (cleanItems.length === 0) return <p className="rounded-lg border border-dashed border-slate-200 p-3 text-sm font-semibold text-slate-500">{empty || defaultEmpty}</p>;
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
  const { language } = useLanguage();
  const isTe = language === 'te';
  const t = fcoAccentThemes[accent];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
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
            <span className={`rounded-full ${t.chip} px-2 py-0.5 text-[10px] font-black ring-1 whitespace-nowrap`}>{isTe ? '27 చట్టబద్ధమైన ఫారాలు' : '27 statutory forms'}</span>
          </div>
          <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{isTe ? 'చట్టబద్ధమైన ఫారాలు' : 'Forms'}</h3>
          <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{isTe ? 'నమోదు, తయారీ, నమూనా సేకరణ మరియు రికార్డుల వారీగా FCO చట్టబద్ధమైన ఫారాలు.' : 'FCO statutory forms grouped for registration, manufacturing, sampling and records.'}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(isTe ? ['శోధన', 'ప్రివ్యూ', 'డౌన్‌లోడ్'] : ['Search', 'Preview', 'Download']).map((item) => (
              <span key={item} className={`rounded-full ${t.chipAlt} px-2 py-0.5 text-[10px] font-black ring-1 whitespace-nowrap`}>
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
              <span className={`rounded-full ${t.chip} px-2 py-0.5 text-[10px] font-black ring-1 whitespace-nowrap`}>{card.clauseRange}</span>
            </div>
            <h3 className="mt-2.5 text-[13px] font-black leading-4 text-slate-950 dark:text-white">{card.cardTitle}</h3>
            <p className="mt-0.5 flex-1 text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">{card.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {card.contains.slice(0, 5).map((item) => (
                <span key={item} className={`rounded-full ${t.chipAlt} px-2 py-0.5 text-[10px] font-black ring-1 whitespace-nowrap`}>
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
  const { language } = useLanguage();
  const isTe = language === 'te';
  const term = search.trim().toLowerCase();
  const visibleForms = fertilizerForms.filter((form) => {
    if (category !== 'All' && form.category !== category) return false;
    if (term && !fertilizerFormSearchText(form).includes(term)) return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isTe ? 'FCO చట్టబద్ధమైన ఫారాలు' : 'FCO Statutory Forms'}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isTe ? 'తనిఖీ ఫారాలు, డీలర్ దరఖాస్తులు, నిబంధనల ధృవీకరణ పత్రాలు & నోటీసులు.' : 'Inspection forms, dealer applications, compliance certificates & notices.'}
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800 whitespace-nowrap">
            {visibleForms.length} {isTe ? 'ఫారాలు' : 'Forms'}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={isTe ? 'ఫారమ్ నంబర్ లేదా క్లాజును వెతకండి...' : 'Search form no. or clause...'}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
              {item === 'All' && isTe ? 'అన్నీ' : item}
            </button>
          ))}
          <span className="ml-auto rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 px-3 py-1 text-[11px] font-black text-indigo-800 ring-1 ring-indigo-200/80 dark:from-indigo-950/30 dark:to-violet-950/20 dark:text-indigo-200 dark:ring-indigo-900">
            {visibleForms.length} {isTe ? 'ఫారాలు' : 'forms'}
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
              <span className="rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 px-2 py-0.5 text-[10px] font-black text-indigo-800 ring-1 ring-indigo-200 dark:from-violet-950/40 dark:to-indigo-950/30 dark:text-indigo-200 dark:ring-indigo-800/60 whitespace-nowrap">
                {form.category}
              </span>
              {form.clause && (
                <span className="rounded-full bg-gradient-to-br from-violet-50 to-indigo-50 px-2 py-0.5 text-[10px] font-black text-violet-800 ring-1 ring-violet-200 dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-200 dark:ring-indigo-800/60 whitespace-nowrap">
                  {form.clause}
                </span>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-900/50">
              <button type="button" onClick={() => onViewForm(form)} aria-label={isTe ? 'వీక్షించండి' : 'View'} title={isTe ? 'వీక్షించండి' : 'View'} className="inline-flex min-h-7 items-center gap-1 rounded-md bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm transition hover:shadow-md hover:brightness-105">
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
            {isTe ? 'ఎటువంటి ఫారాలు కనుగొనబడలేదు' : 'No forms found'}
          </p>
        )}
      </div>
    </section>
  );
}
function FcoOffencesSection({ entries, accent = 'sky', emptyText, exportMeta }: { entries: FcoOffenceEntry[]; accent?: FcoAccent; emptyText?: string; exportMeta: { excelFilename: string; pdfFilename: string; title: string; punishmentHeader: string } }) {
  const { language } = useLanguage();
  const isTe = language === 'te';
  const t = fcoAccentThemes[accent];
  const [exportOpen, setExportOpen] = useState(false);
  const handleExport = (kind: 'excel' | 'pdf') => {
    setExportOpen(false);
    const meta = { filename: kind === 'excel' ? exportMeta.excelFilename : exportMeta.pdfFilename, title: exportMeta.title, punishmentHeader: exportMeta.punishmentHeader };
    void (kind === 'excel' ? exportOffencesExcel(entries, meta) : exportOffencesPdf(entries, meta));
  };
  const fallbackEmpty = isTe ? 'ఎటువంటి నేరాల వివరాలు కనుగొనబడలేదు.' : 'No FCO offence entry matches the current search.';
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
            {isTe ? 'ఎగుమతి' : 'Export'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          {exportOpen && (
            <>
              <button type="button" aria-label={isTe ? 'ఎగుమతి మెనూని మూసివేయండి' : 'Close export menu'} onClick={() => setExportOpen(false)} className="fixed inset-0 z-10 cursor-default" />
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
          {entries.length} {isTe ? 'నేరాలు & ఉల్లంఘనలు' : 'offences'}
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
              <span className={`rounded-full ${t.chip} px-2 py-0.5 text-[10px] font-black ring-1 whitespace-nowrap`}>
                {entry.contraventionProvision}
              </span>
              <span className="rounded-full bg-gradient-to-br from-red-50 to-slate-50 px-2 py-0.5 text-[10px] font-black text-red-700 ring-1 ring-red-200 dark:from-red-950/40 dark:to-amber-950/30 dark:text-red-300 dark:ring-red-800/60 whitespace-nowrap">
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
            {emptyText || fallbackEmpty}
          </p>
        )}
      </div>
    </div>
  );
}


function PowersSection({ area }: { area: MainLegalArea }) {
  const { language } = useLanguage();
  const isTe = language === 'te';
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
                  <th className="px-3 py-2">{isTe ? 'పరిస్థితి / ఉల్లంఘన' : 'Situation / violation'}</th>
                  <th className="px-3 py-2">{isTe ? 'చట్టం / ఉత్తర్వు' : 'Act / Order'}</th>
                  <th className="px-3 py-2">{isTe ? 'ఖచ్చితమైన సెక్షన్ / క్లాజ్' : 'Exact reference'}</th>
                  <th className="px-3 py-2">{isTe ? 'అధికారి అధికారం' : 'Officer power'}</th>
                  <th className="px-3 py-2">{isTe ? 'అమలు విధానం' : 'Procedure'}</th>
                  <th className="px-3 py-2">{isTe ? 'శిక్షా నిబంధన' : 'Penal provision'}</th>
                  <th className="px-3 py-2">{isTe ? 'అవసరమైన ఫారమ్ / నోటీసు / నివేదిక' : 'Required form / notice / report'}</th>
                  <th className="px-3 py-2">{isTe ? 'జాగ్రత్త / గమనిక' : 'Caution'}</th>
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
  offenceSearchPlaceholder: 'Search offence or provision...',
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
  offenceSearchPlaceholder: 'Search offence or Section 29...',
  offencesEmpty: 'No insecticide offence entry matches the current search.',
  sourceNote: 'Source: Insecticides Act, 1968 (Sec. 20-24, 27-29) and Insecticides Rules, 1971 (Rules 27-34) with departmental enforcement workflow.',
  excelFilename: 'insecticide-offences-penal-provisions.xlsx',
  pdfFilename: 'insecticide-offences-penal-provisions.pdf',
  exportTitle: 'Insecticide Offences With Relevant Act/Rules Provisions',
  punishmentHeader: 'Punishment provision under Insecticides Act',
};

function EnforcementDutiesPanel({ config }: { config: EnforcementDutiesConfig }) {
  const { language } = useLanguage();
  const isTe = language === 'te';
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
      <section className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <Network className={`h-4 w-4 ${config.accent === 'amber' ? 'text-orange-600 dark:text-orange-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>{isTe ? 'చట్టాల అమలు మైండ్ మ్యాప్' : config.badgeLabel}</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isTe ? 'చట్టబద్ధమైన గడువులు, విధివిధానాల మైండ్-మ్యాప్‌లు మరియు తనిఖీ నిబంధనలు.' : 'Statutory deadlines, procedural mind-maps, and inspection requirements.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(allExpanded ? new Set(allNodeIds) : new Set())}
            className={`self-start sm:self-auto rounded-full border ${t.tabOff} px-3 py-1 text-[11px] font-black transition`}
          >
            {allExpanded ? (isTe ? 'అన్నీ కుదించు' : 'Collapse all') : (isTe ? 'అన్నీ విస్తరించు' : 'Expand all')}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {config.deadlines.map((item) => (
            <div key={item.action} className={`flex items-start gap-2 rounded-xl border ${t.borderSoft} bg-gradient-to-br ${t.panelBox} px-2.5 py-2`}>
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
              <span className="block text-sm font-black text-slate-950 dark:text-white">
                {isTe ? (config.accent === 'amber' ? 'పురుగుమందుల నేరాలు & శిక్షా నిబంధనలు' : 'FCO నేరాలు & శిక్షా నిబంధనలు') : config.offencesTitle}
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-slate-600 dark:text-slate-300">
                {isTe ? (config.accent === 'amber' ? 'పురుగుమందుల చట్టం సెక్షన్లు, నిబంధనలు మరియు శాఖాపరమైన అమలు ఉదాహరణలతో నేరాల సూచిక.' : 'FCO ఉల్లంఘనలు మరియు ECA శిక్షా నిబంధనలతో కూడిన శోధించదగిన నేరాల సూచిక.') : config.offencesSubtitle}
              </span>
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
                  placeholder={isTe ? (config.accent === 'amber' ? 'నేరం లేదా సెక్షన్ 29 ని వెతకండి...' : 'నేరం లేదా నిబంధనను వెతకండి...') : config.offenceSearchPlaceholder}
                  className={`w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ${t.focus} focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
                />
              </div>
              <FcoOffencesSection
                entries={filteredOffences}
                accent={config.accent}
                emptyText={isTe ? 'ఎటువంటి నేరాల వివరాలు కనుగొనబడలేదు.' : config.offencesEmpty}
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

