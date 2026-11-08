import {
  LayoutDashboard, PackageCheck, UsersRound,
  Archive, BarChart3, ShieldCheck, Tractor, ScrollText,
  FolderOpen, Landmark, Database, BookOpen, Gavel, CalendarDays,
  Phone, FileCheck, Files,
  ClipboardCheck, FlaskConical, Calculator, Stethoscope, Scale,
  Globe, Settings, type LucideIcon,
} from 'lucide-react';

export interface ModuleMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  officerAccess?: boolean;
  desc: string;
  descTe: string;
}

export const MODULE_MENU_ITEMS: ModuleMenuItem[] = [
  // Overview
  { id: 'stock-analytics', label: 'Command Center', icon: PackageCheck, adminOnly: true, desc: 'Live stock, receipts and sales command view', descTe: 'లైవ్ స్టాక్, రసీట్లు & అమ్మకాల కమాండ్ వీక్షణ' },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Your daily overview and quick actions', descTe: 'మీ రోజువారీ అవలోకనం & త్వరిత చర్యలు' },
  { id: 'analytics', label: 'Reports', icon: BarChart3, adminOnly: true, desc: 'Portal reports and analytics', descTe: 'పోర్టల్ నివేదికలు & విశ్లేషణలు' },

  // Statutory & Enforcement
  { id: 'acts-and-orders', label: 'Acts & Orders', icon: Scale, desc: 'Acts, rules, orders and ready reckoners', descTe: 'చట్టాలు, నిబంధనలు, ఉత్తర్వులు & రెడీ రెకనర్లు' },
  { id: 'enforcement-tracker', label: 'Enforcement Tracker', icon: Gavel, desc: 'Track notices, cases and enforcement actions', descTe: 'నోటీసులు, కేసులు & అమలు చర్యలను ట్రాక్ చేయండి' },
  { id: 'forms-library', label: 'Forms & Library', icon: FolderOpen, desc: 'Statutory forms and document library', descTe: 'చట్టబద్ధ ఫారాలు & పత్ర లైబ్రరీ' },
  { id: 'inspection-enforcement', label: 'Inspection & Enforcement', icon: ClipboardCheck, desc: 'Dealer inspections and enforcement hub', descTe: 'డీలర్ తనిఖీలు & అమలు హబ్' },
  { id: 'license-services', label: 'License Services', icon: FileCheck, desc: 'License applications and services', descTe: 'లైసెన్స్ దరఖాస్తులు & సేవలు' },
  { id: 'forms', label: 'Smart Sampling', icon: Files, desc: 'Sampling plans and smart sampling tools', descTe: 'సాంప్లింగ్ ప్లాన్‌లు & స్మార్ట్ సాంప్లింగ్ టూల్స్' },

  // Field Advisory & Diagnostics
  { id: 'agrochemicals', label: 'Agrochemicals Database', icon: FlaskConical, desc: 'Fertilizer, pesticide and seed chemistry data', descTe: 'ఎరువు, పురుగుమందు & విత్తన రసాయన డేటా' },
  { id: 'crop-doctor', label: 'Crop Doctor', icon: Stethoscope, desc: 'Diagnose crop problems and get remedies', descTe: 'పంట సమస్యలను నిర్ధారించండి & మందులు పొందండి' },
  { id: 'farm-calculators', label: 'Farm Calculators', icon: Calculator, desc: 'Area, fertilizer, seed and profit calculators', descTe: 'ఎకరాల, ఎరువు, విత్తనం & లాభ కాలిక్యులేటర్లు' },

  // Field Operations & Officer Administration
  { id: 'dealers', label: 'Dealers Directory', icon: UsersRound, adminOnly: true, officerAccess: true, desc: 'Registered dealers and contact details', descTe: 'నమోదిత డీలర్లు & సంప్రదింపు వివరాలు' },
  { id: 'farm-mechanization', label: 'Farm Mechanization', icon: Tractor, adminOnly: true, desc: 'Machinery subsidy and mechanization info', descTe: 'యంత్రాల & యాంత్రీకరణ సమాచారం' },
  { id: 'farmer-database', label: 'Farmer Database', icon: Database, adminOnly: true, desc: 'Farmer records and registry', descTe: 'రైతు రికార్డులు & రిజిస్ట్రీ' },
  { id: 'officer-contacts', label: 'Officer Contacts', icon: Phone, desc: 'Directory of agriculture officers', descTe: 'వ్యవసాయ అధికారి డైరెక్టరీ' },
  { id: 'quality', label: 'Quality Control', icon: ShieldCheck, adminOnly: true, desc: 'Quality testing for seeds, pesticides, fertilizers', descTe: 'విత్తనం, పురుగుమందులు, ఎరువుల నాణ్యత పరీక్ష' },
  { id: 'subsidy', label: 'Subsidy & Schemes', icon: Landmark, adminOnly: true, desc: 'Government subsidy schemes and tracking', descTe: 'ప్రభుత్వ సబ్సిడీ పథకాలు & ట్రాకింగ్' },
  { id: 'tour-diary', label: 'Tour Diary', icon: CalendarDays, desc: 'Daily field tour logs and visits', descTe: 'రోజువారీ ఫీల్డ్ టూర్ లాగ్‌లు & సందర్శనలు' },

  // Knowledge & Portals
  { id: 'gos-circulars', label: 'GOs & Circulars', icon: ScrollText, desc: 'Government orders and circulars', descTe: 'ప్రభుత్వ ఉత్తర్వులు & సర్క్యులర్లు' },
  { id: 'government-portals', label: 'Government Portals', icon: Globe, desc: 'Links to official government portals', descTe: 'అధికారిక ప్రభుత్వ పోర్టళ్ళ లింక్‌లు' },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, desc: 'AI assistant over official agri documents', descTe: 'అధికారిక వ్యవసాయ పత్రాలపై AI అసిస్టెంట్' },

  // Records & Admin
  { id: 'file-directory', label: 'Document Repository', icon: FolderOpen, adminOnly: true, desc: 'Uploaded documents and files', descTe: 'అప్‌లోడ్ చేసిన పత్రాలు & ఫైళ్లు' },
  { id: 'excel', label: 'Office Records', icon: Archive, adminOnly: true, desc: 'Excel uploads and office records', descTe: 'ఎక్స్‌ల్స్ అప్‌లోడ్‌లు & కార్యాలయ రికార్డులు' },
  { id: 'officer-records', label: 'Saved Records & Storage', icon: Archive, desc: 'Your saved records and cloud storage', descTe: 'మీ సేవ్ చేసిన రికార్డులు & క్లౌడ్ నిల్వ' },
  { id: 'settings', label: 'Settings', icon: Settings, desc: 'Account, language and app settings', descTe: 'ఖాతా, భాష & యాప్ సెట్టింగులు' },
];

