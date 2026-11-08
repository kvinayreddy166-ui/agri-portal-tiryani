import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Users, Search, Save, X, KeyRound } from "lucide-react";
import { supabase } from "../../../shared/lib/supabase";
import { useAuth } from "../../../shared/context/AuthContext";
import { useLanguage } from "../../../shared/context/LanguageContext";
import { provisionAllDealerLogins, provisionDealerLogin } from "../../auth/lib/provisionDealerLogins";
import { dealerEmailFromPhone, DEALER_DEFAULT_PASSWORD, normalizePhone } from "../../auth/lib/dealerAuth";
import { cachedSupabaseRows } from "../../../shared/lib/offlineCache";
const TABS = [
  { id: "fertilizer", label: "Fertilizer", telugu: "\u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32\u0C41" },
  { id: "seed", label: "Seed", telugu: "\u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28\u0C3E\u0C32\u0C41" },
  { id: "pesticide", label: "Pesticides", telugu: "\u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32\u0C41" }
];
const emptyForm = {
  dealer_name: "",
  ifms_id: "",
  phone_number: "",
  license_number: "",
  issue_date: "",
  expiry_date: "",
  location: ""
};
const DEALERS_PAGE_SIZE = 25;
const DEALER_COLUMNS = "id, dealer_name, ifms_id, phone_number, portal_email, license_number, issue_date, expiry_date, location, dealer_category, created_by, created_by_name, created_at, updated_at";
export function DealerManagement() {
  const { isAdminUser, isOfficerUser, officerProfile, user } = useAuth();
  const canManageDealers = isAdminUser || isOfficerUser;
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("fertilizer");
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [importing, setImporting] = useState(false);
  const [provisioningLogins, setProvisioningLogins] = useState(false);
  const [showLoginSetup, setShowLoginSetup] = useState(false);
  const [loginSetupDealerId, setLoginSetupDealerId] = useState("");
  const [loginPassword, setLoginPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [allDealersForLogin, setAllDealersForLogin] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await cachedSupabaseRows(
        `dealers:${activeTab}:v3`,
        () => supabase.from("dealers").select(DEALER_COLUMNS).eq("dealer_category", activeTab).order("dealer_name").limit(600),
        []
      );
      setDealers(rows);
    } catch (error) {
      console.error("Error fetching dealers:", error);
      const { data: fallback } = await supabase.from("dealers").select(DEALER_COLUMNS).order("dealer_name").limit(600);
      const filtered = (fallback || []).filter(
        (d) => (d.dealer_category || "fertilizer") === activeTab
      );
      setDealers(filtered);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);
  useEffect(() => {
    void fetchDealers();
  }, [fetchDealers]);
  const openLoginSetup = async () => {
    try {
      const data = await cachedSupabaseRows(
        "dealers:login-setup:v3",
        () => supabase.from("dealers").select(DEALER_COLUMNS).order("dealer_name").limit(600),
        []
      );
      setAllDealersForLogin(data);
      setLoginSetupDealerId("");
      setLoginPassword(DEALER_DEFAULT_PASSWORD);
      setShowLoginSetup(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not load dealers");
    }
  };
  const selectedLoginDealer = allDealersForLogin.find((d) => d.id === loginSetupDealerId);
  const handleSetupSingleDealerLogin = async () => {
    if (!loginSetupDealerId) {
      alert(t("Select a dealer first.", "\u0C2E\u0C41\u0C02\u0C26\u0C41 \u0C21\u0C40\u0C32\u0C30\u0C4D\u200C\u0C28\u0C41 \u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F."));
      return;
    }
    setProvisioningLogins(true);
    try {
      const result = await provisionDealerLogin(loginSetupDealerId, loginPassword);
      if (!result.ok) {
        alert(result.error || t("Could not set up dealer login.", "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C38\u0C46\u0C1F\u0C2A\u0C4D \u0C15\u0C3E\u0C32\u0C47\u0C26\u0C41."));
        return;
      }
      alert(
        t(
          `Login ready for ${result.dealer_name}.
Phone (login ID): ${result.phone}
Password: ${result.password}`,
          `\u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C38\u0C3F\u0C26\u0C4D\u0C27\u0C02: ${result.dealer_name}.
\u0C2B\u0C4B\u0C28\u0C4D (\u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D ID): ${result.phone}
\u0C2A\u0C3E\u0C38\u0C4D\u0C35\u0C30\u0C4D\u0C21\u0C4D: ${result.password}`
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not provision dealer login");
    } finally {
      setProvisioningLogins(false);
    }
  };
  const handleProvisionAllDealerLogins = async () => {
    if (!confirm(
      t(
        `Create or reset portal logins for ALL dealers with phone numbers? Password: ${loginPassword}`,
        `\u0C2B\u0C4B\u0C28\u0C4D \u0C09\u0C28\u0C4D\u0C28 \u0C05\u0C28\u0C4D\u0C28\u0C3F \u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32\u0C15\u0C41 \u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C38\u0C43\u0C37\u0C4D\u0C1F\u0C3F\u0C02\u0C1A\u0C3E\u0C32\u0C3E/\u0C30\u0C40\u0C38\u0C46\u0C1F\u0C4D \u0C1A\u0C47\u0C2F\u0C3E\u0C32\u0C3E? \u0C2A\u0C3E\u0C38\u0C4D\u0C35\u0C30\u0C4D\u0C21\u0C4D: ${loginPassword}`
      )
    )) {
      return;
    }
    setProvisioningLogins(true);
    try {
      const result = await provisionAllDealerLogins(loginPassword);
      const failNote = result.failed > 0 ? `

${t("Failed", "\u0C35\u0C3F\u0C2B\u0C32\u0C02")}: ${result.failed}` : "";
      alert(
        t(
          `Set up: ${result.created}${failNote}`,
          `\u0C38\u0C46\u0C1F\u0C2A\u0C4D: ${result.created}${failNote}`
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not provision dealer logins");
    } finally {
      setProvisioningLogins(false);
    }
  };
  const buildPayload = () => {
    const isPesticide = activeTab === "pesticide";
    return {
      ...formData,
      portal_email: dealerEmailFromPhone(formData.phone_number),
      dealer_category: activeTab,
      ifms_id: activeTab === "fertilizer" ? formData.ifms_id : "",
      expiry_date: isPesticide ? "2099-12-31" : formData.expiry_date,
      created_by: user?.id ?? null,
      created_by_name: officerProfile?.full_name || user?.user_metadata?.full_name || user?.email || null
    };
  };
  const handleAdd = async () => {
    try {
      const { error } = await supabase.from("dealers").insert([buildPayload()]);
      if (error) throw error;
      setShowAddForm(false);
      setFormData(emptyForm);
      void fetchDealers();
    } catch (error) {
      console.error("Error adding dealer:", error);
      alert("Failed to add dealer");
    }
  };
  const handleUpdate = async (id) => {
    try {
      const dealer = dealers.find((d) => d.id === id);
      if (!dealer) return;
      const payload = {
        ...dealer,
        ifms_id: activeTab === "fertilizer" ? dealer.ifms_id : "",
        expiry_date: activeTab === "pesticide" ? "2099-12-31" : dealer.expiry_date,
        dealer_category: activeTab
      };
      const { error } = await supabase.from("dealers").update(payload).eq("id", id);
      if (error) throw error;
      setEditingId(null);
      void fetchDealers();
    } catch (error) {
      console.error("Error updating dealer:", error);
      alert("Failed to update dealer");
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this dealer?")) return;
    try {
      const { error } = await supabase.from("dealers").delete().eq("id", id);
      if (error) throw error;
      void fetchDealers();
    } catch (error) {
      console.error("Error deleting dealer:", error);
      alert("Failed to delete dealer");
    }
  };
  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { parseExcelAndImportDealers } = await import("../../../shared/lib/excelParser");
      const { imported, errors } = await parseExcelAndImportDealers(file, activeTab);
      if (imported > 0) {
        alert(`Imported ${imported} dealers`);
        void fetchDealers();
      } else if (errors.length) {
        alert(errors.join("\n"));
      }
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };
  const updateLocalDealer = (id, field, value) => {
    setDealers(
      (prev) => prev.map((dealer) => dealer.id === id ? { ...dealer, [field]: value } : dealer)
    );
  };
  const filteredDealers = useMemo(
    () => dealers.filter(
      (dealer) => dealer.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()) || dealer.location.toLowerCase().includes(searchTerm.toLowerCase()) || dealer.license_number.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [dealers, searchTerm]
  );
  const pageCount = Math.max(1, Math.ceil(filteredDealers.length / DEALERS_PAGE_SIZE));
  const paginatedDealers = filteredDealers.slice(
    currentPage * DEALERS_PAGE_SIZE,
    currentPage * DEALERS_PAGE_SIZE + DEALERS_PAGE_SIZE
  );
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, searchTerm]);
  const showIfms = activeTab === "fertilizer";
  const validityLabel = activeTab === "pesticide" ? t("Validity", "\u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C41\u0C2C\u0C3E\u0C1F\u0C41") : t("Valid Until", "\u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C41\u0C2C\u0C3E\u0C1F\u0C41 \u0C24\u0C47\u0C26\u0C40");
  if (loading) {
    return /* @__PURE__ */ React.createElement("div", { className: "flex h-64 items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" }));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 md:flex-row md:items-center md:justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "text-xl font-bold text-gray-900 dark:text-white" }, t("Dealers Directory", "\u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32 \u0C21\u0C48\u0C30\u0C46\u0C15\u0C4D\u0C1F\u0C30\u0C40")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-600 dark:text-slate-400" }, t("Fertilizer, seed, and pesticide dealers", "\u0C0E\u0C30\u0C41\u0C35\u0C41\u0C32\u0C41, \u0C35\u0C3F\u0C24\u0C4D\u0C24\u0C28\u0C3E\u0C32\u0C41, \u0C2A\u0C41\u0C30\u0C41\u0C17\u0C41\u0C2E\u0C02\u0C26\u0C41\u0C32 \u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32\u0C41"))), canManageDealers && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, isAdminUser && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:text-emerald-300" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: ".xlsx,.xls,.csv",
      className: "hidden",
      onChange: handleExcelImport,
      disabled: importing
    }
  ), importing ? t("Importing...", "\u0C26\u0C3F\u0C17\u0C41\u0C2E\u0C24\u0C3F...") : t("Import Excel", "Excel \u0C26\u0C3F\u0C17\u0C41\u0C2E\u0C24\u0C3F")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: openLoginSetup,
      disabled: provisioningLogins,
      className: "inline-flex items-center gap-2 rounded-md border border-amber-400 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-60 dark:text-amber-200 dark:hover:bg-amber-950/30"
    },
    /* @__PURE__ */ React.createElement(KeyRound, { className: "h-4 w-4" }),
    provisioningLogins ? t("Setting up\u2026", "\u0C38\u0C46\u0C1F\u0C2A\u0C4D\u2026") : t("Setup dealer login", "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D")
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowAddForm(true),
      className: "flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-700"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "h-4 w-4" }),
    t("Add Dealer", "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C1C\u0C4B\u0C21\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F")
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-700" }, TABS.map((tab) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: tab.id,
      type: "button",
      onClick: () => {
        setActiveTab(tab.id);
        setEditingId(null);
      },
      className: `rounded-t-md px-3 py-1.5 text-xs font-bold transition ${activeTab === tab.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`
    },
    t(tab.label, tab.telugu)
  ))), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: t("Search dealers...", "\u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32\u0C41 \u0C35\u0C46\u0C24\u0C15\u0C02\u0C21\u0C3F..."),
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )), showLoginSetup && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "my-8 w-full max-w-lg rounded-xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-900 dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("div", { className: "mb-4 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-bold text-gray-900 dark:text-white" }, t("Setup dealer portal login", "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D \u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C38\u0C46\u0C1F\u0C2A\u0C4D")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowLoginSetup(false),
      className: "rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
    },
    /* @__PURE__ */ React.createElement(X, { className: "h-5 w-5" })
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300" }, t("Select dealer", "\u0C21\u0C40\u0C32\u0C30\u0C4D \u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F")), /* @__PURE__ */ React.createElement(
    "select",
    {
      value: loginSetupDealerId,
      onChange: (e) => setLoginSetupDealerId(e.target.value),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, t("\u2014 Choose dealer \u2014", "\u2014 \u0C21\u0C40\u0C32\u0C30\u0C4D \u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F \u2014")),
    allDealersForLogin.map((dealer) => {
      const digits = normalizePhone(dealer.phone_number || "");
      const hasPhone = digits.length >= 10;
      return /* @__PURE__ */ React.createElement("option", { key: dealer.id, value: dealer.id, disabled: !hasPhone }, dealer.dealer_name, " (", dealer.location || dealer.dealer_category, ") \u2014", " ", hasPhone ? digits : t("add phone first", "\u0C2E\u0C41\u0C02\u0C26\u0C41 \u0C2B\u0C4B\u0C28\u0C4D \u0C1C\u0C4B\u0C21\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F"));
    })
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300" }, t("Login ID (phone number)", "\u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D ID (\u0C2B\u0C4B\u0C28\u0C4D \u0C28\u0C02\u0C2C\u0C30\u0C4D)")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      readOnly: true,
      value: selectedLoginDealer ? normalizePhone(selectedLoginDealer.phone_number) : "",
      placeholder: t("Select a dealer to see phone", "\u0C2B\u0C4B\u0C28\u0C4D \u0C1A\u0C42\u0C21\u0C21\u0C3E\u0C28\u0C3F\u0C15\u0C3F \u0C21\u0C40\u0C32\u0C30\u0C4D \u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F"),
      className: "w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300" }, t("Password", "\u0C2A\u0C3E\u0C38\u0C4D\u0C35\u0C30\u0C4D\u0C21\u0C4D")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: loginPassword,
      onChange: (e) => setLoginPassword(e.target.value),
      className: "min-w-0 flex-1 rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setLoginPassword(DEALER_DEFAULT_PASSWORD),
      className: "shrink-0 rounded-lg border border-amber-400 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200"
    },
    t("Reset", "\u0C30\u0C40\u0C38\u0C46\u0C1F\u0C4D")
  )), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400" }, t("Recommended password:", "\u0C38\u0C3F\u0C2B\u0C3E\u0C30\u0C38\u0C41 \u0C2A\u0C3E\u0C38\u0C4D\u0C35\u0C30\u0C4D\u0C21\u0C4D:"), " ", /* @__PURE__ */ React.createElement("strong", null, DEALER_DEFAULT_PASSWORD))), selectedLoginDealer && /* @__PURE__ */ React.createElement("div", { className: "space-y-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200" }, /* @__PURE__ */ React.createElement("p", null, t("Portal email (internal):", "\u0C2A\u0C4B\u0C30\u0C4D\u0C1F\u0C32\u0C4D \u0C07\u0C2E\u0C46\u0C2F\u0C3F\u0C32\u0C4D:"), " ", /* @__PURE__ */ React.createElement("span", { className: "font-mono font-bold" }, selectedLoginDealer.portal_email || dealerEmailFromPhone(selectedLoginDealer.phone_number))), /* @__PURE__ */ React.createElement("p", null, t(
    "Dealer signs in on the login page (Dealer tab) with phone as ID and the password above.",
    "\u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C2A\u0C47\u0C1C\u0C40 \u0C21\u0C40\u0C32\u0C30\u0C4D \u0C1F\u0C4D\u0C2F\u0C3E\u0C2C\u0C4D\u200C\u0C32\u0C4B \u0C2B\u0C4B\u0C28\u0C4D ID + \u0C2A\u0C3E\u0C38\u0C4D\u0C35\u0C30\u0C4D\u0C21\u0C4D \u0C24\u0C4B \u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C24\u0C3E\u0C30\u0C41."
  )))), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex flex-col gap-2 sm:flex-row" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowLoginSetup(false),
      className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700 dark:border-slate-600 dark:text-slate-300"
    },
    t("Cancel", "\u0C30\u0C26\u0C4D\u0C26\u0C41")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleSetupSingleDealerLogin,
      disabled: provisioningLogins || !loginSetupDealerId,
      className: "flex-1 rounded-lg bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
    },
    provisioningLogins ? t("Setting up\u2026", "\u0C38\u0C46\u0C1F\u0C2A\u0C4D\u2026") : t("Setup selected", "\u0C0E\u0C02\u0C1A\u0C41\u0C15\u0C41\u0C28\u0C4D\u0C28\u0C26\u0C3F \u0C38\u0C46\u0C1F\u0C2A\u0C4D")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleProvisionAllDealerLogins,
      disabled: provisioningLogins,
      className: "flex-1 rounded-lg border border-amber-500 px-4 py-2 font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-200 dark:hover:bg-amber-950/30"
    },
    t("Setup all dealers", "\u0C05\u0C02\u0C26\u0C30\u0C3F\u0C15\u0C40 \u0C38\u0C46\u0C1F\u0C2A\u0C4D")
  )))), showAddForm && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" }, /* @__PURE__ */ React.createElement("div", { className: "my-8 w-full max-w-lg rounded-xl bg-white p-6 dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("h2", { className: "mb-4 text-xl font-bold text-gray-900 dark:text-white" }, t("Add New Dealer", "\u0C15\u0C4A\u0C24\u0C4D\u0C24 \u0C21\u0C40\u0C32\u0C30\u0C4D")), /* @__PURE__ */ React.createElement("div", { className: "max-h-[60vh] space-y-4 overflow-y-auto pr-2" }, /* @__PURE__ */ React.createElement(
    FormFields,
    {
      formData,
      setFormData,
      showIfms,
      activeTab,
      t
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "mt-6 flex gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowAddForm(false),
      className: "flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 dark:border-slate-600 dark:text-slate-300"
    },
    t("Cancel", "\u0C30\u0C26\u0C4D\u0C26\u0C41")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleAdd,
      className: "flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
    },
    t("Add Dealer", "\u0C1C\u0C4B\u0C21\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F")
  )))), /* @__PURE__ */ React.createElement("div", { className: "overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900" }, /* @__PURE__ */ React.createElement("div", { className: "table-scroll" }, /* @__PURE__ */ React.createElement("table", { className: "w-full min-w-[820px] text-sm" }, /* @__PURE__ */ React.createElement("thead", { className: "bg-gray-50 dark:bg-slate-800" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", { className: "w-14 px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, "S.No."), /* @__PURE__ */ React.createElement("th", { className: "px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, t("Dealer Name", "\u0C2A\u0C47\u0C30\u0C41")), showIfms && /* @__PURE__ */ React.createElement("th", { className: "px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, "IFMS ID"), /* @__PURE__ */ React.createElement("th", { className: "px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, t("Phone", "\u0C2B\u0C4B\u0C28\u0C4D")), /* @__PURE__ */ React.createElement("th", { className: "px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, t("License", "\u0C32\u0C48\u0C38\u0C46\u0C28\u0C4D\u0C38\u0C4D")), /* @__PURE__ */ React.createElement("th", { className: "px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, validityLabel), /* @__PURE__ */ React.createElement("th", { className: "px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, t("Location", "\u0C38\u0C4D\u0C25\u0C3E\u0C28\u0C02")), canManageDealers && /* @__PURE__ */ React.createElement("th", { className: "w-20 px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300" }, t("Actions", "\u0C1A\u0C30\u0C4D\u0C2F\u0C32\u0C41")))), /* @__PURE__ */ React.createElement("tbody", { className: "divide-y divide-gray-100 dark:divide-slate-700" }, paginatedDealers.map((dealer, index) => /* @__PURE__ */ React.createElement("tr", { key: dealer.id, className: "hover:bg-gray-50 dark:hover:bg-slate-800/50" }, /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-400" }, currentPage * DEALERS_PAGE_SIZE + index + 1), editingId === dealer.id ? /* @__PURE__ */ React.createElement(
    EditRow,
    {
      dealer,
      showIfms,
      activeTab,
      canManage: canManageDealers,
      onUpdate: () => handleUpdate(dealer.id),
      onCancel: () => setEditingId(null),
      updateLocalDealer
    }
  ) : /* @__PURE__ */ React.createElement(
    DisplayRow,
    {
      dealer,
      showIfms,
      activeTab,
      canManage: canManageDealers,
      canDelete: isAdminUser,
      onEdit: () => setEditingId(dealer.id),
      onDelete: () => handleDelete(dealer.id)
    }
  )))))), filteredDealers.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "py-12 text-center" }, /* @__PURE__ */ React.createElement(Users, { className: "mx-auto mb-4 h-12 w-12 text-gray-300" }), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500" }, t("No dealers found", "\u0C21\u0C40\u0C32\u0C30\u0C4D\u0C32\u0C41 \u0C32\u0C47\u0C30\u0C41"))), filteredDealers.length > DEALERS_PAGE_SIZE && /* @__PURE__ */ React.createElement(
    TablePagination,
    {
      currentPage,
      pageCount,
      onPageChange: setCurrentPage
    }
  )));
}
function TablePagination({
  currentPage,
  pageCount,
  onPageChange
}) {
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:text-slate-300" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => onPageChange(Math.max(0, currentPage - 1)),
      disabled: currentPage === 0,
      className: "rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
    },
    "Previous"
  ), /* @__PURE__ */ React.createElement("span", { className: "uppercase tracking-wide" }, "Page ", currentPage + 1, " / ", pageCount), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => onPageChange(Math.min(pageCount - 1, currentPage + 1)),
      disabled: currentPage >= pageCount - 1,
      className: "rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
    },
    "Next"
  ));
}
function FormFields({
  formData,
  setFormData,
  showIfms,
  activeTab,
  t
}) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, t("Dealer Name", "\u0C2A\u0C47\u0C30\u0C41")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.dealer_name,
      onChange: (e) => setFormData({ ...formData, dealer_name: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )), showIfms && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, "IFMS ID"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.ifms_id,
      onChange: (e) => setFormData({ ...formData, ifms_id: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, t("Phone", "\u0C2B\u0C4B\u0C28\u0C4D")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      value: formData.phone_number,
      onChange: (e) => setFormData({ ...formData, phone_number: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, t("License Number", "\u0C32\u0C48\u0C38\u0C46\u0C28\u0C4D\u0C38\u0C4D")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.license_number,
      onChange: (e) => setFormData({ ...formData, license_number: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )), activeTab !== "pesticide" && /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, t("Issue Date", "\u0C1C\u0C3E\u0C30\u0C40 \u0C24\u0C47\u0C26\u0C40")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: formData.issue_date,
      onChange: (e) => setFormData({ ...formData, issue_date: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, t("Expiry Date", "\u0C17\u0C21\u0C41\u0C35\u0C41")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: formData.expiry_date,
      onChange: (e) => setFormData({ ...formData, expiry_date: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  ))), activeTab === "pesticide" && /* @__PURE__ */ React.createElement("p", { className: "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" }, t("Validity: Permanent", "\u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C41\u0C2C\u0C3E\u0C1F\u0C41: \u0C36\u0C3E\u0C36\u0C4D\u0C35\u0C24\u0C02")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300" }, t("Location", "\u0C38\u0C4D\u0C25\u0C3E\u0C28\u0C02")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: formData.location,
      onChange: (e) => setFormData({ ...formData, location: e.target.value }),
      className: "w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
    }
  )));
}
function DisplayRow({
  dealer,
  showIfms,
  activeTab,
  canManage,
  canDelete,
  onEdit,
  onDelete
}) {
  const { t } = useLanguage();
  const isPermanent = activeTab === "pesticide";
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5 font-semibold text-gray-900 dark:text-white" }, dealer.dealer_name, dealer.created_by_name && /* @__PURE__ */ React.createElement("span", { className: "block text-[10px] font-normal text-gray-400 dark:text-slate-500" }, t("Added by", "\u0C15\u0C32\u0C3F\u0C2A\u0C3F\u0C28\u0C35\u0C3E\u0C30\u0C41"), ": ", dealer.created_by_name)), showIfms && /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5 text-gray-600 dark:text-slate-400" }, dealer.ifms_id), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5 text-gray-600 dark:text-slate-400" }, dealer.phone_number), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5 text-gray-600 dark:text-slate-400" }, dealer.license_number), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, isPermanent ? /* @__PURE__ */ React.createElement("span", { className: "rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" }, "Permanent") : /* @__PURE__ */ React.createElement(
    "span",
    {
      className: `rounded-full px-2 py-0.5 text-[11px] ${new Date(dealer.expiry_date) > /* @__PURE__ */ new Date() ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`
    },
    new Date(dealer.expiry_date).toLocaleDateString()
  )), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5 text-gray-600 dark:text-slate-400" }, dealer.location), canManage && /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onEdit, className: "rounded p-1 text-emerald-600 hover:bg-emerald-50" }, /* @__PURE__ */ React.createElement(Edit2, { className: "h-4 w-4" })), canDelete && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onDelete, className: "rounded p-1 text-red-600 hover:bg-red-50" }, /* @__PURE__ */ React.createElement(Trash2, { className: "h-4 w-4" })))));
}
function EditRow({
  dealer,
  showIfms,
  activeTab,
  canManage,
  onUpdate,
  onCancel,
  updateLocalDealer
}) {
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: dealer.dealer_name,
      onChange: (e) => updateLocalDealer(dealer.id, "dealer_name", e.target.value),
      className: "w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
    }
  )), showIfms && /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: dealer.ifms_id,
      onChange: (e) => updateLocalDealer(dealer.id, "ifms_id", e.target.value),
      className: "w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      value: dealer.phone_number,
      onChange: (e) => updateLocalDealer(dealer.id, "phone_number", e.target.value),
      className: "w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: dealer.license_number,
      onChange: (e) => updateLocalDealer(dealer.id, "license_number", e.target.value),
      className: "w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, activeTab === "pesticide" ? /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-emerald-700" }, "Permanent") : /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: dealer.expiry_date,
      onChange: (e) => updateLocalDealer(dealer.id, "expiry_date", e.target.value),
      className: "w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
    }
  )), /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      value: dealer.location,
      onChange: (e) => updateLocalDealer(dealer.id, "location", e.target.value),
      className: "w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
    }
  )), canManage && /* @__PURE__ */ React.createElement("td", { className: "px-2.5 py-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onUpdate, className: "rounded p-1 text-emerald-600" }, /* @__PURE__ */ React.createElement(Save, { className: "h-4 w-4" })), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onCancel, className: "rounded p-1 text-gray-600" }, /* @__PURE__ */ React.createElement(X, { className: "h-4 w-4" })))));
}
