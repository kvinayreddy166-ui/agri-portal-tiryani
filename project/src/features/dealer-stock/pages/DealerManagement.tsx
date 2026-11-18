import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Save, X, KeyRound, Upload, Download, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { supabase, ADMIN_USER_ID } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { Dealer } from '../../../shared/types/database';
import { provisionAllDealerLogins, provisionDealerLogin } from '../../auth/lib/provisionDealerLogins';
import { dealerEmailFromPhone, DEALER_DEFAULT_PASSWORD, normalizePhone } from '../../auth/lib/dealerAuth';
import { cachedSupabaseRows } from '../../../shared/lib/offlineCache';
import { fetchAllRows } from '../../../shared/lib/pagedFetch';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { useConfirmDialog } from '../../../shared/components/ui/useConfirmDialog';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
  normalizeDistrictName,
} from '../../../shared/data/telanganaDistrictMandalData';
import { usePersistentState } from '../../../shared/hooks/usePersistentState';
import { useIdleAutoClose } from '../../../shared/hooks/useIdleAutoClose';

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

const formatDealerDate = (value?: string | null) => {
  const m = String(value ?? '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};
const DEALER_COLUMNS =
  'id, dealer_name, ifms_id, phone_number, portal_email, license_number, issue_date, expiry_date, location, district, mandal, dealer_category, created_by, created_by_name, created_at, updated_at';
// Fallback for databases where the district/mandal migration hasn't been applied yet.
const DEALER_COLUMNS_LEGACY =
  'id, dealer_name, ifms_id, phone_number, portal_email, license_number, issue_date, expiry_date, location, dealer_category, created_by, created_by_name, created_at, updated_at';

async function fetchDealerRows(category?: DealerCategory) {
  const fetchAll = (columns: string) =>
    fetchAllRows<Dealer>({
      table: 'dealers',
      columns,
      order: [{ column: 'dealer_name' }, { column: 'id' }],
      applyFilters: category ? (q) => q.eq('dealer_category', category) : undefined,
    });
  const primary = await fetchAll(DEALER_COLUMNS);
  if (!primary.error) return { data: primary.data, error: null };
  const fallback = await fetchAll(DEALER_COLUMNS_LEGACY);
  return { data: fallback.data, error: fallback.error };
}

export function DealerManagement({ scopeToCreator = false }: { scopeToCreator?: boolean }) {
  const { isAdminUser, isElevatedOfficerUser, isOfficerUser, officerProfile, user } = useAuth();
  const canManageDealers = (isAdminUser || isOfficerUser) && !isElevatedOfficerUser;
  // Officers (including the elevated officer directory view) may edit dealer
  // details and delete entries — but never the mandal/district jurisdiction.
  const canEditDealers = isAdminUser || isOfficerUser || isElevatedOfficerUser;
  const restrictToOwn = scopeToCreator && isOfficerUser && !isAdminUser;
  const { t } = useLanguage();
  const toast = useToast();
  // useToast returns a fresh object each render; keep a ref so callbacks that
  // depend on it don't retrigger effects in an infinite fetch loop.
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { askConfirm, confirmDialog } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<DealerCategory>('fertilizer');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchTerm, setSearchTerm] = usePersistentState('tiryani-page-filters-dealer-management-search', '');
  const [licenseFilter, setLicenseFilter] = usePersistentState<'all' | 'valid' | 'expired'>('tiryani-page-filters-dealer-management-license', 'all');
  const [loginFilter, setLoginFilter] = usePersistentState<'all' | 'with' | 'without'>('tiryani-page-filters-dealer-management-login', 'all');
  const [districtFilter, setDistrictFilter] = usePersistentState('tiryani-page-filters-dealer-management-district', 'all');
  const [mandalFilter, setMandalFilter] = usePersistentState('tiryani-page-filters-dealer-management-mandal', 'all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [provisioningLogins, setProvisioningLogins] = useState(false);
  const [showLoginSetup, setShowLoginSetup] = useState(false);
  const [loginSetupDealerId, setLoginSetupDealerId] = useState('');
  const [loginPassword, setLoginPassword] = useState(DEALER_DEFAULT_PASSWORD);
  const [allDealersForLogin, setAllDealersForLogin] = useState<Dealer[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [locationRows, setLocationRows] = useState<{ district: string; mandal: string }[]>([]);
  const [selectedDealerIds, setSelectedDealerIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('');
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dataMenuRef = useRef<HTMLDivElement>(null);
  const resetDataMenuIdle = useIdleAutoClose(dataMenuOpen, () => setDataMenuOpen(false));

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    if (!dataMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target as Node)) {
        setDataMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDataMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dataMenuOpen]);

  // Applies every active filter to a dealers query. `withLocation` is false
  // for the legacy-column fallback where district/mandal don't exist.
  const applyDealerFilters = useCallback(
    (query: any, withLocation = true) => {
      let q = query.eq('dealer_category', activeTab);
      if (restrictToOwn && user?.id) q = q.eq('created_by', user.id);
      if (isElevatedOfficerUser) {
        q = q.or(`created_by.is.null,created_by.eq.${ADMIN_USER_ID}`);
      }
      if (withLocation && isAdminUser) {
        if (districtFilter !== 'all') q = q.eq('district', districtFilter);
        if (mandalFilter !== 'all') q = q.ilike('mandal', mandalFilter);
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (licenseFilter === 'expired') q = q.lt('expiry_date', todayStr);
      else if (licenseFilter === 'valid') q = q.gte('expiry_date', todayStr);
      if (loginFilter === 'with') q = q.not('portal_email', 'is', null).neq('portal_email', '');
      else if (loginFilter === 'without') q = q.is('portal_email', null);
      const term = debouncedSearch.toLowerCase();
      if (term) {
        const safe = term.replace(/[%,()"'\\]/g, '');
        if (safe) {
          q = q.or(
            `dealer_name.ilike.%${safe}%,location.ilike.%${safe}%,license_number.ilike.%${safe}%`
          );
        }
      }
      return q;
    },
    [activeTab, restrictToOwn, user?.id, isElevatedOfficerUser, isAdminUser, districtFilter, mandalFilter, licenseFilter, loginFilter, debouncedSearch]
  );

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      const from = currentPage * DEALERS_PAGE_SIZE;
      const runPage = (columns: string, withLocation: boolean) =>
        applyDealerFilters(
          supabase.from('dealers').select(columns, { count: 'exact' }),
          withLocation
        )
          .order('dealer_name')
          .order('id')
          .range(from, from + DEALERS_PAGE_SIZE - 1);

      let res = await runPage(DEALER_COLUMNS, true);
      if (res.error) res = await runPage(DEALER_COLUMNS_LEGACY, false);
      if (res.error) throw res.error;

      setDealers((res.data ?? []) as Dealer[]);
      setTotalCount(res.count ?? 0);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      toastRef.current.showError('Load failed', (error as { message?: string })?.message || 'Could not load dealers');
      setDealers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setShowSkeleton(false);
    }
  }, [applyDealerFilters, currentPage]);

  // District/mandal dropdown options — one aggregate RPC call returns the
  // distinct location combos instead of paging the whole dealers table.
  const fetchLocationOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('dealer_directory_aggregates' as never);
      if (error) return;
      const rows: { district: string; mandal: string }[] = [];
      for (const row of (data ?? []) as {
        dealer_category?: string | null;
        district?: string | null;
        mandal?: string | null;
      }[]) {
        if ((row.dealer_category || 'fertilizer') !== activeTab) continue;
        rows.push({
          district: normalizeDistrictName(row.district) || '',
          mandal: String(row.mandal ?? '').trim(),
        });
      }
      setLocationRows(rows);
    } catch {
      // Options are best-effort; the table still works without them.
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchDealers();
  }, [fetchDealers]);

  useEffect(() => {
    void fetchLocationOptions();
  }, [fetchLocationOptions]);

  useEffect(() => {
    setSelectedDealerIds(new Set());
    setCurrentPage(0);
  }, [activeTab]);

  const openLoginSetup = async () => {
    try {
      const data = await cachedSupabaseRows<Dealer>(
        `dealers:login-setup:${user?.id ?? 'admin'}:v6`,
        () => fetchDealerRows(),
        []
      );
      setAllDealersForLogin(data);
      setLoginSetupDealerId('');
      setLoginPassword(DEALER_DEFAULT_PASSWORD);
      setShowLoginSetup(true);
    } catch (err) {
      toast.showError('Load failed', err instanceof Error ? err.message : 'Could not load dealers');
    }
  };

  const selectedLoginDealer = allDealersForLogin.find((d) => d.id === loginSetupDealerId);

  const handleSetupSingleDealerLogin = async () => {
    if (!loginSetupDealerId) {
      toast.showWarning('Select a dealer', t('Select a dealer first.', 'ముందు డీలర్‌ను ఎంచుకోండి.'));
      return;
    }
    setProvisioningLogins(true);
    try {
      const result = await provisionDealerLogin(loginSetupDealerId, loginPassword);
      if (!result.ok) {
        toast.showError('Login setup failed', result.error || t('Could not set up dealer login.', 'డీలర్ లాగిన్ సెటప్ కాలేదు.'));
        return;
      }
      toast.showInfo(
        t('Login ready', 'లాగిన్ సిద్ధం'),
        t(
          `${result.dealer_name}\nPhone (login ID): ${result.phone}\nPassword: ${result.password}`,
          `${result.dealer_name}\nఫోన్ (లాగిన్ ID): ${result.phone}\nపాస్వర్డ్: ${result.password}`
        ),
        15000
      );
    } catch (err) {
      toast.showError('Login setup failed', err instanceof Error ? err.message : 'Could not provision dealer login');
    } finally {
      setProvisioningLogins(false);
    }
  };

  const handleProvisionAllDealerLogins = async () => {
    const confirmed = await askConfirm({
      title: t(
        `Create or reset portal logins for ALL dealers with phone numbers? Password: ${loginPassword}`,
        `ఫోన్ ఉన్న అన్ని డీలర్లకు లాగిన్ సృష్టించాలా/రీసెట్ చేయాలా? పాస్వర్డ్: ${loginPassword}`
      ),
      confirmLabel: 'Provision',
    });
    if (!confirmed) {
      return;
    }
    setProvisioningLogins(true);
    try {
      const result = await provisionAllDealerLogins(loginPassword);
      const failNote =
        result.failed > 0
          ? `\n\n${t('Failed', 'విఫలం')}: ${result.failed}`
          : '';
      toast.showInfo(
        t('Logins provisioned', 'లాగిన్‌లు సెటప్ అయ్యాయి'),
        t(`Set up: ${result.created}${failNote}`, `సెటప్: ${result.created}${failNote}`),
        8000
      );
    } catch (err) {
      toast.showError('Provision failed', err instanceof Error ? err.message : 'Could not provision dealer logins');
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
    const requiredMsg = t('Required', 'అవసరం');
    const errors: Record<string, string> = {};
    for (const key of ['dealer_name', 'phone_number', 'license_number', 'location'] as const) {
      if (!String(payload[key] ?? '').trim()) errors[key] = requiredMsg;
    }
    if (!payload.issue_date) errors.issue_date = requiredMsg;
    if (activeTab !== 'pesticide' && !payload.expiry_date) errors.expiry_date = requiredMsg;
    if (!errors.phone_number && !/^\d{10}$/.test(normalizePhone(payload.phone_number))) {
      errors.phone_number = t('Must be exactly 10 digits', 'తప్పనిసరిగా 10 అంకెలు ఉండాలి');
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const insertPayload = { ...payload } as Record<string, unknown>;
      if (!String(insertPayload.district ?? '').trim()) delete insertPayload.district;
      if (!String(insertPayload.mandal ?? '').trim()) delete insertPayload.mandal;

      // Same IFMS ID (fertilizer) or license number means the dealer already
      // exists — update that record instead of inserting a duplicate.
      const ifmsKey = String(insertPayload.ifms_id ?? '').trim();
      const licenseKey = String(insertPayload.license_number ?? '').trim();
      let existingQuery = supabase
        .from('dealers')
        .select('id')
        .eq('dealer_category', activeTab);
      if (activeTab === 'fertilizer' && ifmsKey) {
        existingQuery = existingQuery.eq('ifms_id', ifmsKey);
      } else if (licenseKey && licenseKey !== 'N/A') {
        existingQuery = existingQuery.eq('license_number', licenseKey);
      } else {
        existingQuery = existingQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { data: existingRows } = await existingQuery.limit(1);
      const existingId = existingRows?.[0]?.id as string | undefined;

      if (existingId) {
        const { created_by: _cb, created_by_name: _cbn, ...updatePayload } = insertPayload;
        const { error } = await supabase
          .from('dealers')
          .update({ ...updatePayload, updated_at: new Date().toISOString() } as never)
          .eq('id', existingId);
        if (error) throw error;
        toast.showSuccess('Dealer updated', payload.dealer_name);
      } else {
        const { error } = await supabase.from('dealers').insert([insertPayload] as never);
        if (error) throw error;
        toast.showSuccess('Dealer added', payload.dealer_name);
      }
      setShowAddForm(false);
      setFormData(emptyForm);
      setFieldErrors({});
      void fetchDealers();
    } catch (error) {
      console.error('Error adding dealer:', error);
      toast.showError('Add failed', (error as { message?: string })?.message || 'Failed to add dealer');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const dealer = dealers.find((d) => d.id === id);
      if (!dealer) return;
      if (!/^\d{10}$/.test(normalizePhone(dealer.phone_number))) {
        toast.showWarning('Invalid phone', t('Phone number must be exactly 10 digits.', 'ఫోన్ నంబర్ తప్పనిసరిగా 10 అంకెలు ఉండాలి.'));
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
      toast.showSuccess('Dealer updated', dealer.dealer_name);
      void fetchDealers();
    } catch (error) {
      console.error('Error updating dealer:', error);
      toast.showError('Update failed', (error as { message?: string })?.message || 'Failed to update dealer');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await askConfirm({
      title: 'Delete this dealer?',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase.from('dealers').delete().eq('id', id);
      if (error) throw error;
      toast.showSuccess('Dealer deleted');
      void fetchDealers();
    } catch (error) {
      console.error('Error deleting dealer:', error);
      toast.showError('Delete failed', (error as { message?: string })?.message || 'Failed to delete dealer');
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
      toast.showError('Delete failed', (error as { message?: string })?.message || 'Failed to delete dealers');
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
      const officerScope = isOfficerUser && !isAdminUser;
      const { imported, updated = 0, errors } = await parseExcelAndImportDealers(file, activeTab, {
        created_by: user?.id ?? null,
        created_by_name:
          officerProfile?.full_name ||
          (user?.user_metadata?.full_name as string | undefined) ||
          user?.email ||
          null,
      }, officerScope
        ? {
            district: normalizeDistrictName(officerProfile?.district) || '',
            mandal: officerProfile?.mandal || '',
          }
        : null);
      if (imported > 0 || updated > 0) {
        const updatedNote = updated > 0 ? `, ${updated} updated` : '';
        const skippedNote = errors.length
          ? '\n\n' + t('Skipped rows:', 'విఫలమైన వరుసలు:') + '\n' + errors.slice(0, 10).join('\n')
          : '';
        toast.showSuccess(`Imported ${imported} dealers${updatedNote}`, skippedNote || undefined, 8000);
        void fetchDealers();
      } else if (errors.length) {
        toast.showError('Import failed', errors.slice(0, 10).join('\n'));
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExportExcel = async () => {
    const tabLabel = TABS.find((tab) => tab.id === activeTab)?.label ?? activeTab;
    setLoading(true);
    try {
      const res = await fetchAllRows<Dealer>({
        table: 'dealers',
        columns: DEALER_COLUMNS,
        order: [{ column: 'dealer_name' }, { column: 'id' }],
        applyFilters: (q) => applyDealerFilters(q, true),
      });
      if (res.error) throw res.error;
      const rows = res.data;

      const ExcelJSModule = await import('exceljs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AGRONIX — Agriculture Information Management System';
      workbook.created = new Date();

      const dateStr = new Date().toISOString().slice(0, 10);
      const sheet = workbook.addWorksheet(`${tabLabel} Dealers`, {
        views: [{ state: 'frozen', ySplit: 4 }],
      });

      const headers = [
        'Dealer Name',
        'IFMS ID',
        'Phone',
        'Portal Email',
        'License Number',
        'Issue Date',
        'Expiry Date',
        'Location',
        'District',
        'Mandal',
        'Category',
        'Created By',
        'Created On',
      ];
      const lastCol = String.fromCharCode(64 + headers.length);

      sheet.mergeCells(`A1:${lastCol}1`);
      const titleCell = sheet.getCell('A1');
      titleCell.value = `AGRONIX — ${tabLabel.toUpperCase()} DEALER DIRECTORY`;
      titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
      sheet.getRow(1).height = 28;

      sheet.mergeCells(`A2:${lastCol}2`);
      const metaCell = sheet.getCell('A2');
      metaCell.value = `Exported: ${dateStr}   |   Total dealers: ${rows.length}`;
      metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
      metaCell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getRow(2).height = 16;
      sheet.getRow(3).height = 8;

      const headerRow = sheet.getRow(4);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF065F46' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'medium', color: { argb: 'FF059669' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });
      headerRow.height = 24;

      rows.forEach((d, idx) => {
        const row = sheet.addRow([
          d.dealer_name,
          d.ifms_id || '',
          d.phone_number || '',
          d.portal_email || '',
          d.license_number || '',
          formatDealerDate(d.issue_date),
          formatDealerDate(d.expiry_date),
          d.location || '',
          normalizeDistrictName(d.district) || '',
          d.mandal || '',
          tabLabel,
          d.created_by_name || '',
          d.created_at ? new Date(d.created_at).toLocaleString('en-IN') : '',
        ]);
        row.height = 22;
        const isEven = idx % 2 === 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        row.eachCell((cell: any, colNum: number) => {
          cell.font = { name: 'Arial', size: 9 };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          };
          if (isEven) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }
          if (colNum === 6 || colNum === 7 || colNum === 13) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          }
        });
      });

      sheet.columns = [
        { width: 28 }, // Dealer Name
        { width: 14 }, // IFMS ID
        { width: 14 }, // Phone
        { width: 26 }, // Portal Email
        { width: 18 }, // License Number
        { width: 12 }, // Issue Date
        { width: 12 }, // Expiry Date
        { width: 26 }, // Location
        { width: 22 }, // District
        { width: 18 }, // Mandal
        { width: 12 }, // Category
        { width: 20 }, // Created By
        { width: 20 }, // Created On
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dealers-${activeTab}-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.showSuccess(
        'Export ready',
        `${rows.length} ${tabLabel.toLowerCase()} dealer(s) exported to Excel.`
      );
    } catch (error) {
      toast.showError('Export failed', (error as { message?: string })?.message || 'Could not export dealers');
    } finally {
      setLoading(false);
    }
  };

  const updateLocalDealer = (id: string, field: string, value: string) => {
    setDealers((prev) =>
      prev.map((dealer) => (dealer.id === id ? { ...dealer, [field]: value } : dealer))
    );
  };

  // Location filter options — only districts/mandals actually present in the
  // visible dealers (same approach as Enforcement Tracker / User Management).
  const districtOptions = useMemo(
    () =>
      Array.from(new Set(locationRows.map((r) => r.district).filter(Boolean))).sort(),
    [locationRows]
  );
  const mandalOptions = useMemo(() => {
    const seen = new Map<string, string>();
    locationRows
      .filter((r) => districtFilter === 'all' || r.district === districtFilter)
      .forEach((r) => {
        if (r.mandal) seen.set(r.mandal.toLowerCase(), r.mandal);
      });
    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [locationRows, districtFilter]);

  // Rows are fetched one server page at a time; `dealers` is already the slice.
  const paginatedDealers = dealers;
  const pageCount = Math.max(1, Math.ceil(totalCount / DEALERS_PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, debouncedSearch, licenseFilter, loginFilter, districtFilter, mandalFilter]);

  // Clear rows on tab switch so the skeleton shows instead of stale-category data.
  useEffect(() => {
    setDealers([]);
    setShowSkeleton(true);
  }, [activeTab]);

  // If the last row(s) on a page were deleted, step back instead of showing an empty page.
  useEffect(() => {
    if (!loading && dealers.length === 0 && currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  }, [dealers, loading, currentPage]);

  const showIfms = activeTab === 'fertilizer';
  const validityLabel =
    activeTab === 'pesticide' ? t('Validity', 'చెల్లుబాటు') : t('Valid Until', 'చెల్లుబాటు తేదీ');

  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="portal-card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
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
      <PageHeader
        title={t('Dealers Directory', 'డీలర్ల డైరెక్టరీ')}
        description={t('Fertilizer, seed, and pesticide dealers', 'ఎరువులు, విత్తనాలు, పురుగుమందుల డీలర్లు')}
        actions={canManageDealers || isElevatedOfficerUser ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelImport}
              disabled={importing}
            />
            <div className="relative" ref={dataMenuRef}>
              <button
                type="button"
                onClick={() => setDataMenuOpen((v) => !v)}
                disabled={importing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <Download className="h-4 w-4" />
                {importing ? t('Importing...', 'దిగుమతి...') : t('Import / Export', 'దిగుమతి / ఎగుమతి')}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dataMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {dataMenuOpen && (
                <div
                  className="absolute left-0 right-auto z-40 mt-2 w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl sm:left-auto sm:right-0 dark:border-slate-700 dark:bg-slate-900"
                  onPointerMove={resetDataMenuIdle}
                  onPointerDown={resetDataMenuIdle}
                >
                  {canManageDealers && (
                    <button
                      type="button"
                      onClick={() => {
                        setDataMenuOpen(false);
                        importInputRef.current?.click();
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {t('Import Excel', 'Excel దిగుమతి')}
                    </button>
                  )}
                  <a
                    href={`/templates/dealer-import-template-${activeTab}.xlsx`}
                    download
                    onClick={() => setDataMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t('Template', 'టెంప్లేట్')}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setDataMenuOpen(false);
                      void handleExportExcel();
                    }}
                    disabled={totalCount === 0}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {t('Export Excel', 'Excel ఎగుమతి')}
                  </button>
                </div>
              )}
            </div>
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
            {canManageDealers && (
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
            )}
          </div>
        ) : undefined}
      />

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
        {isAdminUser && (districtOptions.length > 0 || mandalOptions.length > 0) && (
          <>
            <select
              value={districtFilter}
              onChange={(e) => { setDistrictFilter(e.target.value); setMandalFilter('all'); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{t('All Districts', 'అన్ని జిల్లా')}</option>
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={mandalFilter}
              onChange={(e) => setMandalFilter(e.target.value)}
              disabled={mandalOptions.length === 0}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition focus:border-emerald-500 focus:outline-none disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">{t('All Mandals', 'అన్ని మండలాలు')}</option>
              {mandalOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </>
        )}
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
          {totalCount} {t('dealers', 'డీలర్లు')}
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
                onClick={() => { setShowAddForm(false); setFieldErrors({}); }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <FormFields
                formData={formData}
                setFormData={setFormData}
                errors={fieldErrors}
                clearError={(key) => setFieldErrors((prev) => {
                  if (!prev[key]) return prev;
                  const next = { ...prev };
                  delete next[key];
                  return next;
                })}
                showIfms={showIfms}
                activeTab={activeTab}
                t={t}
              />
            </div>
            <div className="flex gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setFieldErrors({}); }}
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

      <div className="portal-card overflow-hidden">
        <div className="table-scroll">
          <table className="w-full min-w-[1020px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-700 dark:bg-slate-800/60">
                {canManageDealers && (
                  <th className="w-10 px-3 py-2">
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
                      className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      aria-label={t('Select all dealers on this page', 'ఈ పేజీలోని అన్ని డీలర్లను ఎంచుకోండి')}
                    />
                  </th>
                )}
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Dealer Name', 'పేరు')}
                </th>
                {showIfms && (
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    IFMS ID
                  </th>
                )}
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Phone', 'ఫోన్')}
                </th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('License', 'లైసెన్స్')}
                </th>
                {activeTab === 'pesticide' && (
                  <th className="w-[104px] whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('Issue Date', 'జారీ తేదీ')}
                  </th>
                )}
                {activeTab !== 'pesticide' && (
                  <th className="w-[104px] whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {validityLabel}
                  </th>
                )}
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Address', 'చిరునామా')}
                </th>
                <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('Mandal / District', 'మండలం / జిల్లా')}
                </th>
                {canEditDealers && (
                  <th className="w-24 px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('Actions', 'చర్యలు')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedDealers.map((dealer) => (
                <tr
                  key={dealer.id}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    editingId === dealer.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  {canManageDealers && (
                    <td className="px-3 py-2 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedDealerIds.has(dealer.id)}
                        onChange={() => toggleDealerSelect(dealer.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        aria-label={t('Select dealer', 'డీలర్‌ను ఎంచుకోండి')}
                      />
                    </td>
                  )}
                  {editingId === dealer.id ? (
                    <EditRow
                      dealer={dealer}
                      showIfms={showIfms}
                      activeTab={activeTab}
                      canManage={canEditDealers}
                      lockLocation={!isAdminUser}
                      onUpdate={() => handleUpdate(dealer.id)}
                      onCancel={() => setEditingId(null)}
                      updateLocalDealer={updateLocalDealer}
                    />
                  ) : (
                    <DisplayRow
                      dealer={dealer}
                      showIfms={showIfms}
                      activeTab={activeTab}
                      canManage={canEditDealers}
                      canDelete={canEditDealers}
                      onEdit={() => setEditingId(dealer.id)}
                      onDelete={() => handleDelete(dealer.id)}
                    />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalCount === 0 && (
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
        {totalCount > 0 && (
          <TablePagination
            currentPage={currentPage}
            pageCount={pageCount}
            total={totalCount}
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
      {confirmDialog}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
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
  errors,
  clearError,
  showIfms,
  activeTab,
  t,
}: {
  formData: typeof emptyForm;
  setFormData: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  errors: Record<string, string>;
  clearError: (key: string) => void;
  showIfms: boolean;
  activeTab: DealerCategory;
  t: (en: string, te: string) => string;
}) {
  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40';
  const inputErrorCls =
    'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-500/70 dark:focus:ring-red-900/40';
  const errorCls = 'mt-1 text-xs font-semibold text-red-600 dark:text-red-400';
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400';
  const fieldCls = (key: string) => `${inputCls} ${errors[key] ? inputErrorCls : ''}`;
  const renderFieldError = (name: string) =>
    errors[name] ? <p className={errorCls} role="alert">{errors[name]}</p> : null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelCls}>
          {t('Dealer Name', 'పేరు')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.dealer_name}
          onChange={(e) => { clearError('dealer_name'); setFormData({ ...formData, dealer_name: e.target.value }); }}
          className={fieldCls('dealer_name')}
          aria-invalid={Boolean(errors.dealer_name)}
        />
        {renderFieldError('dealer_name')}
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
          onChange={(e) => { clearError('phone_number'); setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '').slice(0, 10) }); }}
          placeholder="9876543210"
          className={fieldCls('phone_number')}
          aria-invalid={Boolean(errors.phone_number)}
        />
        {renderFieldError('phone_number')}
      </div>
      <div>
        <label className={labelCls}>
          {t('License Number', 'లైసెన్స్')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.license_number}
          onChange={(e) => { clearError('license_number'); setFormData({ ...formData, license_number: e.target.value }); }}
          className={fieldCls('license_number')}
          aria-invalid={Boolean(errors.license_number)}
        />
        {renderFieldError('license_number')}
      </div>
      <div>
        <label className={labelCls}>
          {t('License Issue Date', 'లైసెన్స్ జారీ తేదీ')} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.issue_date}
          onChange={(e) => { clearError('issue_date'); setFormData({ ...formData, issue_date: e.target.value }); }}
          className={fieldCls('issue_date')}
          aria-invalid={Boolean(errors.issue_date)}
        />
        {renderFieldError('issue_date')}
      </div>
      {activeTab !== 'pesticide' && (
        <div>
          <label className={labelCls}>
            {t('Expiry Date', 'గడువు')} <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => { clearError('expiry_date'); setFormData({ ...formData, expiry_date: e.target.value }); }}
            className={fieldCls('expiry_date')}
            aria-invalid={Boolean(errors.expiry_date)}
          />
          {renderFieldError('expiry_date')}
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
          onChange={(e) => { clearError('location'); setFormData({ ...formData, location: e.target.value }); }}
          className={fieldCls('location')}
          aria-invalid={Boolean(errors.location)}
        />
        {renderFieldError('location')}
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
  const cellCls = 'px-3 py-2 align-middle';
  return (
    <>
      <td className={cellCls}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
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
                (isAdminCreated ? 'Admin' : null);
              return addedBy ? (
                <div className="truncate text-[10px] text-slate-400 dark:text-slate-500">
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
        <td className={`${cellCls} whitespace-nowrap text-xs tabular-nums text-slate-600 dark:text-slate-400`}>
          {dealer.issue_date ? formatDealerDate(dealer.issue_date) || '—' : '—'}
        </td>
      )}
      {!isPermanent && (
        <td className={`${cellCls} whitespace-nowrap`}>
          {validityDate ? (
            <span
              className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                validityDate > new Date()
                  ? isExpiringSoon
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {formatDealerDate(dealer.expiry_date) || validityDate?.toLocaleDateString()}
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
              className="rounded-lg p-1 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={t('Delete dealer', 'డీలర్ తొలగించండి')}
                title={t('Delete dealer', 'డీలర్ తొలగించండి')}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
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
  lockLocation,
  onUpdate,
  onCancel,
  updateLocalDealer,
}: {
  dealer: Dealer;
  showIfms: boolean;
  activeTab: DealerCategory;
  canManage: boolean;
  lockLocation: boolean;
  onUpdate: () => void;
  onCancel: () => void;
  updateLocalDealer: (id: string, field: string, value: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <>
      <td className="px-3 py-2 align-middle">
        <input
          type="text"
          value={dealer.dealer_name}
          onChange={(e) => updateLocalDealer(dealer.id, 'dealer_name', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      {showIfms && (
        <td className="px-3 py-2 align-middle">
          <input
            type="text"
            value={dealer.ifms_id ?? ''}
            onChange={(e) => updateLocalDealer(dealer.id, 'ifms_id', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </td>
      )}
      <td className="px-3 py-2 align-middle">
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={dealer.phone_number}
          onChange={(e) => updateLocalDealer(dealer.id, 'phone_number', e.target.value.replace(/\D/g, '').slice(0, 10))}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      <td className="px-3 py-2 align-middle">
        <input
          type="text"
          value={dealer.license_number}
          onChange={(e) => updateLocalDealer(dealer.id, 'license_number', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      {activeTab === 'pesticide' && (
        <td className="px-3 py-2 align-middle">
          <input
            type="date"
            value={dealer.issue_date}
            onChange={(e) => updateLocalDealer(dealer.id, 'issue_date', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </td>
      )}
      {activeTab !== 'pesticide' && (
        <td className="px-3 py-2 align-middle">
          <input
            type="date"
            value={dealer.expiry_date}
            onChange={(e) => updateLocalDealer(dealer.id, 'expiry_date', e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
          />
        </td>
      )}
      <td className="px-3 py-2 align-middle">
        <input
          type="text"
          value={dealer.location}
          onChange={(e) => updateLocalDealer(dealer.id, 'location', e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-900/40"
        />
      </td>
      <td className="px-3 py-2 align-middle">
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={normalizeDistrictName(dealer.district)}
            onChange={(e) => {
              updateLocalDealer(dealer.id, 'district', e.target.value);
              updateLocalDealer(dealer.id, 'mandal', '');
            }}
            disabled={lockLocation}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 transition focus:border-emerald-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">{t('District', 'జిల్లా')}</option>
            {TELANGANA_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={dealer.mandal || ''}
            onChange={(e) => updateLocalDealer(dealer.id, 'mandal', e.target.value)}
            disabled={lockLocation || !normalizeDistrictName(dealer.district)}
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
        <td className="px-3 py-2 align-middle">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onUpdate}
              aria-label="Save changes"
              title="Save"
              className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-emerald-900/30"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel editing"
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
