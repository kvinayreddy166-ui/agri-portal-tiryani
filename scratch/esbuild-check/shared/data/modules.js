import {
  LayoutDashboard,
  PackageCheck,
  UsersRound,
  Archive,
  BarChart3,
  ShieldCheck,
  Tractor,
  ScrollText,
  FolderOpen,
  Landmark,
  Database,
  BookOpen,
  Gavel,
  CalendarDays,
  Phone,
  FileCheck,
  Files,
  ClipboardCheck,
  FlaskConical,
  Calculator,
  Stethoscope,
  Scale,
  Globe,
  Settings
} from "lucide-react";
export const MODULE_MENU_ITEMS = [
  // Overview
  { id: "stock-analytics", label: "Command Center", icon: PackageCheck, adminOnly: true, desc: "Live stock, receipts and sales command view", descTe: "\u0C32\u0C48\u0C35\u0C4D \u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D, \u0C30\u0C38\u0C40\u0C1F\u0C4D\u0C32\u0C41 & \u0C05\u0C2E\u0C4D\u0C2E\u0C15\u0C3E\u0C32 \u0C15\u0C2E\u0C3E\u0C02\u0C21\u0C4D \u0C35\u0C40\u0C15\u0C4D\u0C37\u0C23" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Your daily overview and quick actions", descTe: "\u0C2E\u0C40 \u0C30\u0C4B\u0C1C\u0C41\u0C35\u0C3E\u0C30\u0C40 \u0C05\u0C35\u0C32\u0C4B\u0C15\u0C28\u0C02 & \u0C24\u0C4D\u0C35\u0C30\u0C3F\u0C24 \u0C1A\u0C30\u0C4D\u0C2F\u0C32\u0C41" },
  { id: "analytics", label: "Reports", icon: BarChart3, adminOnly: true, desc: "Portal reports and analytics", descTe: "\u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D \u0C28\u0C3F\u0C35\u0C47\u0C26\u0C3F\u0C15\u0C32\u0C41 & \u0C35\u0C3F\u0C36\u0C4D\u0C32\u0C47\u0C37\u0C23\u0C32\u0C41" },
  // Statutory & Enforcement
  { id: "acts-and-orders", label: "Acts & Orders", icon: Scale, desc: "Acts, rules, orders and ready reckoners", descTe: "\u0C1A\u0C1F\u0C4D\u0C1F\u0C3E\u0C32\u0C41, \u0C28\u0C3F\u0C2C\u0C02\u0C27\u0C28\u0C32\u0C41, \u0C09\u0C24\u0C4D\u0C24\u0C30\u0C4D\u0C35\u0C41\u0C32\u0C41 & \u0C30\u0C46\u0C21\u0C40 \u0C30\u0C46\u0C15\u0C28\u0C30\u0C4D\u0C32\u0C41" },
  { id: "enforcement-tracker", label: "Enforcement Tracker", icon: Gavel, desc: "Track notices, cases and enforcement actions", descTe: "\u0C28\u0C4B\u0C1F\u0C40\u0C38\u0C41\u0C32\u0C41, \u0C15\u0C47\u0C38\u0C41\u0C32\u0C41 & \u0C05\u0C2E\u0C32\u0C41 \u0C1A\u0C30\u0C4D\u0C2F\u0C32\u0C28\u0C41 \u0C1F\u0C4D\u0C30\u0C3E\u0C15\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F" },
  { id: "forms-library", label: "Forms & Library", icon: FolderOpen, desc: "Statutory forms and document library", descTe: "\u0C1A\u0C1F\u0C4D\u0C1F\u0C2C\u0C26\u0C4D\u0C27 \u0C2B\u0C3E\u0C30\u0C3E\u0C32\u0C41 & \u0C2A\u0C24\u0C4D\u0C30 \u0C32\u0C48\u0C2C\u0C4D\u0C30\u0C30\u0C40" },
  { id: "inspection-enforcement", label: "Inspection & Enforcement", icon: ClipboardCheck, desc: "Dealer inspections and enforcement hub", descTe: "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C24\u0C28\u0C3F\u0C16\u0C40\u0C32\u0C41 & \u0C05\u0C2E\u0C32\u0C41 \u0C39\u0C2C\u0C4D" },
  { id: "license-services", label: "License Services", icon: FileCheck, desc: "License applications and services", descTe: "\u0C32\u0C48\u0C38\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C26\u0C30\u0C16\u0C3E\u0C38\u0C4D\u0C24\u0C41\u0C32\u0C41 & \u0C38\u0C47\u0C35\u0C32\u0C41" },
  { id: "forms", label: "Smart Sampling", icon: Files, desc: "Sampling plans and smart sampling tools", descTe: "\u0C38\u0C3E\u0C02\u0C2A\u0C4D\u0C32\u0C3F\u0C02\u0C17\u0C4D \u0C2A\u0C4D\u0C32\u0C3E\u0C28\u0C4D\u200C\u0C32\u0C41 & \u0C38\u0C4D\u0C2E\u0C3E\u0C30\u0C4D\u0C1F\u0C4D \u0C38\u0C3E\u0C02\u0C2A\u0C4D\u0C32\u0C3F\u0C02\u0C17\u0C4D \u0C1F\u0C42\u0C32\u0C4D\u0C38\u0C4D" },
  // Field Advisory & Diagnostics
  { id: "agrochemicals", label: "Agrochemicals Database", icon: FlaskConical, desc: "Fertilizer, pesticide and seed chemistry data", descTe: "\u0C0E\u0C30\u0C41\u0C35\u0C41, \u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41 & \u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28 \u0C30\u0C38\u0C3E\u0C2F\u0C28 \u0C21\u0C47\u0C1F\u0C3E" },
  { id: "crop-doctor", label: "Crop Doctor", icon: Stethoscope, desc: "Diagnose crop problems and get remedies", descTe: "\u0C2A\u0C02\u0C1F \u0C38\u0C2E\u0C38\u0C4D\u0C2F\u0C32\u0C28\u0C41 \u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F & \u0C2E\u0C02\u0C26\u0C41\u0C32\u0C41 \u0C2A\u0C4A\u0C02\u0C26\u0C02\u0C21\u0C3F" },
  { id: "farm-calculators", label: "Farm Calculators", icon: Calculator, desc: "Area, fertilizer, seed and profit calculators", descTe: "\u0C0E\u0C15\u0C30\u0C3E\u0C32, \u0C0E\u0C30\u0C41\u0C35\u0C41, \u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28\u0C02 & \u0C32\u0C3E\u0C2D \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D\u0C32\u0C41" },
  // Field Operations & Officer Administration
  { id: "dealers", label: "Dealers Directory", icon: UsersRound, adminOnly: true, officerAccess: true, desc: "Registered dealers and contact details", descTe: "\u0C28\u0C2E\u0C4B\u0C26\u0C3F\u0C24 \u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32\u0C41 & \u0C38\u0C02\u0C2A\u0C4D\u0C30\u0C26\u0C3F\u0C02\u0C2A\u0C41 \u0C35\u0C3F\u0C35\u0C30\u0C3E\u0C32\u0C41" },
  { id: "farm-mechanization", label: "Farm Mechanization", icon: Tractor, adminOnly: true, desc: "Machinery subsidy and mechanization info", descTe: "\u0C2F\u0C02\u0C24\u0C4D\u0C30\u0C3E\u0C32 & \u0C2F\u0C3E\u0C02\u0C24\u0C4D\u0C30\u0C40\u0C15\u0C30\u0C23 \u0C38\u0C2E\u0C3E\u0C1A\u0C3E\u0C30\u0C02" },
  { id: "farmer-database", label: "Farmer Database", icon: Database, adminOnly: true, desc: "Farmer records and registry", descTe: "\u0C30\u0C48\u0C24\u0C41 \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41 & \u0C30\u0C3F\u0C1C\u0C3F\u0C38\u0C4D\u0C1F\u0C4D\u0C30\u0C40" },
  { id: "officer-contacts", label: "Officer Contacts", icon: Phone, desc: "Directory of agriculture officers", descTe: "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C3F \u0C21\u0C48\u0C30\u0C46\u0C15\u0C4D\u0C1F\u0C30\u0C40" },
  { id: "quality", label: "Quality Control", icon: ShieldCheck, adminOnly: true, desc: "Quality testing for seeds, pesticides, fertilizers", descTe: "\u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28\u0C02, \u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32\u0C41, \u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32 \u0C28\u0C3E\u0C23\u0C4D\u0C2F\u0C24 \u0C2A\u0C30\u0C40\u0C15\u0C4D\u0C37" },
  { id: "subsidy", label: "Subsidy & Schemes", icon: Landmark, adminOnly: true, desc: "Government subsidy schemes and tracking", descTe: "\u0C2A\u0C4D\u0C30\u0C2D\u0C41\u0C24\u0C4D\u0C35 \u0C38\u0C2C\u0C4D\u0C38\u0C3F\u0C21\u0C40 \u0C2A\u0C25\u0C15\u0C3E\u0C32\u0C41 & \u0C1F\u0C4D\u0C30\u0C3E\u0C15\u0C3F\u0C02\u0C17\u0C4D" },
  { id: "tour-diary", label: "Tour Diary", icon: CalendarDays, desc: "Daily field tour logs and visits", descTe: "\u0C30\u0C4B\u0C1C\u0C41\u0C35\u0C3E\u0C30\u0C40 \u0C2B\u0C40\u0C32\u0C4D\u0C21\u0C4D \u0C1F\u0C42\u0C30\u0C4D \u0C32\u0C3E\u0C17\u0C4D\u200C\u0C32\u0C41 & \u0C38\u0C02\u0C26\u0C30\u0C4D\u0C36\u0C28\u0C32\u0C41" },
  // Knowledge & Portals
  { id: "gos-circulars", label: "GOs & Circulars", icon: ScrollText, desc: "Government orders and circulars", descTe: "\u0C2A\u0C4D\u0C30\u0C2D\u0C41\u0C24\u0C4D\u0C35 \u0C09\u0C24\u0C4D\u0C24\u0C30\u0C4D\u0C35\u0C41\u0C32\u0C41 & \u0C38\u0C30\u0C4D\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C30\u0C4D\u0C32\u0C41" },
  { id: "government-portals", label: "Government Portals", icon: Globe, desc: "Links to official government portals", descTe: "\u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C3F\u0C15 \u0C2A\u0C4D\u0C30\u0C2D\u0C41\u0C24\u0C4D\u0C35 \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C33\u0C4D\u0C33 \u0C32\u0C3F\u0C02\u0C15\u0C4D\u200C\u0C32\u0C41" },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen, desc: "AI assistant over official agri documents", descTe: "\u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C3F\u0C15 \u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32\u0C2A\u0C48 AI \u0C05\u0C38\u0C3F\u0C38\u0C4D\u0C1F\u0C46\u0C02\u0C1F\u0C4D" },
  // Records & Admin
  { id: "file-directory", label: "Document Repository", icon: FolderOpen, adminOnly: true, desc: "Uploaded documents and files", descTe: "\u0C05\u0C2A\u0C4D\u200C\u0C32\u0C4B\u0C21\u0C4D \u0C1A\u0C47\u0C38\u0C3F\u0C28 \u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32\u0C41 & \u0C2B\u0C48\u0C33\u0C4D\u0C32\u0C41" },
  { id: "excel", label: "Office Records", icon: Archive, adminOnly: true, desc: "Excel uploads and office records", descTe: "\u0C0E\u0C15\u0C4D\u0C38\u0C4D\u200C\u0C32\u0C4D\u0C38\u0C4D \u0C05\u0C2A\u0C4D\u200C\u0C32\u0C4B\u0C21\u0C4D\u200C\u0C32\u0C41 & \u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C3E\u0C32\u0C2F \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41" },
  { id: "officer-records", label: "Saved Records & Storage", icon: Archive, desc: "Your saved records and cloud storage", descTe: "\u0C2E\u0C40 \u0C38\u0C47\u0C35\u0C4D \u0C1A\u0C47\u0C38\u0C3F\u0C28 \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41 & \u0C15\u0C4D\u0C32\u0C4C\u0C21\u0C4D \u0C28\u0C3F\u0C32\u0C4D\u0C35" },
  { id: "settings", label: "Settings", icon: Settings, desc: "Account, language and app settings", descTe: "\u0C16\u0C3E\u0C24\u0C3E, \u0C2D\u0C3E\u0C37 & \u0C2F\u0C3E\u0C2A\u0C4D \u0C38\u0C46\u0C1F\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C41\u0C32\u0C41" }
];
export function getVisibleModuleItems(isAdminUser, isOfficerUser = false) {
  return MODULE_MENU_ITEMS.filter(
    (item) => !item.adminOnly || isAdminUser || item.officerAccess && isOfficerUser
  );
}
export function moduleSections(items, t) {
  const sections = [
    {
      title: t("Overview", "\u0C05\u0C35\u0C32\u0C4B\u0C15\u0C28\u0C02"),
      ids: ["stock-analytics", "dashboard", "analytics"]
    },
    {
      title: t("Statutory & Enforcement", "\u0C1A\u0C1F\u0C4D\u0C1F\u0C2C\u0C26\u0C4D\u0C27\u0C2E\u0C48\u0C28 & \u0C05\u0C2E\u0C32\u0C41"),
      ids: ["acts-and-orders", "enforcement-tracker", "forms-library", "inspection-enforcement", "license-services", "forms"]
    },
    {
      title: t("Field Advisory & Diagnostics", "\u0C2B\u0C40\u0C32\u0C4D\u0C21\u0C4D \u0C05\u0C21\u0C4D\u0C35\u0C48\u0C1C\u0C30\u0C40 & \u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C23"),
      ids: ["agrochemicals", "crop-doctor", "farm-calculators"]
    },
    {
      title: t("Field Operations & Duties", "\u0C2B\u0C40\u0C32\u0C4D\u0C21\u0C4D \u0C35\u0C3F\u0C27\u0C41\u0C32\u0C41 & \u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C15\u0C32\u0C3E\u0C2A\u0C3E\u0C32\u0C41"),
      ids: ["dealers", "farm-mechanization", "farmer-database", "officer-contacts", "quality", "subsidy", "tour-diary"]
    },
    {
      title: t("Knowledge & Portals", "\u0C1C\u0C4D\u0C1E\u0C3E\u0C28 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02 & \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D\u0C38\u0C4D"),
      ids: ["gos-circulars", "government-portals", "knowledge"]
    },
    {
      title: t("Records & Archives", "\u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41 & \u0C06\u0C30\u0C4D\u0C15\u0C48\u0C35\u0C4D"),
      ids: ["file-directory", "excel", "officer-records", "settings"]
    }
  ];
  const itemById = new Map(items.map((item) => [item.id, item]));
  const used = /* @__PURE__ */ new Set();
  const grouped = sections.map((section) => {
    const sectionItems = section.ids.map((id) => itemById.get(id)).filter((item) => Boolean(item)).sort((a, b) => a.label.localeCompare(b.label));
    sectionItems.forEach((item) => used.add(item.id));
    return { title: section.title, items: sectionItems };
  }).filter((section) => section.items.length > 0);
  const remaining = items.filter((item) => !used.has(item.id)).sort((a, b) => a.label.localeCompare(b.label));
  if (remaining.length) grouped.push({ title: t("More", "\u0C2E\u0C30\u0C3F\u0C28\u0C4D\u0C28\u0C3F"), items: remaining });
  return grouped;
}
export function translateMenu(label) {
  const labels = {
    Overview: "\u0C05\u0C35\u0C32\u0C4B\u0C15\u0C28\u0C02",
    "Statutory & Enforcement": "\u0C1A\u0C1F\u0C4D\u0C1F\u0C2C\u0C26\u0C4D\u0C27\u0C2E\u0C48\u0C28 & \u0C05\u0C2E\u0C32\u0C41",
    "Field Advisory & Diagnostics": "\u0C2B\u0C40\u0C32\u0C4D\u0C21\u0C4D \u0C05\u0C21\u0C4D\u0C35\u0C48\u0C1C\u0C30\u0C40 & \u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C23",
    "Field Operations & Duties": "\u0C2B\u0C40\u0C32\u0C4D\u0C21\u0C4D \u0C35\u0C3F\u0C27\u0C41\u0C32\u0C41 & \u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C15\u0C32\u0C3E\u0C2A\u0C3E\u0C32\u0C41",
    "Knowledge & Portals": "\u0C1C\u0C4D\u0C1E\u0C3E\u0C28 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02 & \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D\u0C38\u0C4D",
    "Records & Archives": "\u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41 & \u0C06\u0C30\u0C4D\u0C15\u0C48\u0C35\u0C4D",
    Dashboard: "\u0C21\u0C4D\u0C2F\u0C3E\u0C37\u0C4D\u200C\u0C2C\u0C4B\u0C30\u0C4D\u0C21\u0C4D",
    "Command Center": "\u0C15\u0C2E\u0C3E\u0C02\u0C21\u0C4D \u0C38\u0C46\u0C02\u0C1F\u0C30\u0C4D",
    "Stock Analytics": "\u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C35\u0C3F\u0C36\u0C4D\u0C32\u0C47\u0C37\u0C23\u0C32\u0C41",
    "Stock Receipts & Sales": "\u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C30\u0C38\u0C40\u0C1F\u0C4D\u0C32\u0C41 & \u0C05\u0C2E\u0C4D\u0C2E\u0C15\u0C3E\u0C32\u0C41",
    "Stock Inventory": "\u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C07\u0C28\u0C4D\u0C35\u0C46\u0C02\u0C1F\u0C30\u0C40",
    "My Stock Entry": "\u0C28\u0C3E \u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C0E\u0C02\u0C1F\u0C4D\u0C30\u0C40",
    "Dealers Directory": "\u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32 \u0C21\u0C48\u0C30\u0C46\u0C15\u0C4D\u0C1F\u0C30\u0C40",
    "Dealer Stock Tracking": "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C38\u0C4D\u0C1F\u0C3E\u0C15\u0C4D \u0C1F\u0C4D\u0C30\u0C3E\u0C15\u0C3F\u0C02\u0C17\u0C4D",
    "Farmer Database": "\u0C30\u0C48\u0C24\u0C41\u0C32 \u0C21\u0C47\u0C1F\u0C3E\u0C2C\u0C47\u0C38\u0C4D",
    "Officer Toolkit": "\u0C06\u0C2B\u0C40\u0C38\u0C30\u0C4D \u0C1F\u0C42\u0C32\u0C4D\u200C\u0C15\u0C3F\u0C1F\u0C4D",
    "Saved Records & Storage": "\u0C38\u0C47\u0C35\u0C4D \u0C1A\u0C47\u0C38\u0C3F\u0C28 \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41 & \u0C38\u0C4D\u0C1F\u0C4B\u0C30\u0C47\u0C1C\u0C4D",
    "Field Tools": "\u0C15\u0C4D\u0C37\u0C47\u0C24\u0C4D\u0C30 \u0C2A\u0C30\u0C3F\u0C15\u0C30\u0C3E\u0C32\u0C41",
    "Field Tools Hub": "\u0C15\u0C4D\u0C37\u0C47\u0C24\u0C4D\u0C30 \u0C2A\u0C30\u0C3F\u0C15\u0C30\u0C3E\u0C32 \u0C39\u0C2C\u0C4D",
    "Government Portals": "\u0C2A\u0C4D\u0C30\u0C2D\u0C41\u0C24\u0C4D\u0C35 \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D\u0C38\u0C4D",
    "Smart Sampling": "\u0C38\u0C4D\u0C2E\u0C3E\u0C30\u0C4D\u0C1F\u0C4D \u0C38\u0C3E\u0C02\u0C2A\u0C4D\u0C32\u0C3F\u0C02\u0C17\u0C4D",
    "Forms & Library": "\u0C2B\u0C3E\u0C30\u0C3E\u0C32\u0C41 & \u0C32\u0C48\u0C2C\u0C4D\u0C30\u0C30\u0C40",
    "Farm Calculators": "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D\u0C32\u0C41",
    "Fertilizer Calculator": "\u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D",
    "Acts & Orders": "\u0C1A\u0C1F\u0C4D\u0C1F\u0C3E\u0C32\u0C41 & \u0C09\u0C24\u0C4D\u0C24\u0C30\u0C4D\u0C35\u0C41\u0C32\u0C41",
    "Seed Rate Calculator": "\u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28 \u0C2E\u0C4B\u0C24\u0C3E\u0C26\u0C41 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D",
    "Plant Population Calculator": "\u0C2E\u0C4A\u0C15\u0C4D\u0C15\u0C32 \u0C1C\u0C28\u0C3E\u0C2D\u0C3E \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D",
    "Pesticide Calculator": "\u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D",
    "Area Calculator": "\u0C0E\u0C15\u0C30\u0C3E\u0C32 \u0C15\u0C3E\u0C32\u0C3F\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C47\u0C1F\u0C30\u0C4D",
    "GOs & Circulars": "\u0C1C\u0C3F.\u0C13.\u0C32\u0C41 & \u0C38\u0C30\u0C4D\u0C15\u0C4D\u0C2F\u0C41\u0C32\u0C30\u0C4D\u0C32\u0C41",
    "Quality Control": "\u0C28\u0C3E\u0C23\u0C4D\u0C2F\u0C24 \u0C28\u0C3F\u0C2F\u0C02\u0C24\u0C4D\u0C30\u0C23",
    "Agrochemicals Database": "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C30\u0C38\u0C3E\u0C2F\u0C28\u0C3E\u0C32 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02",
    Agrochemicals: "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C30\u0C38\u0C3E\u0C2F\u0C28\u0C3E\u0C32\u0C41",
    "Farm Mechanization": "\u0C35\u0C4D\u0C2F\u0C35\u0C38\u0C3E\u0C2F \u0C2F\u0C3E\u0C02\u0C24\u0C4D\u0C30\u0C40\u0C15\u0C30\u0C23",
    "Office Records": "\u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C3E\u0C32\u0C2F \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C41\u0C32\u0C41",
    "Document Repository": "\u0C2A\u0C24\u0C4D\u0C30\u0C3E\u0C32 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02",
    "Subsidy & Schemes": "\u0C38\u0C2C\u0C4D\u0C38\u0C3F\u0C21\u0C40 & \u0C2A\u0C25\u0C15\u0C3E\u0C32\u0C41",
    "Tour Diary": "\u0C1F\u0C42\u0C30\u0C4D \u0C21\u0C48\u0C30\u0C40",
    "Officer Contacts": "\u0C05\u0C27\u0C3F\u0C15\u0C3E\u0C30\u0C41\u0C32 \u0C2A\u0C30\u0C3F\u0C1A\u0C2F\u0C3E\u0C32\u0C41",
    "License Services": "\u0C32\u0C48\u0C38\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C38\u0C47\u0C35\u0C32\u0C41",
    "Inspection & Enforcement": "\u0C24\u0C28\u0C3F\u0C16\u0C40 & \u0C05\u0C2E\u0C32\u0C41",
    "Enforcement Tracker": "\u0C0E\u0C28\u0C4D\u200C\u0C2B\u0C4B\u0C30\u0C4D\u0C38\u0C4D\u200C\u0C2E\u0C46\u0C02\u0C1F\u0C4D \u0C1F\u0C4D\u0C30\u0C3E\u0C15\u0C30\u0C4D",
    "Crop Doctor": "\u0C2A\u0C02\u0C1F \u0C21\u0C3E\u0C15\u0C4D\u0C1F\u0C30\u0C4D",
    "Knowledge Base": "\u0C1C\u0C4D\u0C1E\u0C3E\u0C28 \u0C2D\u0C3E\u0C02\u0C21\u0C3E\u0C17\u0C3E\u0C30\u0C02",
    Reports: "\u0C28\u0C3F\u0C35\u0C47\u0C26\u0C3F\u0C15\u0C32\u0C41",
    NFSM: "\u0C0E\u0C28\u0C4D.\u0C0E\u0C2B\u0C4D.\u0C0E\u0C38\u0C4D.\u0C0E\u0C02",
    "State Seed Cell": "\u0C30\u0C3E\u0C37\u0C4D\u0C1F\u0C4D\u0C30 \u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28 \u0C15\u0C3E\u0C30\u0C4D\u0C2F\u0C3E\u0C32\u0C2F\u0C02",
    Seeds: "\u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28\u0C3E\u0C32\u0C41",
    Pesticides: "\u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32\u0C41",
    Fertilizers: "\u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32\u0C41",
    Analytics: "\u0C35\u0C3F\u0C36\u0C4D\u0C32\u0C47\u0C37\u0C23\u0C32\u0C41",
    Settings: "\u0C38\u0C46\u0C1F\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C41\u0C32\u0C41",
    "All Modules": "\u0C05\u0C28\u0C4D\u0C28\u0C3F \u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C41"
  };
  return labels[label] ?? label;
}
