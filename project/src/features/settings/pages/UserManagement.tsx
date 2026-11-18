import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, RefreshCw, Trash2, ShieldAlert, CheckCircle2, PauseCircle, PlayCircle, Download, Search, Bell, Send, X } from 'lucide-react';
import { supabase } from '../../../shared/lib/supabase';
import { useAuth } from '../../../shared/context/AuthContext';
import { Spinner } from '../../../shared/components/ui/Spinner';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { useConfirmDialog } from '../../../shared/components/ui/useConfirmDialog';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { normalizeDistrictName } from '../../../shared/data/telanganaDistrictMandalData';
import { usePersistentState } from '../../../shared/hooks/usePersistentState';
import { adminSendNotifications } from '../../feedback/services/feedbackService';


interface OfficerRow {
  id: string;
  full_name: string;
  designation: string;
  qualification?: string;
  hrms_id?: string;
  district: string;
  mandal: string;
  division?: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export function UserManagement() {
  const { isAdminUser, user } = useAuth();
  const toast = useToast();
  const { askConfirm, confirmDialog } = useConfirmDialog();
  const [adminOfficers, setAdminOfficers] = useState<OfficerRow[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<OfficerRow | null>(null);
  const [adminDeleteConfirmText, setAdminDeleteConfirmText] = useState('');
  const [adminDeleting, setAdminDeleting] = useState(false);
  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyAudience, setNotifyAudience] = useState<'all' | 'filtered' | 'selected'>('all');
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyLink, setNotifyLink] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [searchQuery, setSearchQuery] = usePersistentState('tiryani-page-filters-user-management-search', '');
  const [districtFilter, setDistrictFilter] = usePersistentState('tiryani-page-filters-user-management-district', 'all');
  const [mandalFilter, setMandalFilter] = usePersistentState('tiryani-page-filters-user-management-mandal', 'all');
  const [designationFilter, setDesignationFilter] = usePersistentState('tiryani-page-filters-user-management-designation', 'all');
  const [statusFilter, setStatusFilter] = usePersistentState('tiryani-page-filters-user-management-status', 'all');

  const loadOfficerAccounts = useCallback(async () => {
    if (!isAdminUser) return;
    setLoadingOfficers(true);
    try {
      const { data, error } = await supabase
        .from('officer_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setAdminOfficers((data as OfficerRow[]).filter((o) => o.id !== user?.id));
      }
    } catch (e) {
      console.warn('Failed to load officer profiles:', e);
    } finally {
      setLoadingOfficers(false);
    }
  }, [isAdminUser, user?.id]);

  useEffect(() => {
    if (isAdminUser) {
      loadOfficerAccounts();
    }
  }, [isAdminUser, loadOfficerAccounts]);

  const deleteOfficerAccount = async (officer: OfficerRow): Promise<boolean> => {
    let deleted = false;

    // 1. Try RPC delete_officer_account
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('delete_officer_account', {
        p_user_id: officer.id,
      });
      if (!rpcError && (rpcData as { success?: boolean })?.success) {
        deleted = true;
      } else if (rpcError) {
        console.warn('Admin RPC notice:', rpcError);
      }
    } catch (rpcEx) {
      console.warn('Admin RPC exception:', rpcEx);
    }