export function getVisibleModuleItems(isAdminUser: boolean, isOfficerUser = false) {
  return MODULE_MENU_ITEMS.filter(
    (item) => !item.adminOnly || isAdminUser || (item.officerAccess && isOfficerUser)
  );
}

export function moduleSections(items: ModuleMenuItem[], t: (key: string, telugu: string) => string) {
  const sections = [
    {
      title: t('Overview', 'అవలోకనం'),
      ids: ['stock-analytics', 'dashboard', 'analytics'],
    },
    {
      title: t('Statutory & Enforcement', 'చట్టబద్ధమైన & అమలు'),
      ids: ['acts-and-orders', 'enforcement-tracker', 'forms-library', 'inspection-enforcement', 'license-services', 'forms'],
    },
    {
      title: t('Field Advisory & Diagnostics', 'ఫీల్డ్ అడ్వైజరీ & నిర్ధారణ'),
      ids: ['agrochemicals', 'crop-doctor', 'farm-calculators'],
    },
    {
      title: t('Field Operations & Duties', 'ఫీల్డ్ విధులు & కార్యకలాపాలు'),
      ids: ['dealers', 'farm-mechanization', 'farmer-database', 'officer-contacts', 'quality', 'subsidy', 'tour-diary'],
    },
    {
      title: t('Knowledge & Portals', 'జ్ఞాన భాండాగారం & పోర్టల్స్'),
      ids: ['gos-circulars', 'government-portals', 'knowledge'],
    },
    {
      title: t('Records & Archives', 'రికార్డులు & ఆర్కైవ్'),
      ids: ['file-directory', 'excel', 'officer-records', 'settings'],
    },
  ];

  const itemById = new Map(items.map((item) => [item.id, item]));
  const used = new Set<string>();
  const grouped = sections
    .map((section) => {
      const sectionItems = section.ids
        .map((id) => itemById.get(id))
        .filter((item): item is ModuleMenuItem => Boolean(item))
        .sort((a, b) => a.label.localeCompare(b.label));
      sectionItems.forEach((item) => used.add(item.id));
      return { title: section.title, items: sectionItems };
    })
    .filter((section) => section.items.length > 0);

  const remaining = items
    .filter((item) => !used.has(item.id))
    .sort((a, b) => a.label.localeCompare(b.label));
  if (remaining.length) grouped.push({ title: t('More', 'మరిన్ని'), items: remaining });
  return grouped;
}

