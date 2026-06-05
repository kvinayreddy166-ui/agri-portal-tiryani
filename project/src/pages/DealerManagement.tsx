import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Save, X, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Dealer } from '../types/database';
import { parseExcelAndImportDealers } from '../lib/excelParser';
import { provisionAllDealerLogins, provisionDealerLogin } from '../lib/provisionDealerLogins';
import { dealerEmailFromPhone, DEALER_DEFAULT_PASSWORD, normalizePhone } from '../lib/dealerAuth';

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
};
const DEALERS_PAGE_SIZE = 25;

export function DealerManagement() {
  const { isAdminUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DealerCategory>('fertilizer');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('dealer_category', activeTab)
        .order('dealer_name');

      if (error) throw error;
      setDealers(data || []);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      const { data: fallback } = await supabase.from('dealers').select('*').order('dealer_name');
      const filtered = (fallback || []).filter(
        (d) => (d.dealer_category || 'fertilizer') === activeTab
      );
      setDealers(filtered as Dealer[]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchDealers();
  }, [fetchDealers]);

  const openLoginSetup = async () => {
    try {
      const { data, error } = await supabase.from('dealers').select('*').order('dealer_name');
      if (error) throw error;
      setAllDealersForLogin((data || []) as Dealer[]);
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
    };
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase.from('dealers').insert([buildPayload()]);
      if (error) throw error;
      setShowAddForm(false);
      setFormData(emptyForm);
      void fetchDealers();
    } catch (error) {
      console.error('Error adding dealer:', error);
      alert('Failed to add dealer');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const dealer = dealers.find((d) => d.id === id);
      if (!dealer) return;
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
      alert('Failed to update dealer');
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
      alert('Failed to delete dealer');
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const { imported, errors } = await parseExcelAndImportDealers(file, activeTab);
      if (imported > 0) {
        alert(`Imported ${imported} dealers`);
        void fetchDealers();
      } else if (errors.length) {
        alert(errors.join('\n'));
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const updateLocalDealer = (id: string, field: string, value: string) => {
    setDealers((prev) =>
      prev.map((dealer) => (dealer.id === id ? { ...dealer, [field]: value } : dealer))
    );
  };

  const filteredDealers = useMemo(
    () =>
      dealers.filter(
        (dealer) =>
          dealer.dealer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dealer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dealer.license_number.toLowerCase().includes(searchTerm.toLowerCase())
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

  const showIfms = activeTab === 'fertilizer';
  const validityLabel =
    activeTab === 'pesticide' ? t('Validity', 'చెల్లుబాటు') : t('Valid Until', 'చెల్లుబాటు తేదీ');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('Dealers Directory', 'డీలర్ల డైరెక్టరీ')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {t('Fertilizer, seed, and pesticide dealers', 'ఎరువులు, విత్తనాలు, పురుగుమందుల డీలర్లు')}
          </p>
        </div>
        {isAdminUser && (
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:border-emerald-700 dark:text-emerald-300">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelImport}
                disabled={importing}
              />
              {importing ? t('Importing...', 'దిగుమతి...') : t('Import Excel', 'Excel దిగుమతి')}
            </label>
            <button
              type="button"
              onClick={openLoginSetup}
              disabled={provisioningLogins}
              className="inline-flex items-center gap-2 rounded-md border border-amber-400 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-60 dark:text-amber-200 dark:hover:bg-amber-950/30"
            >
              <KeyRound className="h-4 w-4" />
              {provisioningLogins ? t('Setting up…', 'సెటప్…') : t('Setup dealer login', 'డీలర్ లాగిన్')}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              {t('Add Dealer', 'డీలర్ జోడించండి')}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setEditingId(null);
            }}
            className={`rounded-t-md px-3 py-1.5 text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t(tab.label, tab.telugu)}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t('Search dealers...', 'డీలర్లు వెతకండి...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {showLoginSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-900 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('Setup dealer portal login', 'డీలర్ పోర్టల్ లాగిన్ సెటప్')}
              </h2>
              <button
                type="button"
                onClick={() => setShowLoginSetup(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
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

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowLoginSetup(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700 dark:border-slate-600 dark:text-slate-300"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                type="button"
                onClick={handleSetupSingleDealerLogin}
                disabled={provisioningLogins || !loginSetupDealerId}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {provisioningLogins ? t('Setting up…', 'సెటప్…') : t('Setup selected', 'ఎంచుకున్నది సెటప్')}
              </button>
              <button
                type="button"
                onClick={handleProvisionAllDealerLogins}
                disabled={provisioningLogins}
                className="flex-1 rounded-lg border border-amber-500 px-4 py-2 font-bold text-amber-900 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-200 dark:hover:bg-amber-950/30"
              >
                {t('Setup all dealers', 'అందరికీ సెటప్')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-xl bg-white p-6 dark:bg-slate-900">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('Add New Dealer', 'కొత్త డీలర్')}
            </h2>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              <FormFields
                formData={formData}
                setFormData={setFormData}
                showIfms={showIfms}
                activeTab={activeTab}
                t={t}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 dark:border-slate-600 dark:text-slate-300"
              >
                {t('Cancel', 'రద్దు')}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                {t('Add Dealer', 'జోడించండి')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800">
              <tr>
                <th className="w-14 px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                  S.No.
                </th>
                <th className="px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                  {t('Dealer Name', 'పేరు')}
                </th>
                {showIfms && (
                  <th className="px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                    IFMS ID
                  </th>
                )}
                <th className="px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                  {t('Phone', 'ఫోన్')}
                </th>
                <th className="px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                  {t('License', 'లైసెన్స్')}
                </th>
                <th className="px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                  {validityLabel}
                </th>
                <th className="px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                  {t('Location', 'స్థానం')}
                </th>
                {isAdminUser && (
                  <th className="w-20 px-2.5 py-2 text-left text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                    {t('Actions', 'చర్యలు')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {paginatedDealers.map((dealer, index) => (
                <tr key={dealer.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-2.5 py-1.5 text-xs font-bold text-gray-600 dark:text-slate-400">{currentPage * DEALERS_PAGE_SIZE + index + 1}</td>
                  {editingId === dealer.id ? (
                    <EditRow
                      dealer={dealer}
                      showIfms={showIfms}
                      activeTab={activeTab}
                      isAdminUser={isAdminUser}
                      onUpdate={() => handleUpdate(dealer.id)}
                      onCancel={() => setEditingId(null)}
                      updateLocalDealer={updateLocalDealer}
                    />
                  ) : (
                    <DisplayRow
                      dealer={dealer}
                      showIfms={showIfms}
                      activeTab={activeTab}
                      isAdminUser={isAdminUser}
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
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">{t('No dealers found', 'డీలర్లు లేరు')}</p>
          </div>
        )}
        {filteredDealers.length > DEALERS_PAGE_SIZE && (
          <TablePagination
            currentPage={currentPage}
            pageCount={pageCount}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}

function TablePagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:text-slate-300">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
      >
        Previous
      </button>
      <span className="uppercase tracking-wide">
        Page {currentPage + 1} / {pageCount}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
        disabled={currentPage >= pageCount - 1}
        className="rounded-md border border-slate-200 px-2.5 py-1.5 disabled:opacity-50 dark:border-slate-700"
      >
        Next
      </button>
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
  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('Dealer Name', 'పేరు')}
        </label>
        <input
          type="text"
          value={formData.dealer_name}
          onChange={(e) => setFormData({ ...formData, dealer_name: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      {showIfms && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">IFMS ID</label>
          <input
            type="text"
            value={formData.ifms_id}
            onChange={(e) => setFormData({ ...formData, ifms_id: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('Phone', 'ఫోన్')}
        </label>
        <input
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('License Number', 'లైసెన్స్')}
        </label>
        <input
          type="text"
          value={formData.license_number}
          onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
      {activeTab !== 'pesticide' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              {t('Issue Date', 'జారీ తేదీ')}
            </label>
            <input
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              {t('Expiry Date', 'గడువు')}
            </label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
      )}
      {activeTab === 'pesticide' && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {t('Validity: Permanent', 'చెల్లుబాటు: శాశ్వతం')}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          {t('Location', 'స్థానం')}
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>
    </>
  );
}

function DisplayRow({
  dealer,
  showIfms,
  activeTab,
  isAdminUser,
  onEdit,
  onDelete,
}: {
  dealer: Dealer;
  showIfms: boolean;
  activeTab: DealerCategory;
  isAdminUser: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPermanent = activeTab === 'pesticide';
  return (
    <>
      <td className="px-2.5 py-1.5 font-semibold text-gray-900 dark:text-white">{dealer.dealer_name}</td>
      {showIfms && <td className="px-2.5 py-1.5 text-gray-600 dark:text-slate-400">{dealer.ifms_id}</td>}
      <td className="px-2.5 py-1.5 text-gray-600 dark:text-slate-400">{dealer.phone_number}</td>
      <td className="px-2.5 py-1.5 text-gray-600 dark:text-slate-400">{dealer.license_number}</td>
      <td className="px-2.5 py-1.5">
        {isPermanent ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            Permanent
          </span>
        ) : (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${
              new Date(dealer.expiry_date) > new Date()
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {new Date(dealer.expiry_date).toLocaleDateString()}
          </span>
        )}
      </td>
      <td className="px-2.5 py-1.5 text-gray-600 dark:text-slate-400">{dealer.location}</td>
      {isAdminUser && (
        <td className="px-2.5 py-1.5">
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} className="rounded p-1 text-emerald-600 hover:bg-emerald-50">
              <Edit2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onDelete} className="rounded p-1 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </button>
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
  isAdminUser,
  onUpdate,
  onCancel,
  updateLocalDealer,
}: {
  dealer: Dealer;
  showIfms: boolean;
  activeTab: DealerCategory;
  isAdminUser: boolean;
  onUpdate: () => void;
  onCancel: () => void;
  updateLocalDealer: (id: string, field: string, value: string) => void;
}) {
  return (
    <>
      <td className="px-2.5 py-1.5">
        <input
          type="text"
          value={dealer.dealer_name}
          onChange={(e) => updateLocalDealer(dealer.id, 'dealer_name', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
        />
      </td>
      {showIfms && (
        <td className="px-2.5 py-1.5">
          <input
            type="text"
            value={dealer.ifms_id}
            onChange={(e) => updateLocalDealer(dealer.id, 'ifms_id', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
          />
        </td>
      )}
      <td className="px-2.5 py-1.5">
        <input
          type="tel"
          value={dealer.phone_number}
          onChange={(e) => updateLocalDealer(dealer.id, 'phone_number', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
        />
      </td>
      <td className="px-2.5 py-1.5">
        <input
          type="text"
          value={dealer.license_number}
          onChange={(e) => updateLocalDealer(dealer.id, 'license_number', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
        />
      </td>
      <td className="px-2.5 py-1.5">
        {activeTab === 'pesticide' ? (
          <span className="text-xs font-bold text-emerald-700">Permanent</span>
        ) : (
          <input
            type="date"
            value={dealer.expiry_date}
            onChange={(e) => updateLocalDealer(dealer.id, 'expiry_date', e.target.value)}
            className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
          />
        )}
      </td>
      <td className="px-2.5 py-1.5">
        <input
          type="text"
          value={dealer.location}
          onChange={(e) => updateLocalDealer(dealer.id, 'location', e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
        />
      </td>
      {isAdminUser && (
        <td className="px-2.5 py-1.5">
          <div className="flex gap-1">
            <button type="button" onClick={onUpdate} className="rounded p-1 text-emerald-600">
              <Save className="h-4 w-4" />
            </button>
            <button type="button" onClick={onCancel} className="rounded p-1 text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      )}
    </>
  );
}
