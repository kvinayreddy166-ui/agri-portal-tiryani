import React, { useMemo, useState } from "react";
import { Search, Pin, Clock, X, ChevronRight, LayoutGrid } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { getVisibleModuleItems, moduleSections, translateMenu } from "../../data/modules";
import { getPinnedModules, getRecentModules, togglePinnedModule } from "../../lib/modulePrefs";
export function ModuleDirectory({ currentPage, isAdminUser, isOfficerUser = false, onNavigate }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [pinned, setPinned] = useState(() => getPinnedModules());
  const items = useMemo(() => getVisibleModuleItems(isAdminUser, isOfficerUser), [isAdminUser, isOfficerUser]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const sections = useMemo(() => moduleSections(items, t), [items, t]);
  const recents = useMemo(
    () => getRecentModules().map((id) => itemById.get(id)).filter((i) => Boolean(i)),
    [itemById]
  );
  const pinnedItems = useMemo(
    () => pinned.map((id) => itemById.get(id)).filter((i) => Boolean(i)),
    [pinned, itemById]
  );
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!normalizedQuery) return null;
    return items.filter(
      (item) => [item.label, item.desc, item.descTe, translateMenu(item.label)].join(" ").toLowerCase().includes(normalizedQuery)
    );
  }, [items, normalizedQuery]);
  const handlePin = (e, id) => {
    e.stopPropagation();
    setPinned(togglePinnedModule(id));
  };
  const renderCard = (item, compact = false) => {
    const isActive = currentPage === item.id;
    const isPinned = pinned.includes(item.id);
    const Icon = item.icon;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: item.id,
        type: "button",
        onClick: () => onNavigate(item.id),
        "aria-current": isActive ? "page" : void 0,
        className: `group relative flex w-full items-start gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:bg-slate-900 dark:hover:border-emerald-700 dark:focus-visible:ring-emerald-900/50 ${isActive ? "border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-500" : "border-slate-200 dark:border-slate-800"} ${compact ? "p-2.5" : ""}`
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:group-hover:bg-emerald-900/60"}`
        },
        /* @__PURE__ */ React.createElement(Icon, { className: "h-5 w-5" })
      ),
      /* @__PURE__ */ React.createElement("span", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1.5" }, /* @__PURE__ */ React.createElement("span", { className: `truncate text-[13px] font-black ${isActive ? "text-emerald-800 dark:text-emerald-200" : "text-slate-800 dark:text-slate-100"}` }, t(item.label, translateMenu(item.label)))), !compact && /* @__PURE__ */ React.createElement("span", { className: "mt-0.5 block truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400" }, t(item.desc, item.descTe))),
      /* @__PURE__ */ React.createElement("span", { className: "flex shrink-0 items-center gap-1 self-center" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: (e) => handlePin(e, item.id),
          "aria-label": isPinned ? t("Unpin module", "\u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D \u0C2A\u0C3F\u0C28\u0C4D \u0C24\u0C40\u0C38\u0C3F\u0C35\u0C47\u0C2F\u0C02\u0C21\u0C3F") : t("Pin module", "\u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D \u0C2A\u0C3F\u0C28\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F"),
          "aria-pressed": isPinned,
          className: `flex h-7 w-7 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${isPinned ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-400"}`
        },
        /* @__PURE__ */ React.createElement(Pin, { className: `h-3.5 w-3.5 ${isPinned ? "fill-current" : ""}` })
      ), /* @__PURE__ */ React.createElement(ChevronRight, { className: "h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:text-slate-600" }))
    );
  };
  return /* @__PURE__ */ React.createElement("div", { className: "mx-auto w-full max-w-5xl" }, /* @__PURE__ */ React.createElement("div", { className: "mb-4 flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/20" }, /* @__PURE__ */ React.createElement(LayoutGrid, { className: "h-5 w-5" })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("h1", { className: "text-lg font-black tracking-tight text-slate-900 dark:text-white" }, t("All Modules", "\u0C05\u0C28\u0C4D\u0C28\u0C3F \u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C41")), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-semibold text-slate-500 dark:text-slate-400" }, t(`${items.length} modules available`, `${items.length} \u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C41 \u0C05\u0C02\u0C26\u0C41\u0C2C\u0C3E\u0C1F\u0C41\u0C32\u0C4B \u0C09\u0C28\u0C4D\u0C28\u0C3E\u0C2F\u0C3F`)))), /* @__PURE__ */ React.createElement("div", { className: "sticky top-2 z-20 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:border-emerald-600 dark:focus-within:ring-emerald-900/40" }, /* @__PURE__ */ React.createElement(Search, { className: "h-4 w-4 shrink-0 text-slate-400" }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "search",
      value: query,
      onChange: (e) => setQuery(e.target.value),
      placeholder: t("Search modules\u2026", "\u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C28\u0C41 \u0C35\u0C46\u0C24\u0C15\u0C02\u0C21\u0C3F\u2026"),
      "aria-label": t("Search modules", "\u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C28\u0C41 \u0C35\u0C46\u0C24\u0C15\u0C02\u0C21\u0C3F"),
      className: "w-full bg-transparent text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
    }
  ), query && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setQuery(""),
      "aria-label": t("Clear search", "\u0C35\u0C46\u0C24\u0C41\u0C15\u0C41 \u0C15\u0C4D\u0C32\u0C3F\u0C2F\u0C30\u0C4D \u0C1A\u0C47\u0C2F\u0C02\u0C21\u0C3F"),
      className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
    },
    /* @__PURE__ */ React.createElement(X, { className: "h-3.5 w-3.5" })
  ))), results ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500" }, t(`${results.length} result${results.length === 1 ? "" : "s"}`, `${results.length} \u0C2B\u0C32\u0C3F\u0C24\u0C3E\u0C32\u0C41`)), results.length ? /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3" }, results.map((item) => renderCard(item))) : /* @__PURE__ */ React.createElement("div", { className: "rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40" }, /* @__PURE__ */ React.createElement(Search, { className: "mx-auto mb-2 h-6 w-6 text-slate-300 dark:text-slate-600" }), /* @__PURE__ */ React.createElement("p", { className: "text-sm font-bold text-slate-600 dark:text-slate-300" }, t("No modules found", "\u0C2E\u0C3E\u0C21\u0C4D\u0C2F\u0C42\u0C32\u0C4D\u200C\u0C32\u0C41 \u0C15\u0C28\u0C41\u0C17\u0C4A\u0C28\u0C2C\u0C21\u0C32\u0C47\u0C26\u0C41")), /* @__PURE__ */ React.createElement("p", { className: "mt-1 text-xs font-semibold text-slate-400" }, t("Try a different keyword", "\u0C35\u0C47\u0C30\u0C47 \u0C15\u0C40\u0C4D\u0C35\u0C30\u0C4D\u0C21\u0C4D \u0C2A\u0C4D\u0C30\u0C2F\u0C24\u0C4D\u0C28\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F")))) : /* @__PURE__ */ React.createElement("div", { className: "space-y-5" }, pinnedItems.length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", { className: "mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400" }, /* @__PURE__ */ React.createElement(Pin, { className: "h-3.5 w-3.5" }), " ", t("Pinned", "\u0C2A\u0C3F\u0C28\u0C4D \u0C1A\u0C47\u0C38\u0C3F\u0C28\u0C35\u0C3F")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3" }, pinnedItems.map((item) => renderCard(item)))), recents.length > 0 && /* @__PURE__ */ React.createElement("section", null, /* @__PURE__ */ React.createElement("h2", { className: "mb-2 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400" }, /* @__PURE__ */ React.createElement(Clock, { className: "h-3.5 w-3.5" }), " ", t("Recently used", "\u0C07\u0C1F\u0C40\u0C35\u0C32 \u0C09\u0C2A\u0C2F\u0C4B\u0C17\u0C3F\u0C02\u0C1A\u0C3F\u0C28\u0C35\u0C3F")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" }, recents.map((item) => {
    const isActive = currentPage === item.id;
    const Icon = item.icon;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: item.id,
        type: "button",
        onClick: () => onNavigate(item.id),
        className: `flex w-36 shrink-0 items-center gap-2.5 rounded-2xl border bg-white p-2.5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 dark:bg-slate-900 dark:hover:border-emerald-700 dark:focus-visible:ring-emerald-900/50 ${isActive ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200 dark:border-slate-800"}`
      },
      /* @__PURE__ */ React.createElement("span", { className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"}` }, /* @__PURE__ */ React.createElement(Icon, { className: "h-4 w-4" })),
      /* @__PURE__ */ React.createElement("span", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("span", { className: "block truncate text-[12px] font-black text-slate-800 dark:text-slate-100" }, t(item.label, translateMenu(item.label))))
    );
  }))), sections.map((section) => /* @__PURE__ */ React.createElement("section", { key: section.title }, /* @__PURE__ */ React.createElement("h2", { className: "mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500" }, section.title), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3" }, section.items.map((item) => renderCard(item)))))));
}