export function translateMenu(label: string) {
  const labels: Record<string, string> = {
    Overview: 'అవలోకనం',
    'Statutory & Enforcement': 'చట్టబద్ధమైన & అమలు',
    'Field Advisory & Diagnostics': 'ఫీల్డ్ అడ్వైజరీ & నిర్ధారణ',
    'Field Operations & Duties': 'ఫీల్డ్ విధులు & కార్యకలాపాలు',
    'Knowledge & Portals': 'జ్ఞాన భాండాగారం & పోర్టల్స్',
    'Records & Archives': 'రికార్డులు & ఆర్కైవ్',
    Dashboard: 'డ్యాష్‌బోర్డ్',
    'Command Center': 'కమాండ్ సెంటర్',
    'Stock Analytics': 'స్టాక్ విశ్లేషణలు',
    'Stock Receipts & Sales': 'స్టాక్ రసీట్లు & అమ్మకాలు',
    'Stock Inventory': 'స్టాక్ ఇన్వెంటరీ',
    'My Stock Entry': 'నా స్టాక్ ఎంట్రీ',
    'Dealers Directory': 'డీలర్ల డైరెక్టరీ',
    'Dealer Stock Tracking': 'డీలర్ స్టాక్ ట్రాకింగ్',
    'Farmer Database': 'రైతుల డేటాబేస్',
    'Officer Toolkit': 'ఆఫీసర్ టూల్‌కిట్',
    'Saved Records & Storage': 'సేవ్ చేసిన రికార్డులు & స్టోరేజ్',
    'Field Tools': 'క్షేత్ర పరికరాలు',
    'Field Tools Hub': 'క్షేత్ర పరికరాల హబ్',
    'Government Portals': 'ప్రభుత్వ పోర్టల్స్',
    'Smart Sampling': 'స్మార్ట్ సాంప్లింగ్',
    'Forms & Library': 'ఫారాలు & లైబ్రరీ',
    'Farm Calculators': 'వ్యవసాయ కాలిక్యులేటర్లు',
    'Fertilizer Calculator': 'ఎరువుల కాలిక్యులేటర్',
    'Acts & Orders': 'చట్టాలు & ఉత్తర్వులు',
    'Seed Rate Calculator': 'విత్తన మోతాదు కాలిక్యులేటర్',
    'Plant Population Calculator': 'మొక్కల జనాభా కాలిక్యులేటర్',
    'Pesticide Calculator': 'పురుగుమందుల కాలిక్యులేటర్',
    'Area Calculator': 'ఎకరాల కాలిక్యులేటర్',
    'GOs & Circulars': 'జి.ఓ.లు & సర్క్యులర్లు',
    'Quality Control': 'నాణ్యత నియంత్రణ',
    'Agrochemicals Database': 'వ్యవసాయ రసాయనాల భాండాగారం',
    Agrochemicals: 'వ్యవసాయ రసాయనాలు',
    'Farm Mechanization': 'వ్యవసాయ యాంత్రీకరణ',
    'Office Records': 'కార్యాలయ రికార్డులు',
    'Document Repository': 'పత్రాల భాండాగారం',
    'Subsidy & Schemes': 'సబ్సిడీ & పథకాలు',
    'Tour Diary': 'టూర్ డైరీ',
    'Officer Contacts': 'అధికారుల పరిచయాలు',
    'License Services': 'లైసెన్స్ సేవలు',
    'Inspection & Enforcement': 'తనిఖీ & అమలు',
    'Enforcement Tracker': 'ఎన్‌ఫోర్స్‌మెంట్ ట్రాకర్',
    'Crop Doctor': 'పంట డాక్టర్',
    'Knowledge Base': 'జ్ఞాన భాండాగారం',
    Reports: 'నివేదికలు',
    NFSM: 'ఎన్.ఎఫ్.ఎస్.ఎం',
    'State Seed Cell': 'రాష్ట్ర విత్తన కార్యాలయం',
    Seeds: 'విత్తనాలు',
    Pesticides: 'పురుగుమందులు',
    Fertilizers: 'ఎరువులు',
    Analytics: 'విశ్లేషణలు',
    Settings: 'సెట్టింగులు',
    'All Modules': 'అన్ని మాడ్యూల్‌లు',
  };
  return labels[label] ?? label;
}
