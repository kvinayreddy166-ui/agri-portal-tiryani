import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Save, X, KeyRound, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, ADMIN_USER_ID } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { Dealer } from '../../../shared/types/database';
import { provisionAllDealerLogins, provisionDealerLogin } from '../../auth/lib/provisionDealerLogins';
import { dealerEmailFromPhone, DEALER_DEFAULT_PASSWORD, normalizePhone } from '../../auth/lib/dealerAuth';
import { cachedSupabaseRows } from '../../../shared/lib/offlineCache';
import { downloadCsv } from '../../../shared/utils/csvExport';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
  normalizeDistrictName,
} from '../../../shared/data/telanganaDistrictMandalData';

type DealerCategory = 'fertilizer' | 'seed' | 'pesticide';

const TABS: { id: DealerCategory; label: string; telugu: string }[] = [
  { id: 'fertilizer', label: 'Fertilizer', telugu: 'ఎరువులు' },
  { id: 'seed', label: 'Seed', telugu: 'విత్తనాలు' },
  { id: 'pesticide', label: 'Pesticides', telugu: 'పురుగుమందులు' },
];

const emptyForm = {
  dealer_name: '',
  ifms_id: '',
  phone_number: '',
  license_number: '',
  issue_date: '',
  expiry_date: '',
  location: '',
  district: '',
  mandal: '',
};
const DEALERS_PAGE_SIZE = 25;
const DEALER_COLUMNS =
  'id, dealer_name, ifms_id, phone_number, portal_email, license_number, issue_date, expiry_date, location, district, mandal, dealer_category, created_by, created_by_name, created_at, updated_at';
// Fallback for databases where the district/mandal migration hasn't been applied yet.
const DEALER_COLUMNS_LEGACY =
  'id, dealer_name, ifms_id, phone_number, portal_email, license_number, issue_date, expiry_date, location, dealer_category, created_by, created_by_name, created_at, updated_at';

async function fetchDealerRows(category?: DealerCategory) {
  let query = supabase.from('dealers').select(DEALER_COLUMNS);
  if (category) query = query.eq('dealer_category', category);
  const { data, error } = await query.order('dealer_name').limit(600);
  if (!error) return { data, error };
  let legacy = supabase.from('dealers').select(DEALER_COLUMNS_LEGACY);
  if (category) legacy = legacy.eq('dealer_category', category);
  return legacy.order('dealer_name').limit(600);
}