    // 2. If RPC not successful, fallback to Edge Function
    if (!deleted) {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { userId: officer.id },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Edge function call failed.');
      }
      if (fnData?.error) {
        throw new Error(fnData.error);
      }
    }
    return true;
  };

  const handleAdminDeleteOfficer = async () => {
    if (!officerToDelete) return;
    const confirmInput = adminDeleteConfirmText.trim().toLowerCase();
    const officerEmail = officerToDelete.email.trim().toLowerCase();

    if (confirmInput !== 'delete' && confirmInput !== officerEmail) {
      toast.showWarning('Confirmation required', 'Please type "DELETE" or the officer\'s email to confirm.');
      return;
    }

    setAdminDeleting(true);
    try {
      await deleteOfficerAccount(officerToDelete);
      const deletedName = officerToDelete.full_name || officerToDelete.email;
      setAdminOfficers((prev) => prev.filter((o) => o.id !== officerToDelete.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(officerToDelete.id);
        return next;
      });
      setOfficerToDelete(null);
      setAdminDeleteConfirmText('');
      setActionSuccessMessage(`Officer account "${deletedName}" was permanently deleted.`);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: unknown) {
      console.error('Admin officer deletion error:', err);
      toast.showError('Delete failed', (err as Error)?.message || 'Failed to delete officer account. Please verify database permissions.');
    } finally {
      setAdminDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const districtOptions = useMemo(
    () =>
      Array.from(
        new Set(adminOfficers.map((o) => normalizeDistrictName(o.district)).filter(Boolean))
      ).sort(),
    [adminOfficers]
  );
  const mandalOptions = useMemo(
    () =>
      Array.from(
        new Set(
          adminOfficers
            .filter((o) => districtFilter === 'all' || normalizeDistrictName(o.district) === districtFilter)
            .map((o) => o.mandal)
            .filter(Boolean)
        )
      ).sort(),
    [adminOfficers, districtFilter]
  );
  const designationOptions = useMemo(
    () => Array.from(new Set(adminOfficers.map((o) => o.designation).filter(Boolean))).sort(),
    [adminOfficers]
  );

  const filteredOfficers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return adminOfficers.filter((o) => {
      if (districtFilter !== 'all' && normalizeDistrictName(o.district) !== districtFilter) return false;
      if (mandalFilter !== 'all' && o.mandal !== mandalFilter) return false;
      if (designationFilter !== 'all' && o.designation !== designationFilter) return false;
      if (statusFilter !== 'all' && (o.status || 'active') !== statusFilter) return false;
      if (!q) return true;
      return [o.full_name, o.designation, o.qualification, o.hrms_id, o.district, o.mandal, o.division, o.phone, o.email, o.role, o.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [adminOfficers, searchQuery, districtFilter, mandalFilter, designationFilter, statusFilter]);

  const allSelected = filteredOfficers.length > 0 && filteredOfficers.every((o) => selectedIds.has(o.id));
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(filteredOfficers.map((o) => o.id)));
  };

  const selectedOfficers = adminOfficers.filter((o) => selectedIds.has(o.id));

  const notifyRecipients = useMemo(() => {
    if (notifyAudience === 'filtered') return filteredOfficers;
    if (notifyAudience === 'selected') return selectedOfficers;
    return adminOfficers;
  }, [notifyAudience, filteredOfficers, selectedOfficers, adminOfficers]);

  const openNotifyModal = () => {
    setNotifyAudience(selectedIds.size > 0 ? 'selected' : 'all');
    setNotifyTitle('');
    setNotifyMessage('');
    setNotifyLink('');
    setNotifyOpen(true);
  };

  const handleSendNotification = async () => {
    if (!notifyTitle.trim()) {
      toast.showWarning('Title required', 'Please enter a notification title.');
      return;
    }
    const ids = notifyRecipients.map((o) => o.id);
    if (ids.length === 0) {
      toast.showWarning('No recipients', 'The selected audience has no officers.');
      return;
    }
    setNotifySending(true);
    try {
      const sent = await adminSendNotifications(ids, {
        title: notifyTitle,
        message: notifyMessage,
        link: notifyLink || '/feedback',
        type: 'admin_message',
      });
      setNotifyOpen(false);
      setActionSuccessMessage(`Notification sent to ${sent} officer(s).`);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err) {
      toast.showError('Send failed', (err as Error)?.message || 'Failed to send notifications.');
    } finally {
      setNotifySending(false);
    }
  };

  const handleBulkStatus = async (nextStatus: 'active' | 'suspended') => {
    const targets = selectedOfficers.filter((o) => o.id !== user?.id);
    if (targets.length === 0) return;
    const confirmed = await askConfirm({
      title: `${nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'} ${targets.length} officer account(s)?`,
      confirmLabel: nextStatus === 'suspended' ? 'Suspend' : 'Reactivate',
    });
    if (!confirmed) return;
    setBulkActing(true);
    try {
      const { error } = await supabase
        .from('officer_profiles')
        .update({ status: nextStatus })
        .in('id', targets.map((o) => o.id));
      if (error) throw error;
      setAdminOfficers((prev) =>
        prev.map((o) => (selectedIds.has(o.id) ? { ...o, status: nextStatus } : o))
      );
      setActionSuccessMessage(`${targets.length} officer account(s) ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: unknown) {
      console.error('Bulk status update error:', err);
      toast.showError('Update failed', (err as Error)?.message || 'Failed to update officer statuses.');
    } finally {
      setBulkActing(false);
    }
  };

  const handleBulkDelete = () => {
    const targets = selectedOfficers.filter((o) => o.id !== user?.id);
    if (targets.length === 0) return;
    setBulkDeleteConfirmText('');
    setBulkDeleteOpen(true);
  };

  const executeBulkDelete = async () => {
    const targets = selectedOfficers.filter((o) => o.id !== user?.id);
    if (targets.length === 0) return;
    setBulkActing(true);
    let failed = 0;
    for (const officer of targets) {
      try {
        await deleteOfficerAccount(officer);
        setAdminOfficers((prev) => prev.filter((o) => o.id !== officer.id));
      } catch (err) {
        console.error('Bulk delete failed for', officer.email, err);
        failed += 1;
      }
    }
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    setBulkActing(false);
    setActionSuccessMessage(
      failed === 0
        ? `${targets.length} officer account(s) permanently deleted.`
        : `${targets.length - failed} deleted, ${failed} failed.`
    );
    setTimeout(() => setActionSuccessMessage(null), 6000);
  };

  const handleExportExcel = async () => {
    try {
      const ExcelJSModule = await import('exceljs');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ExcelJS = (ExcelJSModule as any).default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AGRONIX — Agriculture Information Management System';
      workbook.created = new Date();

      const dateStr = new Date().toISOString().slice(0, 10);
      const sheet = workbook.addWorksheet('Officer Accounts', {
        views: [{ state: 'frozen', ySplit: 4 }],
      });

      const headers = [
        'Name',
        'Designation',
        'Qualification',
        'HRMS ID',
        'District',
        'Mandal',
        'Division',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Registered On',
      ];
      const lastCol = String.fromCharCode(64 + headers.length);

      sheet.mergeCells(`A1:${lastCol}1`);
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'AGRONIX — OFFICER ACCOUNTS REGISTER';
      titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF15803D' } };
      sheet.getRow(1).height = 28;

      sheet.mergeCells(`A2:${lastCol}2`);
      const metaCell = sheet.getCell('A2');
      metaCell.value = `Exported: ${dateStr}   |   Total officers: ${adminOfficers.length}`;
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

      adminOfficers.forEach((o, idx) => {
        const row = sheet.addRow([
          o.full_name,
          o.designation,
          o.qualification || '',
          o.hrms_id || '',
          o.district,
          o.mandal,
          o.division || '',
          o.email,
          o.phone,
          o.role,
          o.status || 'active',
          o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '',
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
          if (colNum === 12 || colNum === 11) {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          }
        });
      });

      sheet.columns = [
        { width: 24 }, // Name
        { width: 18 }, // Designation
        { width: 16 }, // Qualification
        { width: 14 }, // HRMS ID
        { width: 20 }, // District
        { width: 18 }, // Mandal
        { width: 16 }, // Division
        { width: 28 }, // Email
        { width: 14 }, // Phone
        { width: 12 }, // Role
        { width: 12 }, // Status
        { width: 20 }, // Registered On
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `officer-accounts-${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.showSuccess('Export ready', `${adminOfficers.length} officer account(s) exported to Excel.`);
    } catch {
      toast.showError('Export failed', 'Could not export officer accounts.');
    }
  };

  const handleToggleSuspend = async (officer: OfficerRow) => {
    const nextStatus = officer.status === 'suspended' ? 'active' : 'suspended';
    const confirmed = await askConfirm({
      title: `${nextStatus === 'suspended' ? 'Suspend' : 'Reactivate'} the account for ${officer.full_name} (${officer.email})?`,
      message: nextStatus === 'suspended' ? 'They will be signed out and cannot log in.' : undefined,
      confirmLabel: nextStatus === 'suspended' ? 'Suspend' : 'Reactivate',
    });
    if (!confirmed) {
      return;
    }
    setSuspendingId(officer.id);
    try {
      const { error } = await supabase
        .from('officer_profiles')
        .update({ status: nextStatus })
        .eq('id', officer.id);
      if (error) throw error;
      setAdminOfficers((prev) =>
        prev.map((o) => (o.id === officer.id ? { ...o, status: nextStatus } : o))
      );
      setActionSuccessMessage(
        `Officer "${officer.full_name}" ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}.`
      );
      setTimeout(() => setActionSuccessMessage(null), 6000);
    } catch (err: unknown) {
      console.error('Suspend/resume officer error:', err);
      toast.showError('Update failed', (err as Error)?.message || 'Failed to update officer status.');
    } finally {
      setSuspendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage registered officer accounts" />

      {actionSuccessMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      <div className="portal-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Officer Accounts</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openNotifyModal}
              disabled={adminOfficers.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            >
              <Bell className="w-3.5 h-3.5" />
              Notify Officers
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={adminOfficers.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={loadOfficerAccounts}
              disabled={loadingOfficers}
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOfficers ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          As portal administrator, you can view and remove registered officer accounts upon administrative review or officer request.
        </p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, designation, district, mandal, phone or HRMS ID..."
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-8 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-slate-500">
              {filteredOfficers.length} of {adminOfficers.length}
            </span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setMandalFilter('all'); }}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Districts</option>
            {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={mandalFilter}
            onChange={(e) => setMandalFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Mandals</option>
            {mandalOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Designations</option>
            {designationOptions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          {(districtFilter !== 'all' || mandalFilter !== 'all' || designationFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setDistrictFilter('all'); setMandalFilter('all'); setDesignationFilter('all'); setStatusFilter('all'); }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {filteredOfficers.length} {filteredOfficers.length === 1 ? 'officer' : 'officers'}
            {filteredOfficers.length !== adminOfficers.length ? ` of ${adminOfficers.length}` : ''}
          </span>
        </div>

        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 px-4 py-2.5">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={() => handleBulkStatus('suspended')}
              disabled={bulkActing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-900/40 disabled:opacity-50"
            >
              Suspend
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatus('active')}
              disabled={bulkActing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 disabled:opacity-50"
            >
              Reactivate
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkActing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/40 disabled:opacity-50"
            >
              {bulkActing ? 'Working...' : 'Delete'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkActing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        )}

        {loadingOfficers ? (
          <div className="py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
            <Spinner size="md" className="text-emerald-600 dark:text-emerald-400 mx-auto mb-2" label="Loading" />
            Loading officer accounts...
          </div>
        ) : adminOfficers.length === 0 ? (
          <div className="py-6 text-center text-gray-500 dark:text-slate-400 text-sm bg-gray-50 dark:bg-slate-800/40 rounded-lg">
            No registered officer accounts found.
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="py-6 text-center text-gray-500 dark:text-slate-400 text-sm bg-gray-50 dark:bg-slate-800/40 rounded-lg">
            {searchQuery
              ? `No officers match "${searchQuery}".`
              : 'No officers match the current filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  <th className="py-2 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      aria-label="Select all officers"
                    />
                  </th>
                  <th className="py-2 px-3">Officer Name</th>
                  <th className="py-2 px-3">Designation</th>
                  <th className="py-2 px-3">District / Mandal</th>
                  <th className="py-2 px-3">Contact</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredOfficers.map((officer) => {
                  const isSelf = officer.id === user?.id;
                  return (
                    <tr key={officer.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(officer.id)}
                          onChange={() => toggleSelect(officer.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          aria-label={`Select ${officer.full_name}`}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-gray-900 dark:text-white">{officer.full_name}</div>
                        {officer.qualification && (
                          <div className="text-xs text-gray-500 dark:text-slate-400">{officer.qualification}</div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {officer.designation}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 dark:text-slate-300">
                        <div>{officer.district}</div>
                        <div className="text-gray-400 dark:text-slate-500">{officer.mandal}</div>
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-600 dark:text-slate-300">
                        <div>{officer.email}</div>
                        <div className="text-gray-400 dark:text-slate-500">{officer.phone}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                            officer.status === 'suspended'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}
                        >
                          {officer.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleToggleSuspend(officer)}
                            disabled={suspendingId === officer.id}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors border disabled:opacity-50 mr-2 ${
                              officer.status === 'suspended'
                                ? 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40'
                                : 'text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-900/40'
                            }`}
                            title={officer.status === 'suspended' ? 'Reactivate account' : 'Suspend account'}
                          >
                            {officer.status === 'suspended' ? (
                              <PlayCircle className="w-3.5 h-3.5" />
                            ) : (
                              <PauseCircle className="w-3.5 h-3.5" />
                            )}
                            {suspendingId === officer.id
                              ? '...'
                              : officer.status === 'suspended'
                                ? 'Reactivate'
                                : 'Suspend'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setOfficerToDelete(officer);
                            setAdminDeleteConfirmText('');
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 dark:text-red-400 transition-colors border border-red-200 dark:border-red-900/40"
                          title={isSelf ? 'Delete your own account' : `Delete ${officer.full_name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Delete Officer Confirmation Modal */}
      {officerToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/40">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Officer Account</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
              You are deleting the officer account for <strong className="text-gray-900 dark:text-white">{officerToDelete.full_name}</strong> (<code>{officerToDelete.email}</code>).
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg mb-4">
              This will permanently delete this officer&apos;s inspections, statutory orders, sampling memos, and auth account. This action cannot be reversed.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 mb-1.5">
                Type <span className="font-semibold text-red-600 dark:text-red-400">DELETE</span> or the officer&apos;s email to confirm:
              </label>
              <input
                type="text"
                value={adminDeleteConfirmText}
                onChange={(e) => setAdminDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setOfficerToDelete(null);
                  setAdminDeleteConfirmText('');
                }}
                disabled={adminDeleting}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDeleteOfficer}
                disabled={
                  adminDeleting ||
                  (adminDeleteConfirmText.trim().toLowerCase() !== 'delete' &&
                    adminDeleteConfirmText.trim().toLowerCase() !== officerToDelete.email.trim().toLowerCase())
                }
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {adminDeleting ? (
                  <>
                    <Spinner size="xs" className="text-white" label="Loading" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Officer Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Delete Officer Confirmation Modal */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/40">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Officer Accounts</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
              You are deleting <strong className="text-gray-900 dark:text-white">{selectedOfficers.filter((o) => o.id !== user?.id).length} officer account(s)</strong>.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg mb-4">
              This will permanently delete these officers&apos; inspections, statutory orders, sampling memos, and auth accounts. This action cannot be reversed.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 mb-1.5">
                Type <span className="font-semibold text-red-600 dark:text-red-400">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={bulkDeleteConfirmText}
                onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoFocus
                className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(false)}
                disabled={bulkActing}
                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                disabled={bulkActing || bulkDeleteConfirmText.trim().toLowerCase() !== 'delete'}
                className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {bulkActing ? (
                  <>
                    <Spinner size="xs" className="text-white" label="Loading" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Send Notification Modal */}
      {notifyOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg animate-pop-in overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Send Notification</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Officers see this in the notification bell</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifyOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Recipients
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      { id: 'all', label: `All officers (${adminOfficers.length})` },
                      { id: 'filtered', label: `Filtered (${filteredOfficers.length})` },
                      { id: 'selected', label: `Selected (${selectedOfficers.length})` },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setNotifyAudience(opt.id)}
                      disabled={opt.id === 'filtered' && filteredOfficers.length === 0 || opt.id === 'selected' && selectedOfficers.length === 0}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        notifyAudience === opt.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. New Circular: Fertilizer Stock Verification"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Message <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Short details shown under the title…"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Link <span className="font-normal normal-case text-gray-400">(optional — where tapping opens)</span>
                </label>
                <input
                  type="text"
                  value={notifyLink}
                  onChange={(e) => setNotifyLink(e.target.value)}
                  maxLength={200}
                  placeholder="/feedback"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-emerald-500/20"
                />
              </div>

              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                Will send to <span className="font-black text-emerald-700 dark:text-emerald-300">{notifyRecipients.length}</span> officer(s).
              </p>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setNotifyOpen(false)}
                disabled={notifySending}
                className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 disabled:opacity-50 dark:text-slate-300 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSendNotification()}
                disabled={notifySending || !notifyTitle.trim() || notifyRecipients.length === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {notifySending ? <Spinner size="xs" className="text-white" label="Loading" /> : <Send className="h-4 w-4" />}
                {notifySending ? 'Sending…' : `Send to ${notifyRecipients.length}`}
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