export function DealerManagement({ scopeToCreator = false }: { scopeToCreator?: boolean }) {
  const { isAdminUser, isElevatedOfficerUser, isOfficerUser, officerProfile, user } = useAuth();
  const canManageDealers = (isAdminUser || isOfficerUser) && !isElevatedOfficerUser;
  const restrictToOwn = scopeToCreator && isOfficerUser && !isAdminUser;
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DealerCategory>('fertilizer');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [licenseFilter, setLicenseFilter] = useState<'all' | 'valid' | 'expired'>('all');
  const [loginFilter, setLoginFilter] = useState<'all' | 'with' | 'without'>('all');
  const [districtFilter, setDistrictFilter] = useState<'all' | 'unset' | string>('all');
  const [mandalFilter, setMandalFilter] = useState<'all' | 'unset' | string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [importing, setImporting] = useState(false);
  const [provisioningLogins, setProvisioningLogins] = useState(false);
  const [showLoginSetup, setShowLoginSetup] = useState(false);
  const [loginSetupDealerId, setLoginSetupDealerId] = useState('');
  const [loginPassword, setLoginPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [allDealersForLogin, setAllDealersForLogin] = useState<Dealer[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDealerIds, setSelectedDealerIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('');

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await cachedSupabaseRows<Dealer>(
        `dealers:${user?.id ?? 'anon'}:${activeTab}:${restrictToOwn ? 'mine' : 'all'}:v5`,
        () => fetchDealerRows(activeTab),
        []
      );
      setDealers(restrictToOwn ? rows.filter((d) => d.created_by === user?.id) : rows);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      const { data: fallback } = await fetchDealerRows();
      let filtered = (fallback || []).filter(
        (d) => (d.dealer_category || 'fertilizer') === activeTab
      );
      if (restrictToOwn) filtered = filtered.filter((d) => d.created_by === user?.id);
      setDealers(filtered as Dealer[]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id, restrictToOwn]);

  useEffect(() => {
    void fetchDealers();
  }, [fetchDealers]);

  useEffect(() => {
    setSelectedDealerIds(new Set());
    setCurrentPage(0);
  }, [activeTab]);

  const openLoginSetup = async () => {
    try {
      const data = await cachedSupabaseRows<Dealer>(
        `dealers:login-setup:${user?.id ?? 'admin'}:v5`,
        () => fetchDealerRows(),
        []
      );
      setAllDealersForLogin(data);
      setLoginSetupDealerId('');
      setLoginPassword(DEALER_DEFAULT_PASSWORD);
      setShowLoginSetup(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not load dealers');
    }
  };

  const selectedLoginDealer = allDealersForLogin.find((d) => d.id === loginSetupDealerId);

  const handleSetupSingleDealerLogin = async () => {
    if (!loginSetupDealerId) {
      alert(t('Select a dealer first.', 'ముందు డీలర్‌ను ఎంచుకోండి.'));
      return;
    }
    setProvisioningLogins(true);
    try {
      const result = await provisionDealerLogin(loginSetupDealerId, loginPassword);
      if (!result.ok) {
        alert(result.error || t('Could not set up dealer login.', 'డీలర్ లాగిన్ సెటప్ కాలేదు.'));
        return;
      }
      alert(
        t(
          `Login ready for ${result.dealer_name}.\nPhone (login ID): ${result.phone}\nPassword: ${result.password}`,
          `లాగిన్ సిద్ధం: ${result.dealer_name}.\nఫోన్ (లాగిన్ ID): ${result.phone}\nపాస్వర్డ్: ${result.password}`
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not provision dealer login');
    } finally {
      setProvisioningLogins(false);
    }
  };

  const handleProvisionAllDealerLogins = async () => {
    if (
      !confirm(
        t(
          `Create or reset portal logins for ALL dealers with phone numbers? Password: ${loginPassword}`,
          `ఫోన్ ఉన్న అన్ని డీలర్లకు లాగిన్ సృష్టించాలా/రీసెట్ చేయాలా? పాస్వర్డ్: ${loginPassword}`
        )
      )
    ) {
      return;
    }
    setProvisioningLogins(true);
    try {
      const result = await provisionAllDealerLogins(loginPassword);
      const failNote =
        result.failed > 0
          ? `\n\n${t('Failed', 'విఫలం')}: ${result.failed}`
          : '';
      alert(
        t(
          `Set up: ${result.created}${failNote}`,
          `సెటప్: ${result.created}${failNote}`
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not provision dealer logins');
    } finally {
      setProvisioningLogins(false);
    }
  };

  const buildPayload = () => {
    const isPesticide = activeTab === 'pesticide';
    return {
      ...formData,
      portal_email: dealerEmailFromPhone(formData.phone_number),
      dealer_category: activeTab,
      ifms_id: activeTab === 'fertilizer' ? formData.ifms_id : '',
      expiry_date: isPesticide ? '2099-12-31' : formData.expiry_date,
      created_by: user?.id ?? null,
      created_by_name:
        officerProfile?.full_name ||
        (user?.user_metadata?.full_name as string | undefined) ||
        user?.email ||
        null,
    };
  };

  const handleAdd = async () => {
    const payload = buildPayload();
    const missing = [
      ['dealer_name', t('Dealer name', 'డీలర్ పేరు')],
      ['phone_number', t('Phone number', 'ఫోన్ నంబర్')],
      ['license_number', t('License number', 'లైసెన్స్ నంబర్')],
      ['location', t('Address', 'చిరునామా')],
    ]
      .filter(([key]) => !String(payload[key as keyof typeof payload] ?? '').trim())
      .map(([, label]) => label);
    if (!payload.issue_date) missing.push(t('License issue date', 'లైసెన్స్ జారీ తేదీ'));
    if (activeTab !== 'pesticide' && !payload.expiry_date) {
      missing.push(t('Expiry date', 'గడువు తేదీ'));
    }
    if (missing.length) {
      alert(`${t('Please fill required fields:', 'దయచేసి అవసరమైన వివరాలు పూరించండి:')} ${missing.join(', ')}`);
      return;
    }
    if (!/^\d{10}$/.test(normalizePhone(payload.phone_number))) {
      alert(t('Phone number must be exactly 10 digits.', 'ఫోన్ నంబర్ తప్పనిసరిగా 10 అంకెలు ఉండాలి.'));
      return;
    }
    try {
      const insertPayload = { ...payload } as Record<string, unknown>;
      if (!String(insertPayload.district ?? '').trim()) delete insertPayload.district;
      if (!String(insertPayload.mandal ?? '').trim()) delete insertPayload.mandal;
      const { error } = await supabase.from('dealers').insert([insertPayload]);
      if (error) throw error;
      setShowAddForm(false);
      setFormData(emptyForm);
      void fetchDealers();
    } catch (error) {
      console.error('Error adding dealer:', error);
      alert((error as { message?: string })?.message || 'Failed to add dealer');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const dealer = dealers.find((d) => d.id === id);
      if (!dealer) return;
      if (!/^\d{10}$/.test(normalizePhone(dealer.phone_number))) {
        alert(t('Phone number must be exactly 10 digits.', 'ఫోన్ నంబర్ తప్పనిసరిగా 10 అంకెలు ఉండాలి.'));
        return;
      }
      const payload = {
        ...dealer,
        ifms_id: activeTab === 'fertilizer' ? dealer.ifms_id : '',
        expiry_date: activeTab === 'pesticide' ? '2099-12-31' : dealer.expiry_date,
        dealer_category: activeTab,
      };
      const { error } = await supabase.from('dealers').update(payload).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      void fetchDealers();
    } catch (error) {
      console.error('Error updating dealer:', error);
      alert((error as { message?: string })?.message || 'Failed to update dealer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dealer?')) return;
    try {
      const { error } = await supabase.from('dealers').delete().eq('id', id);
      if (error) throw error;
      void fetchDealers();
    } catch (error) {
      console.error('Error deleting dealer:', error);
      alert((error as { message?: string })?.message || 'Failed to delete dealer');
    }
  };

  const toggleDealerSelect = (id: string) => {
    setSelectedDealerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDeleteDealers = () => {
    if (selectedDealerIds.size === 0) return;
    setBulkDeleteConfirmText('');
    setBulkDeleteConfirmOpen(true);
  };

  const executeBulkDeleteDealers = async () => {
    const ids = [...selectedDealerIds];
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const { error } = await supabase.from('dealers').delete().in('id', ids);
      if (error) throw error;
      setDealers((prev) => prev.filter((d) => !selectedDealerIds.has(d.id)));
      setSelectedDealerIds(new Set());
      setBulkDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting dealers:', error);
      alert((error as { message?: string })?.message || 'Failed to delete dealers');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { parseExcelAndImportDealers } = await import('../../../shared/lib/excelParser');
      const { imported, errors } = await parseExcelAndImportDealers(file, activeTab, {
        created_by: user?.id ?? null,
        created_by_name:
          officerProfile?.full_name ||
          (user?.user_metadata?.full_name as string | undefined) ||
          user?.email ||
          null,
      });
      if (imported > 0) {
        const skippedNote = errors.length
          ? '\n\n' + t('Skipped rows:', 'విఫలమైన వరుసలు:') + '\n' + errors.slice(0, 10).join('\n')
          : '';
        alert(`Imported ${imported} dealers${skippedNote}`);
        void fetchDealers();
      } else if (errors.length) {
        alert(errors.join('\n'));
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExportCsv = () => {
    const tabLabel = TABS.find((tab) => tab.id === activeTab)?.label ?? activeTab;
    downloadCsv(
      `dealers-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Dealer Name', 'IFMS ID', 'Phone', 'Portal Email', 'License Number', 'Issue Date', 'Expiry Date', 'Location', 'District', 'Mandal', 'Category', 'Created By', 'Created On'],
      filteredDealers.map((d) => [
        d.dealer_name,
        d.ifms_id || '',
        d.phone_number || '',
        d.portal_email || '',
        d.license_number || '',
        d.issue_date || '',
        d.expiry_date || '',
        d.location || '',
        normalizeDistrictName(d.district) || '',
        d.mandal || '',
        tabLabel,
        d.created_by_name || '',
        d.created_at ? new Date(d.created_at).toLocaleString() : '',
      ])
    );
  };

  const updateLocalDealer = (id: string, field: string, value: string) => {
    setDealers((prev) =>
      prev.map((dealer) => (dealer.id === id ? { ...dealer, [field]: value } : dealer))
    );
  };

  const filteredDealers = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return dealers.filter((dealer) => {
      // Elevated officer directory: only dealers added by admin (or legacy
      // rows with no creator) — never dealers created by officers.
      if (
        isElevatedOfficerUser &&
        dealer.created_by &&
        dealer.created_by !== ADMIN_USER_ID
      ) {
        return false;
      }
      if (licenseFilter !== 'all') {
        const expiry = String(dealer.expiry_date || '').slice(0, 10);
        const isExpired = Boolean(expiry) && expiry < todayStr;
        if (licenseFilter === 'expired' ? !isExpired : isExpired) return false;
      }
      if (loginFilter !== 'all') {
        const hasLogin = Boolean(String(dealer.portal_email || '').trim());
        if (loginFilter === 'with' ? !hasLogin : hasLogin) return false;
      }
      if (districtFilter !== 'all') {
        const dealerDistrict = normalizeDistrictName(dealer.district);
        if (districtFilter === 'unset' ? Boolean(dealerDistrict) : dealerDistrict !== districtFilter) return false;
      }
      if (mandalFilter !== 'all') {
        const dealerMandal = String(dealer.mandal || '').trim();
        if (mandalFilter === 'unset' ? Boolean(dealerMandal) : dealerMandal !== mandalFilter) return false;
      }
      const term = searchTerm.toLowerCase();
      return (
        dealer.dealer_name.toLowerCase().includes(term) ||
        dealer.location.toLowerCase().includes(term) ||
        dealer.license_number.toLowerCase().includes(term)
      );
    });
  }, [dealers, searchTerm, licenseFilter, loginFilter, districtFilter, mandalFilter, isElevatedOfficerUser]);

  const mandalFilterOptions = useMemo(() => {
    if (districtFilter !== 'all' && districtFilter !== 'unset') {
      return getMandalsForDistrict(districtFilter);
    }
    return Array.from(new Set(dealers.map((d) => String(d.mandal || '').trim()).filter(Boolean))).sort();
  }, [dealers, districtFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredDealers.length / DEALERS_PAGE_SIZE));
  const paginatedDealers = filteredDealers.slice(
    currentPage * DEALERS_PAGE_SIZE,
    currentPage * DEALERS_PAGE_SIZE + DEALERS_PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, searchTerm, licenseFilter, loginFilter, districtFilter, mandalFilter]);

  const showIfms = activeTab === 'fertilizer';
  const validityLabel =
    activeTab === 'pesticide' ? t('Validity', 'చెల్లుబాటు') : t('Valid Until', 'చెల్లుబాటు తేదీ');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
              <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="hidden h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700 sm:block" />
              <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700 md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('Dealers Directory', 'డీలర్ల డైరెక్టరీ')}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {t('Fertilizer, seed, and pesticide dealers', 'ఎరువులు, విత్తనాలు, పురుగుమందుల డీలర్లు')}
          </p>
        </div>
        {canManageDealers && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60">
              <Upload className="h-4 w-4" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelImport}
                disabled={importing}
              />
              {importing ? t('Importing...', 'దిగుమతి...') : t('Import Excel', 'Excel దిగుమతి')}
            </label>
            <a
              href={`/templates/dealer-import-template-${activeTab}.xlsx`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
            >
              <Download className="h-4 w-4" />
              {t('Template', 'టెంప్లేట్')}
            </a>
            {isAdminUser && (
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredDealers.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <Download className="h-4 w-4" />
                {t('Export CSV', 'CSV ఎగుమతి')}
              </button>
            )}
            {isAdminUser && (
              <button
                type="button"
                onClick={openLoginSetup}
                disabled={provisioningLogins}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                <KeyRound className="h-4 w-4" />
                {provisioningLogins ? t('Setting up…', 'సెటప్…') : t('Setup dealer login', 'డీలర్ లాగిన్')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...emptyForm,
                  district: normalizeDistrictName(officerProfile?.district) || '',
                  mandal: officerProfile?.mandal || '',
                });
                setShowAddForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Plus className="h-4 w-4" />
              {t('Add Dealer', 'డీలర్ జోడించండి')}
            </button>
          </div>
        )}
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setEditingId(null);
            }}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {t(tab.label, tab.telugu)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('Search dealers...', 'డీలర్లు వెతకండి...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </div>
        <select
          value={licenseFilter}
          onChange={(e) => setLicenseFilter(e.target.value as typeof licenseFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">{t('All Licenses', 'అన్ని లైసెన్స్‌లు')}</option>
          <option value="valid">{t('Valid', 'చెల్లుబాటు')}</option>
          <option value="expired">{t('Expired', 'గడువు ముగిసినవి')}</option>
        </select>
        <select
          value={loginFilter}
          onChange={(e) => setLoginFilter(e.target.value as typeof loginFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">{t('All Logins', 'అన్ని లాగిన్‌లు')}</option>
          <option value="with">{t('Portal Login Set', 'పోర్టల్ లాగిన్ ఉన్నవి')}</option>
          <option value="without">{t('No Portal Login', 'పోర్టల్ లాగిన్ లేనివి')}</option>
        </select>
        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setMandalFilter('all');
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">{t('All Districts', 'అన్ని జిల్లా.')}</option>
          <option value="unset">{t('District Not Set', 'జిల్లా లేదు')}</option>
          {TELANGANA_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={mandalFilter}
          onChange={(e) => setMandalFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">{t('All Mandals', 'అన్ని మండలాలు.')}</option>
          <option value="unset">{t('Mandal Not Set', 'మండలం లేదు')}</option>
          {mandalFilterOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {(licenseFilter !== 'all' || loginFilter !== 'all' || districtFilter !== 'all' || mandalFilter !== 'all') && (
          <button
            type="button"
            onClick={() => { setLicenseFilter('all'); setLoginFilter('all'); setDistrictFilter('all'); setMandalFilter('all'); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {t('Clear', 'క్లియర్')}
          </button>
        )}
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          {filteredDealers.length} {t('dealers', 'డీలర్లు')}
        </span>
      </div>

      {showLoginSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('Setup dealer portal login', 'డీలర్ పోర్టల్ లాగిన్ సెటప్')}
              </h2>
              <button
                type="button"
                onClick={() => setShowLoginSetup(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">
                  {t('Select dealer', 'డీలర్ ఎంచుకోండి')}
                </label>
                <select
                  value={loginSetupDealerId}
                  onChange={(e) => setLoginSetupDealerId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">{t('— Choose dealer —', '— డీలర్ ఎంచుకోండి —')}</option>
                  {allDealersForLogin.map((dealer) => {
                    const digits = normalizePhone(dealer.phone_number || '');
                    const hasPhone = digits.length >= 10;
                    return (
                      <option key={dealer.id} value={dealer.id} disabled={!hasPhone}>
                        {dealer.dealer_name} ({dealer.location || dealer.dealer_category}) —{' '}
                        {hasPhone ? digits : t('add phone first', 'ముందు ఫోన్ జోడించండి')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">
                  {t('Login ID (phone number)', 'లాగిన్ ID (ఫోన్ నంబర్)')}
                </label>
                <input
                  type="text"
                  readOnly
                  value={selectedLoginDealer ? normalizePhone(selectedLoginDealer.phone_number) : ''}
                  placeholder={t('Select a dealer to see phone', 'ఫోన్ చూడడానికి డీలర్ ఎంచుకోండి')}
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-800 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-slate-300">
                  {t('Password', 'పాస్వర్డ్')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginPassword(DEALER_DEFAULT_PASSWORD)}
                    className="shrink-0 rounded-lg border border-amber-400 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200"
                  >
                    {t('Reset', 'రీసెట్')}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('Recommended password:', 'సిఫారసు పాస్వర్డ్:')} <strong>{DEALER_DEFAULT_PASSWORD}</strong>
                </p>
              </div>

              {selectedLoginDealer && (
                <div className="space-y-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <p>
                    {t('Portal email (internal):', 'పోర్టల్ ఇమెయిల్:')}{' '}
                    <span className="font-mono font-bold">
                      {selectedLoginDealer.portal_email ||
                        dealerEmailFromPhone(selectedLoginDealer.phone_number)}
                    </span>
                  </p>
                  <p>
                    {t(
                      'Dealer signs in on the login page (Dealer tab) with phone as ID and the password above.',
                      'లాగిన్ పేజీ డీలర్ ట్యాబ్‌లో ఫోన్ ID + పాస్వర్డ్ తో లాగిన్ అవుతారు.'
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowLoginSetup(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                type="button"
                onClick={handleSetupSingleDealerLogin}
                disabled={provisioningLogins || !loginSetupDealerId}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {provisioningLogins ? t('Setting up…', 'సెటప్…') : t('Setup selected', 'ఎంచుకున్నది సెటప్')}
              </button>
              <button
                type="button"
                onClick={handleProvisionAllDealerLogins}
                disabled={provisioningLogins}
                className="flex-1 rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-50 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-950/30"
              >
                {t('Setup all dealers', 'అందరికీ సెటప్')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('Add New Dealer', 'కొత్త డీలర్')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('Category', 'వర్గం')}: {t(activeTab === 'pesticide' ? 'Pesticides' : activeTab === 'seed' ? 'Seed' : 'Fertilizer', activeTab === 'pesticide' ? 'పురుగుమందులు' : activeTab === 'seed' ? 'విత్తనాలు' : 'ఎరువులు')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <FormFields
                formData={formData}
                setFormData={setFormData}
                showIfms={showIfms}
                activeTab={activeTab}
                t={t}
              />
            </div>
            <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                {t('Add Dealer', 'జోడించండి')}
              </button>
            </div>
          </div>
        </div>
      )}

      {canManageDealers && selectedDealerIds.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/30">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            {selectedDealerIds.size} {t('selected', 'ఎంచుకోబడ్డాయి')}
          </span>
          <button
            type="button"
            onClick={handleBulkDeleteDealers}
            disabled={bulkDeleting}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            {bulkDeleting ? '...' : t('Delete Selected', 'ఎంచుకున్నవి తొలగించండి')}
          </button>
          <button
            type="button"
            onClick={() => setSelectedDealerIds(new Set())}
            disabled={bulkDeleting}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {t('Clear', 'క్లియర్')}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
        <div className="table-scroll">
          <table className="w-full min-w-[1020px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800/60">
                {canManageDealers && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={paginatedDealers.length > 0 && paginatedDealers.every((d) => selectedDealerIds.has(d.id))}
                      onChange={() => {
                        setSelectedDealerIds((prev) => {
                          const next = new Set(prev);
                          const allChecked = paginatedDealers.every((d) => next.has(d.id));
                          paginatedDealers.forEach((d) => (allChecked ? next.delete(d.id) : next.add(d.id)));
                          return next;
                        });
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      aria-label={t('Select all dealers on this page', 'ఈ పేజీలోని అన్ని డీలర్లను ఎంచుకోండి')}
                    />
                  </th>
                )}
                <th className="w-12 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  #
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Dealer Name', 'పేరు')}
                </th>
                {showIfms && (
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    IFMS ID
                  </th>
                )}
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Phone', 'ఫోన్')}
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('License', 'లైసెన్స్')}
                </th>
                {activeTab === 'pesticide' && (
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('Issue Date', 'జారీ తేదీ')}
                  </th>
                )}
                {activeTab !== 'pesticide' && (
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {validityLabel}
                  </th>
                )}
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Address', 'చిరునామా')}
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Mandal / District', 'మండలం / జిల్లా')}
                </th>
                {canManageDealers && (
                  <th className="w-24 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('Actions', 'చర్యలు')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedDealers.map((dealer, index) => (
                <tr
                  key={dealer.id}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    editingId === dealer.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {canManageDealers && (
                    <td className="px-4 py-3 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedDealerIds.has(dealer.id)}
                        onChange={() => toggleDealerSelect(dealer.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        aria-label={t('Select dealer', 'డీలర్‌ను ఎంచుకోండి')}
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                    {currentPage * DEALERS_PAGE_SIZE + index + 1}
                  </td>
                  {editingId === dealer.id ? (
                    <EditRow
                      dealer={dealer}
                      showIfms={showIfms}
                      activeTab={activeTab}
                      canManage={canManageDealers}
                      onUpdate={() => handleUpdate(dealer.id)}
                      onCancel={() => setEditingId(null)}
                      updateLocalDealer={updateLocalDealer}
                    />
                  ) : (
                    <DisplayRow
                      dealer={dealer}
                      showIfms={showIfms}
                      activeTab={activeTab}
                      canManage={canManageDealers}
                      canDelete={canManageDealers}
                      onEdit={() => setEditingId(dealer.id)}
                      onDelete={() => handleDelete(dealer.id)}
                    />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredDealers.length === 0 && (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {searchTerm
                ? t('No dealers match your search', 'మీ శోధనకు డీలర్లు కనుగొనబడలేదు')
                : t('No dealers found', 'డీలర్లు లేరు')}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {searchTerm
                ? t('Try a different name, phone, or license number', 'వేరే పేరు, ఫోన్ లేదా లైసెన్స్ నంబర్ ప్రయత్నించండి')
                : canManageDealers
                  ? t('Add a dealer or import from Excel', 'డీలర్ జోడించండి లేదా Excel నుండి దిగుమతి చేయండి')
                  : ''}
            </p>
          </div>
        )}
        {filteredDealers.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageCount={pageCount}
            total={filteredDealers.length}
            pageSize={DEALERS_PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {bulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/40 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('Delete Dealers', 'డీలర్లను తొలగించండి')}
              </h3>
            </div>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              {t(
                `You are about to permanently delete ${selectedDealerIds.size} dealer(s).`,
                `${selectedDealerIds.size} డీలర్లను శాశ్వతంగా తొలగించబోతున్నారు.`
              )}
            </p>
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              {t(
                'This action cannot be reversed. Dealer stock records and portal logins may be affected.',
                'ఈ చర్యను రద్దు చేయలేము. డీలర్ స్టాక్ రికార్డులు మరియు పోర్టల్ లాగిన్‌లు ప్రభావితమవుతాయి.'
              )}
            </p>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-200">
                {t('Type', 'టైప్ చేయండి')}{' '}
                <span className="font-semibold text-red-600 dark:text-red-400">DELETE</span>{' '}
                {t('to confirm:', 'నిర్ధారించడానికి:')}
              </label>
              <input
                type="text"
                value={bulkDeleteConfirmText}
                onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                placeholder={t('Type DELETE to confirm', 'నిర్ధారించడానికి DELETE టైప్ చేయండి')}
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-red-500 focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmOpen(false)}
                disabled={bulkDeleting}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-50 dark:text-slate-300 dark:hover:text-white"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                type="button"
                onClick={executeBulkDeleteDealers}
                disabled={bulkDeleting || bulkDeleteConfirmText.trim().toLowerCase() !== 'delete'}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {bulkDeleting ? t('Deleting...', 'తొలగిస్తోంది...') : t('Delete Permanently', 'శాశ్వతంగా తొలగించండి')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TablePagination({
  currentPage,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useLanguage();
  const from = currentPage * pageSize + 1;
  const to = Math.min(total, (currentPage + 1) * pageSize);
  const btn =
    'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800';
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <span className="tabular-nums">
        {t('Showing', 'చూపిస్తోంది')} {from}–{to} {t('of', 'ఇందులో')} {total}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className={btn}>
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('Previous', 'మునుపటి')}
        </button>
        <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-300">
          {currentPage + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
          disabled={currentPage >= pageCount - 1}
          className={btn}
        >
          {t('Next', 'తదుపరి')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function FormFields({
  formData,
  setFormData,
  showIfms,
  activeTab,
  t,
}: {
  formData: typeof emptyForm;
  setFormData: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  showIfms: boolean;
  activeTab: DealerCategory;
  t: (en: string, te: string) => string;
}) {
  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40';
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelCls}>
          {t('Dealer Name', 'పేరు')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.dealer_name}
          onChange={(e) => setFormData({ ...formData, dealer_name: e.target.value })}
          className={inputCls}
        />
      </div>
      {showIfms && (
        <div>
          <label className={labelCls}>IFMS ID</label>
          <input
            type="text"
            value={formData.ifms_id}
            onChange={(e) => setFormData({ ...formData, ifms_id: e.target.value })}
            className={inputCls}
          />
        </div>
      )}
      <div>
        <label className={labelCls}>
          {t('Phone', 'ఫోన్')} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]{10}"
          maxLength={10}
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          placeholder="9876543210"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>
          {t('License Number', 'లైసెన్స్')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.license_number}
          onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>
          {t('License Issue Date', 'లైసెన్స్ జారీ తేదీ')} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.issue_date}
          onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
          className={inputCls}
        />
      </div>
      {activeTab !== 'pesticide' && (
        <div>
          <label className={labelCls}>
            {t('Expiry Date', 'గడువు')} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            className={inputCls}
          />
        </div>
      )}
      {activeTab === 'pesticide' && (
        <div className="flex items-end">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            {t('Validity: Permanent', 'చెల్లుబాటు: శాశ్వతం')}
          </p>
        </div>
      )}
      <div>
        <label className={labelCls}>{t('District', 'జిల్లా')}</label>
        <select
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value, mandal: '' })}
          className={inputCls}
        >
          <option value="">{t('— Select district —', '— జిల్లా ఎంచుకోండి —')}</option>
          {TELANGANA_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>{t('Mandal', 'మండలం')}</label>
        <select
          value={formData.mandal}
          onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
          disabled={!formData.district}
          className={`${inputCls} disabled:opacity-60`}
        >
          <option value="">{t('— Select mandal —', '— మండలం ఎంచుకోండి —')}</option>
          {getMandalsForDistrict(formData.district).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>
          {t('Address', 'చిరునామా')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className={inputCls}
        />
      </div>
    </div>
  );
}

function DisplayRow({
  dealer,
  showIfms,
  activeTab,
  canManage,
  canDelete,
  onEdit,
  onDelete,
}: {
  dealer: Dealer;
  showIfms: boolean;
  activeTab: DealerCategory;
  canManage: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const isPermanent = activeTab === 'pesticide';
  const initials = dealer.dealer_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  const validityDate = dealer.expiry_date ? new Date(dealer.expiry_date) : null;
  const isExpiringSoon =
    validityDate && validityDate > new Date() && validityDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;
  const cellCls = 'px-4 py-3 align-middle';
  return (
    <>
      <td className={cellCls}>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            {initials || '?'}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900 dark:text-white">{dealer.dealer_name}</div>
            {(() => {
              // Admin-added dealers: explicit admin uid, or legacy/imported
              // rows with no creator (only admin/officer accounts can insert).
              const isAdminCreated = !dealer.created_by || dealer.created_by === ADMIN_USER_ID;
              const addedBy =
                dealer.created_by_name ||
                (isAdminCreated ? 'K. Vinay Reddy' : null);
              return addedBy ? (
                <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                  {t('Added by', 'కలిపినవారు')}: {addedBy}
                </div>
              ) : null;
            })()}
          </div>
        </div>
      </td>
      {showIfms && <td className={`${cellCls} font-mono text-xs text-slate-600 dark:text-slate-400`}>{dealer.ifms_id || '—'}</td>}
      <td className={`${cellCls} font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400`}>{dealer.phone_number}</td>
      <td className={`${cellCls} font-mono text-xs text-slate-600 dark:text-slate-400`}>{dealer.license_number}</td>
      {isPermanent && (
        <td className={`${cellCls} text-xs tabular-nums text-slate-600 dark:text-slate-400`}>
          {dealer.issue_date ? new Date(dealer.issue_date).toLocaleDateString() : '—'}
        </td>
      )}
      {!isPermanent && (
        <td className={cellCls}>
          {validityDate ? (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                validityDate > new Date()
                  ? isExpiringSoon
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {validityDate.toLocaleDateString()}
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      )}
      <td className={`${cellCls} max-w-[220px] truncate text-slate-600 dark:text-slate-400`} title={dealer.location}>
        {dealer.location}
      </td>
      <td className={`${cellCls} max-w-[180px] truncate text-xs text-slate-600 dark:text-slate-400`}>
        {[dealer.mandal, normalizeDistrictName(dealer.district)].filter(Boolean).join(', ') || '—'}
      </td>
      {canManage && (
        <td className={`${cellCls} text-right`}>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={onEdit}
              title={t('Edit dealer', 'డీలర్ సవరించండి')}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                title={t('Delete dealer', 'డీలర్ తొలగించండి')}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      )}
    </>
  );
}

function EditRow({
  dealer,
  showIfms,
  activeTab,
  canManage,
  onUpdate,
  onCancel,
  updateLocalDealer,
}: {
  dealer: Dealer;
  showIfms: boolean;
  activeTab: DealerCategory;
  canManage: boolean;
  onUpdate: () => void;
  onCancel: () => void;
  updateLocalDealer: (id: string, field: string, value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <td className="px-4 py-3 align-middle">
        <input
          type="text"
          value={dealer.dealer_name}
          onChange={(e) => updateLocalDealer(dealer.id, 'dealer_name', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      {showIfms && (
        <td className="px-4 py-3 align-middle">
          <input
            type="text"
            value={dealer.ifms_id}
            onChange={(e) => updateLocalDealer(dealer.id, 'ifms_id', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </td>
      )}
      <td className="px-4 py-3 align-middle">
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={dealer.phone_number}
          onChange={(e) => updateLocalDealer(dealer.id, 'phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      <td className="px-4 py-3 align-middle">
        <input
          type="text"
          value={dealer.license_number}
          onChange={(e) => updateLocalDealer(dealer.id, 'license_number', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      {activeTab === 'pesticide' && (
        <td className="px-4 py-3 align-middle">
          <input
            type="date"
            value={dealer.issue_date}
            onChange={(e) => updateLocalDealer(dealer.id, 'issue_date', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </td>
      )}
      {activeTab !== 'pesticide' && (
        <td className="px-4 py-3 align-middle">
          <input
            type="date"
            value={dealer.expiry_date}
            onChange={(e) => updateLocalDealer(dealer.id, 'expiry_date', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </td>
      )}
      <td className="px-4 py-3 align-middle">
        <input
          type="text"
          value={dealer.location}
          onChange={(e) => updateLocalDealer(dealer.id, 'location', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={normalizeDistrictName(dealer.district)}
            onChange={(e) => {
              updateLocalDealer(dealer.id, 'district', e.target.value);
              updateLocalDealer(dealer.id, 'mandal', '');
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t('District', 'జిల్లా')}</option>
            {TELANGANA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={dealer.mandal || ''}
            onChange={(e) => updateLocalDealer(dealer.id, 'mandal', e.target.value)}
            disabled={!normalizeDistrictName(dealer.district)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t('Mandal', 'మండలం')}</option>
            {getMandalsForDistrict(normalizeDistrictName(dealer.district)).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </td>
      {canManage && (
        <td className="px-4 py-3 align-middle">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onUpdate}
              title="Save"
              className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-900/30"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              title="Cancel"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      )}
    </>
  );
}
