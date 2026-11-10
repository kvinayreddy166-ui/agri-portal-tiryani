import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Edit3, FileText, FileType, Plus, Printer, RotateCcw, Save, Search, Trash2, X } from 'lucide-react';
import { ModulePageHeader } from '../../../shared/components/ui/ModulePageHeader';
import { currentFinancialYear, financialYearForDate } from '../../../shared/utils/financialYear';
import { useAuth } from '../../../shared/context/AuthContext';
import { withOthersOption, effectiveLocationValue } from '../../../shared/data/assistantDirectorLocation';
import {
  TELANGANA_DISTRICTS,
  getMandalsForDistrict,
} from '../../../shared/data/telanganaDistrictMandalData';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';
import { ConfirmDialog } from '../../../shared/components/ui/ConfirmDialog';
import { useConfirmDialog } from '../../../shared/components/ui/useConfirmDialog';
import { DateClearButton } from '../../../shared/components/ui/DateInput';
import { DivisionPicker } from '../../../shared/components/ui/DivisionPicker';
import {
  noticeCategoryConfigs,
  allShowCauseViolations,
  type NoticeCategory,
  type ShowCauseViolation,
} from '../data/showCauseViolationData';

import { safeStorage } from '../../../shared/lib/safeStorage';
import { OfficerCloudSyncService } from '../services/officerCloudSyncService';
import { useDealers, dealerAddressLine } from '../../../shared/hooks/useDealers';
import { DealerPartySelect } from '../../../shared/components/DealerPartySelect';
import type { Dealer } from '../../../shared/types/database';
import { OfficerDocumentArchiveService } from '../services/officerDocumentArchiveService';
import type { StatutoryCommodity } from '../../auth/types/officerAuth';
import {
  buildNoticeModel,
  compareProvisionKeys,
  designationOptionsFor,
  ENCLOSURE_OPTIONS,
  FORM_DRAFT_PREFIX,
  getConfig,
  isAdaDesignation,
  isDaoDesignation,
  isMaoDesignation,
  legalSourceBadge,
  makeInitialForm,
  NOTICE_FONT_STACK,
  provisionSortKey,
  readFormDraft,
  readSavedNotices,
  resolveDistrict,
  resolveMandal,
  today,
  writeSavedNotices,
  type NoticeFormState,
  type SavedNotice,
} from './showCauseNoticeModel';
import {
  buildNoticeWordDocument,
  noticeBlocksHtml,
  renderNoticePdfDocument,
} from './noticeDocumentRenderers';

export * from './showCauseNoticeModel';
export * from './noticeDocumentRenderers';

export function ShowCauseNoticeEntry({ lockedCategory }: { lockedCategory?: NoticeCategory } = {}) {
  const { isAdminUser, isTestUser, isOfficerUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser || isOfficerUser;
  const [form, setForm] = useState<NoticeFormState>(() => readFormDraft(lockedCategory ?? 'fertiliser') ?? makeInitialForm(lockedCategory ?? 'fertiliser'));
  const [savedNotices, setSavedNotices] = useState<SavedNotice[]>(() => readSavedNotices());
  const { askConfirm, confirmDialog } = useConfirmDialog();
  const [savedSearch, setSavedSearch] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showNoticePreview, setShowNoticePreview] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [enclosuresOpen, setEnclosuresOpen] = useState(false);
  const [otherEnclosureEnabled, setOtherEnclosureEnabled] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const previewRef = useRef<HTMLDivElement>(null);
  const [resetSpinKey, setResetSpinKey] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<SavedNotice | null>(null);
  const { toasts, removeToast, showSaved, showLoaded, showDeleted, showReset, showSuccess, showInfo, showWarning } = useToast();

  const config = useMemo(() => getConfig(form.category), [form.category]);
  const categoryViolations = useMemo(
    () => allShowCauseViolations.filter((item) => item.category === form.category),
    [form.category]
  );
  const violationGroups = useMemo(() => {
    const groups: { label: string; items: ShowCauseViolation[] }[] = [];
    const byLabel = new Map<string, ShowCauseViolation[]>();
    for (const item of categoryViolations) {
      const label = item.group || '';
      let bucket = byLabel.get(label);
      if (!bucket) {
        bucket = [];
        byLabel.set(label, bucket);
        groups.push({ label, items: bucket });
      }
      bucket.push(item);
    }
    for (const bucket of byLabel.values()) {
      bucket.sort((a, b) => compareProvisionKeys(provisionSortKey(a.exactReference), provisionSortKey(b.exactReference)));
    }
    return groups;
  }, [categoryViolations]);
  const hasViolationGroups = useMemo(() => violationGroups.some((group) => group.label !== ''), [violationGroups]);
  const selectedViolations = useMemo(
    () => allShowCauseViolations.filter((item) => form.selectedViolationIds.includes(item.violationId)),
    [form.selectedViolationIds]
  );
  const noticeBlocks = useMemo(() => buildNoticeModel(form, selectedViolations), [form, selectedViolations]);
  const noticeHtml = useMemo(() => noticeBlocksHtml(noticeBlocks), [noticeBlocks]);

  const districtOptions = useMemo(
    () => withOthersOption(TELANGANA_DISTRICTS.map((item) => ({ label: item, value: item }))),
    []
  );
  const mandalOptions = useMemo(() => {
    if (form.district && form.district !== 'Others') {
      return withOthersOption(getMandalsForDistrict(form.district).map((item) => ({ label: item, value: item })));
    }
    return [{ label: 'Others', value: 'Others' }];
  }, [form.district]);
  const designationOptions = useMemo(() => {
    const base = designationOptionsFor(form.category);
    return form.officerDesignation && !base.some((item) => item.value === form.officerDesignation)
      ? [{ label: form.officerDesignation, value: form.officerDesignation }, ...base]
      : base;
  }, [form.category, form.officerDesignation]);

  // ADA uses Division for the office location; ADA and DAO use a district-based Place of Inspection
  const isADAOfficer = isAdaDesignation(form.officerDesignation);
  const isDAOOfficer = isDaoDesignation(form.officerDesignation);
  const isMAOOfficer = isMaoDesignation(form.officerDesignation);
  const usesPlaceOfInspection = isADAOfficer || isDAOOfficer;

  const filteredSaved = useMemo(() => {
    const scoped = lockedCategory ? savedNotices.filter((notice) => notice.category === lockedCategory) : savedNotices;
    const term = savedSearch.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter((notice) =>
      [notice.memoNumber, notice.dealerName, notice.firmName, notice.category, notice.inspectionDate, notice.status]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [savedNotices, savedSearch, lockedCategory]);

  useEffect(() => {
    writeSavedNotices(savedNotices);
  }, [savedNotices]);

  useEffect(() => {
    try {
      safeStorage.setItem(`${FORM_DRAFT_PREFIX}${form.category}`, JSON.stringify(form));
    } catch {}
  }, [form]);

  const updateForm = (patch: Partial<NoticeFormState>) => setForm((current) => {
    return { ...current, ...patch };
  });
  const { dealers: directoryDealers } = useDealers();
  const applyDealerPick = (dealer: Dealer | null) => {
    if (!dealer) return;
    updateForm({
      firmName: dealer.dealer_name,
      dealerName: dealer.dealer_name,
      dealerAddress: dealerAddressLine(dealer),
      licenceNumber: dealer.license_number || form.licenceNumber,
    });
  };

  const selectedEnclosures = useMemo(
    () => form.enclosures.split(',').map((item) => item.trim()).filter(Boolean),
    [form.enclosures]
  );
  const checkedEnclosures = selectedEnclosures.filter((item) => ENCLOSURE_OPTIONS.includes(item));
  const otherEnclosureText = selectedEnclosures.filter((item) => !ENCLOSURE_OPTIONS.includes(item)).join(', ');
  const otherEnclosureActive = otherEnclosureEnabled || otherEnclosureText.length > 0;

  const writeEnclosures = (items: string[], otherText: string) => {
    const parts = [...items];
    if (otherText.trim()) parts.push(otherText.trim());
    updateForm({ enclosures: parts.join(', ') });
  };
  const toggleEnclosure = (option: string) => {
    const next = checkedEnclosures.includes(option)
      ? checkedEnclosures.filter((item) => item !== option)
      : [...checkedEnclosures, option];
    writeEnclosures(next, otherEnclosureText);
  };
  const toggleOtherEnclosure = () => {
    if (otherEnclosureActive) {
      setOtherEnclosureEnabled(false);
      writeEnclosures(checkedEnclosures, '');
    } else {
      setOtherEnclosureEnabled(true);
    }
  };

  const changeCategory = (category: NoticeCategory) => {
    const draft = readFormDraft(category);
    if (draft) {
      setForm(draft);
      setShowProductDetails(Boolean(draft.productName || draft.batchLotNumber || draft.quantityInvolved || draft.productRemarks));
      setShowNoticePreview(false);
      return;
    }
    const next = makeInitialForm(category);
    updateForm({
      category,
      memoNumber: next.memoNumber,
      noticeDate: next.noticeDate,
      selectedViolationIds: [],
      observation: '',
      dealerName: '',
      firmName: '',
      productName: '',
      batchLotNumber: '',
      quantityInvolved: '',
      productRemarks: '',
      enclosures: '',
      inspectedBy: 'self',
    });
    setShowProductDetails(false);
    setShowNoticePreview(false);
  };

  const toggleViolation = (violationId: string) => {
    setForm((current) => {
      const selected = new Set(current.selectedViolationIds);
      if (selected.has(violationId)) selected.delete(violationId);
      else selected.add(violationId);
      return { ...current, selectedViolationIds: Array.from(selected) };
    });
  };

  const toggleViolationGroup = (label: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      const key = label || '__default';
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderViolationCard = (violation: ShowCauseViolation) => {
    const sourceBadge = legalSourceBadge(violation.actOrOrder);
    return (
      <label key={violation.violationId} title={violation.shortDescription} className={`flex h-full cursor-pointer items-start gap-3 rounded-lg border p-4 shadow-sm transition ${config.theme.card}`}>
        <input
          type="checkbox"
          checked={form.selectedViolationIds.includes(violation.violationId)}
          onChange={() => toggleViolation(violation.violationId)}
          className={`mt-0.5 h-[18px] w-[18px] min-h-[18px] min-w-[18px] shrink-0 rounded ${config.theme.checkbox}`}
        />
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex flex-wrap items-center gap-1.5">
            {sourceBadge && (
              <span className="inline-flex shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-black leading-tight text-white">
                {sourceBadge}
              </span>
            )}
            <span className={`inline-flex max-w-full whitespace-normal break-normal rounded-full px-2 py-0.5 text-[11px] font-black leading-tight [overflow-wrap:normal] [word-break:normal] ${config.theme.badge}`}>
              {violation.exactReference}
            </span>
          </span>
          <span className="block whitespace-normal break-normal text-sm font-bold leading-snug text-slate-900 dark:text-white [overflow-wrap:normal] [word-break:normal]">{violation.shortDescription}</span>
        </span>
      </label>
    );
  };

  const persistNotice = (notify = false, issue = false) => {
    const id = `${form.memoNumber || 'draft'}-${Date.now()}`;
    const prevIssuedAt = savedNotices.find((item) => item.memoNumber === form.memoNumber)?.issuedAt;
    const saved: SavedNotice = { ...form, id, savedAt: new Date().toISOString(), issuedAt: issue ? new Date().toISOString() : prevIssuedAt };
    setSavedNotices((current) => [saved, ...current.filter((item) => item.memoNumber !== form.memoNumber)]);
    const comm: StatutoryCommodity = form.category === 'fertiliser' ? 'fertilizer' : form.category;
    if (issue) void OfficerCloudSyncService.syncStatutoryOrder('show_cause', comm, saved as unknown as Record<string, unknown>);
    if (notify) showSaved('Draft saved', form.memoNumber || 'Untitled notice');
  };

  const saveNotice = () => persistNotice(true);

  // Persist the record when the document is actually issued (download),
  // not merely when the form is filled in.
  const persistNoticeForExport = async (): Promise<boolean> => {
    const dealer = String(form.firmName ?? form.dealerName ?? '').trim();
    if (!dealer) return false;
    const ref = String(form.memoNumber || '').trim();
    const ok = await askConfirm({
      title: `Issue Show Cause Notice for ${dealer}${ref ? ` (${ref})` : ''}?`,
      message: 'The record will be saved to cloud records.',
      confirmLabel: 'Issue',
    });
    if (!ok) return false;
    persistNotice(false, true);
    return true;
  };

  const editSavedNotice = (notice: SavedNotice) => {
    const resolvedDistrict = resolveDistrict(notice.district || '', notice.manualDistrict || '');
    const resolvedMandal = resolveMandal(resolvedDistrict.district, notice.mandal || '', notice.manualMandal || '');
    const noticeForm: NoticeFormState = {
      category: notice.category,
      dealerName: notice.dealerName,
      firmName: notice.firmName,
      licenceNumber: notice.licenceNumber,
      dealerAddress: notice.dealerAddress,
      memoNumber: notice.memoNumber,
      financialYear: notice.inspectionDate ? financialYearForDate(notice.inspectionDate) : currentFinancialYear(),
      inspectionDate: notice.inspectionDate,
      noticeDate: notice.noticeDate || today(),
      inspectedBy: notice.inspectedBy || 'self',
      deadline: notice.deadline,
      officerName: notice.officerName,
      officerDesignation: notice.officerDesignation,
      mandal: resolvedMandal.mandal,
      district: resolvedDistrict.district,
      manualMandal: resolvedMandal.manualMandal,
      manualDistrict: resolvedDistrict.manualDistrict,
      division: notice.division || '',
      productName: notice.productName,
      batchLotNumber: notice.batchLotNumber,
      quantityInvolved: notice.quantityInvolved,
      invoiceDetails: notice.invoiceDetails || '',
      productRemarks: notice.productRemarks || '',
      observation: notice.observation,
      enclosures: notice.enclosures || '',
      selectedViolationIds: notice.selectedViolationIds,
      status: notice.status,
    };
    setForm(noticeForm);
    setShowProductDetails(Boolean(notice.productName || notice.batchLotNumber || notice.quantityInvolved || notice.productRemarks));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showLoaded('Draft loaded', notice.memoNumber || 'Untitled notice');
  };

  const resetNotice = () => {
    setResetConfirmOpen(true);
  };

  const performReset = () => {
    setResetSpinKey((current) => current + 1);
    const next = makeInitialForm(lockedCategory ?? form.category);
    setForm({
      ...next,
      dealerName: '',
      firmName: '',
      licenceNumber: '',
      dealerAddress: '',
      memoNumber: '',
      inspectionDate: '',
      noticeDate: '',
      deadline: '',
      officerName: '',
      officerDesignation: '',
      mandal: '',
      district: '',
      manualMandal: '',
      manualDistrict: '',
      division: '',
      enclosures: '',
    });
    setShowProductDetails(false);
    setShowNoticePreview(false);
    showReset('Form reset');
  };

  const deleteSavedNotice = (notice: SavedNotice) => {
    setNoticeToDelete(notice);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteNotice = () => {
    if (noticeToDelete) {
      setSavedNotices((current) => current.filter((item) => item.id !== noticeToDelete.id));
      const memoNumber = String(noticeToDelete.memoNumber || noticeToDelete.id || '');
      const comm: StatutoryCommodity = noticeToDelete.category === 'fertiliser' ? 'fertilizer' : noticeToDelete.category;
      if (memoNumber) void OfficerCloudSyncService.deleteStatutoryOrderRecord('show_cause', comm, memoNumber);
      showDeleted('Notice deleted', noticeToDelete.memoNumber || 'Untitled notice');
      setNoticeToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const noticeFileName = () => `${form.memoNumber || 'show-cause-notice'}.pdf`.replace(/[\\/]/g, '-');
  const noticeWordFileName = () => `${form.memoNumber || 'show-cause-notice'}.docx`.replace(/[\\/]/g, '-');

  const buildNoticePdfDoc = () => renderNoticePdfDocument(noticeBlocks, form.memoNumber || 'Show Cause Notice');

  const downloadPdf = async () => {
    if (!(await persistNoticeForExport())) return;
    const doc = await buildNoticePdfDoc();
    const filename = noticeFileName();
    doc.save(filename);
    showSuccess('PDF downloaded', filename);

    // Auto-archive in background (non-blocking)
    await OfficerDocumentArchiveService.archiveGeneratedDocument(doc.output('blob'), {
      filename,
      documentCategory: 'notice',
      documentNumber: form.memoNumber || undefined,
      documentDate: form.noticeDate,
      sourceModule: 'show_cause',
      fileFormat: 'pdf',
      metadata: { ...form },
    });
  };

  const downloadWord = async () => {
    try {
      if (!(await persistNoticeForExport())) return;
      const blob = await buildNoticeWordDocument(noticeBlocks);
      const url = URL.createObjectURL(blob);
      const filename = noticeWordFileName();
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showSuccess('Word downloaded', filename);

      // Auto-archive in background (non-blocking)
      await OfficerDocumentArchiveService.archiveGeneratedDocument(blob, {
        filename,
        documentCategory: 'notice',
        documentNumber: form.memoNumber || undefined,
        documentDate: form.noticeDate,
        sourceModule: 'show_cause',
        fileFormat: 'docx',
        metadata: { ...form },
      });
    } catch (error) {
      console.error('Unable to generate notice Word document:', error);
      showWarning('Word export failed', 'Please try again.');
    }
  };

  const printPreview = async () => {
    try {
      const doc = await buildNoticePdfDoc();
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(pdfUrl);
        };
      } else {
        URL.revokeObjectURL(pdfUrl);
        showWarning('Print blocked', 'Please allow popups for this site to print the document.');
      }
    } catch (error) {
      console.error('Unable to generate PDF for printing:', error);
      showWarning('Print failed', 'Please try again.');
    }
  };

  const previewNotice = () => {
    setShowNoticePreview(true);
    showInfo('Preview ready');
    window.requestAnimationFrame(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

    const sectionHeaderColor =
    form.category === 'seed'
      ? 'text-emerald-700 dark:text-emerald-400'
      : form.category === 'pesticide'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-blue-700 dark:text-blue-400';

    const sectionBorderColor =
    form.category === 'seed'
      ? 'border-emerald-200/80 dark:border-emerald-800/60'
      : form.category === 'pesticide'
        ? 'border-amber-200/80 dark:border-amber-800/60'
        : 'border-blue-200/80 dark:border-blue-800/60';

    const sectionDividerColor =
    form.category === 'seed'
      ? 'border-emerald-200/80 dark:border-emerald-800/60'
      : form.category === 'pesticide'
        ? 'border-amber-200/80 dark:border-amber-800/60'
        : 'border-blue-200/80 dark:border-blue-800/60';

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {confirmDialog}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset form?"
        message="All entered details will be cleared."
        onConfirm={() => { setResetConfirmOpen(false); performReset(); }}
        onCancel={() => setResetConfirmOpen(false)}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete this notice?"
        message={`Delete "${noticeToDelete?.memoNumber || 'Untitled notice'}"? This action cannot be undone.`}
        onConfirm={confirmDeleteNotice}
        onCancel={() => { setDeleteConfirmOpen(false); setNoticeToDelete(null); }}
      />
      {!lockedCategory && showCompactHeader && (
        <ModulePageHeader
          className="mb-4"
          title={config.title}
          subtitle="Show Cause Notice / Memo Entry"
          icon={FileText}
        />
      )}
      {!lockedCategory && !showCompactHeader && (
        <div className={`overflow-hidden rounded-lg bg-gradient-to-r ${config.theme.header} px-4 py-3 text-white shadow-sm`}>
          <div>
            <h2 className="text-lg font-black">{config.title}</h2>
            <p className="text-xs font-semibold text-white/85">Show Cause Notice / Memo Entry</p>
          </div>
        </div>
      )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            {!lockedCategory ? (
            <div className="inline-flex flex-wrap rounded-lg border border-white bg-white dark:bg-slate-900 p-1 shadow-sm">
              {noticeCategoryConfigs.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => changeCategory(item.category)}
                  className={`rounded-md px-3 py-2 text-sm font-black transition ${
                    form.category === item.category ? `${config.theme.button} text-white` : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.tabLabel}
                </button>
              ))}
            </div>
            ) : <span />}
            <button type="button" onClick={resetNotice} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-50 dark:border-red-800/50 dark:bg-slate-900 dark:text-red-300 sm:text-sm">
              <RotateCcw key={resetSpinKey} className="h-4 w-4 reset-ccw-spin" aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className={`rounded-lg border ${sectionBorderColor} bg-white dark:bg-slate-900 p-3 shadow-sm`}>
            <h3 className={`mb-2.5 pb-2 border-b ${sectionDividerColor} text-sm font-black uppercase tracking-wide ${sectionHeaderColor}`}>Officer Details</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <TextInput label="Inspecting Officer" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
              <SelectInput label="Designation" value={form.officerDesignation} onChange={(value) => updateForm({ officerDesignation: value }) } options={designationOptions} />
              <SelectInput
                label="District"
                value={form.district}
                onChange={(value) => updateForm({ district: value, mandal: '', manualMandal: '', manualDistrict: '' })}
                options={districtOptions}
              />
              {form.district === 'Others' && (
                <TextInput label="Enter District Name" value={form.manualDistrict} onChange={(value) => updateForm({ manualDistrict: value })} />
              )}
              {(isADAOfficer || isMAOOfficer) && (
                <DivisionPicker
                  label="Division"
                  district={form.district}
                  value={form.division}
                  onChange={(value) => updateForm({ division: value })}
                />
              )}
              <SelectInput
                label={usesPlaceOfInspection ? 'Place of Inspection' : 'Mandal'}
                value={form.mandal}
                onChange={(value) => updateForm({ mandal: value, manualMandal: value === 'Others' ? form.manualMandal : '' })}
                options={mandalOptions}
              />
              {form.mandal === 'Others' && (
                <TextInput
                  label={usesPlaceOfInspection ? 'Enter Place of Inspection' : 'Enter Mandal Name'}
                  value={form.manualMandal}
                  onChange={(value) => updateForm({ manualMandal: value })}
                />
              )}
              <TextInput label="Memo/Lr. No" value={form.memoNumber} onChange={(value) => updateForm({ memoNumber: value })} />
              <TextInput
                label="Inspection Date"
                type="date"
                value={form.inspectionDate}
                onChange={(value) => updateForm({
                  inspectionDate: value,
                  financialYear: value ? financialYearForDate(value) : currentFinancialYear(),
                })}
              />
              <TextInput
                label="Notice Date"
                type="date"
                value={form.noticeDate}
                onChange={(value) => updateForm({ noticeDate: value })}
              />
              {!isMAOOfficer && (
                <SelectInput
                  label="Inspection Conducted By"
                  value={form.inspectedBy}
                  onChange={(value) => updateForm({ inspectedBy: value as 'self' | 'mao' })}
                  options={[
                    { label: 'Direct (by issuing officer)', value: 'self' },
                    { label: 'Mandal Agriculture Officer', value: 'mao' },
                  ]}
                />
              )}
            </div>
          </div>

          <div className={`rounded-lg border ${sectionBorderColor} bg-white dark:bg-slate-900 p-3 shadow-sm`}>
            <h3 className={`mb-2.5 pb-2 border-b ${sectionDividerColor} text-sm font-black uppercase tracking-wide ${sectionHeaderColor}`}>Dealer Details</h3>
            <div className="grid gap-3 md:grid-cols-4">
            <DealerPartySelect dealers={directoryDealers} onPick={applyDealerPick} label="Select dealer / party" />
            <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value, dealerName: value })} />
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Firm Address</span>
              <span className="mb-1 block text-[10px] font-semibold leading-tight text-slate-400 dark:text-slate-500">
                {effectiveLocationValue(form.mandal, form.manualMandal) || 'Mandal'} Mandal,<br />
                {effectiveLocationValue(form.district, form.manualDistrict) || 'District'} District. (auto-added)
              </span>
              <textarea
                value={form.dealerAddress}
                onChange={(event) => updateForm({ dealerAddress: event.target.value })}
                placeholder="D.No, Road, Village"
                rows={2}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <TextInput label="Licence Number" value={form.licenceNumber} onChange={(value) => updateForm({ licenceNumber: value })} optional />
            <SelectInput
              label="Deadline"
              value={form.deadline}
              onChange={(value) => updateForm({ deadline: value })}
              options={[
                { label: '3 (three) days', value: '3 (three) days' },
                { label: '5 (five) days', value: '5 (five) days' },
                { label: '7 (seven) days', value: '7 (seven) days' },
                { label: '10 (ten) days', value: '10 (ten) days' },
                { label: '15 (fifteen) days', value: '15 (fifteen) days' },
              ]}
            />
            <div className="md:col-span-2">
              <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">Enclosures</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEnclosuresOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <span className={`truncate ${selectedEnclosures.length ? '' : 'text-slate-400 dark:text-slate-500'}`}>
                    {selectedEnclosures.length ? `${selectedEnclosures.length} selected` : 'Select enclosures'}
                  </span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${enclosuresOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {enclosuresOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close enclosures menu"
                      onClick={() => setEnclosuresOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {ENCLOSURE_OPTIONS.map((option) => (
                        <label key={option} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-slate-800">
                          <input
                            type="checkbox"
                            checked={checkedEnclosures.includes(option)}
                            onChange={() => toggleEnclosure(option)}
                            className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                          />
                          {option}
                        </label>
                      ))}
                      <label className="flex cursor-pointer items-center gap-2 border-t border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={otherEnclosureActive}
                          onChange={toggleOtherEnclosure}
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                        />
                        Others
                      </label>
                      {otherEnclosureActive && (
                        <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
                          <input
                            type="text"
                            value={otherEnclosureText}
                            onChange={(event) => writeEnclosures(checkedEnclosures, event.target.value)}
                            placeholder="Specify other enclosures"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {selectedEnclosures.length > 0 && (
                <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{selectedEnclosures.join(', ')}</p>
              )}
            </div>
            </div>
          </div>

          <section>
            <h3 className={`mb-3 rounded-lg px-3 py-2 text-sm font-black ${config.theme.badge}`}>{config.heading}</h3>
            {hasViolationGroups ? (
              <div className="space-y-2">
                {violationGroups.map((group) => {
                  const groupKey = group.label || '__default';
                  const collapsed = !expandedGroups.has(groupKey);
                  const selectedCount = group.items.filter((item) => form.selectedViolationIds.includes(item.violationId)).length;
                  return (
                    <div key={groupKey} className={`overflow-hidden rounded-xl border shadow-sm ${config.theme.panel}`}>
                      <button
                        type="button"
                        onClick={() => toggleViolationGroup(group.label)}
                        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                      >
                        <span className="text-sm font-black leading-snug text-slate-800 dark:text-slate-100 sm:text-base">{group.label || 'Violations'}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {selectedCount > 0 && (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${config.theme.badge}`}>{selectedCount} selected</span>
                          )}
                          <ChevronDown className={`h-5 w-5 text-slate-600 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
                        </span>
                      </button>
                      {!collapsed && (
                        <div className="grid gap-2 p-2 md:grid-cols-2">
                          {group.items.map((violation) => renderViolationCard(violation))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {categoryViolations.map((violation) => renderViolationCard(violation))}
              </div>
            )}
          </section>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-slate-600 dark:text-slate-300">
                <span>{config.observationLabel}</span>
                {!showProductDetails && (
                  <button
                    type="button"
                    onClick={() => setShowProductDetails(true)}
                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black text-white ${config.theme.button}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Product
                  </button>
                )}
              </span>
              <textarea
                value={form.observation}
                onChange={(event) => updateForm({ observation: event.target.value })}
                placeholder={config.observationPlaceholder}
                rows={4}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            {showProductDetails && (
              <div className={`rounded-lg border ${sectionBorderColor} bg-white dark:bg-slate-900 p-3 shadow-sm`}>
                <div className={`mb-3 pb-2 border-b ${sectionDividerColor} flex items-center justify-between gap-3`}>
                  <h3 className={`text-sm font-black uppercase tracking-wide ${sectionHeaderColor}`}>Product Details</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductDetails(false);
                      updateForm({ productName: '', batchLotNumber: '', quantityInvolved: '', productRemarks: '', invoiceDetails: '' });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <TextInput label="Product Name" value={form.productName} onChange={(value) => updateForm({ productName: value })} />
                  <TextInput label="Batch/Lot Number" value={form.batchLotNumber} onChange={(value) => updateForm({ batchLotNumber: value })} />
                  <TextInput label="Quantity" value={form.quantityInvolved} onChange={(value) => updateForm({ quantityInvolved: value })} />
                  <TextInput label="Remarks" value={form.productRemarks} onChange={(value) => updateForm({ productRemarks: value })} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={previewNotice} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black text-white shadow-sm transition sm:text-sm ${config.theme.button}`}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              Preview
            </button>
            <button type="button" onClick={saveNotice} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-slate-900 sm:text-sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Draft
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:text-sm"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
                <ChevronDown className={`h-4 w-4 transition-transform ${exportOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {exportOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close export menu"
                    onClick={() => setExportOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute left-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => { setExportOpen(false); void downloadPdf(); }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExportOpen(false); void downloadWord(); }}
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-xs font-black text-blue-700 transition hover:bg-blue-50 dark:border-slate-800 dark:text-blue-300 dark:hover:bg-slate-800 sm:text-sm"
                    >
                      <FileType className="h-4 w-4" aria-hidden="true" />
                      WORD
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExportOpen(false); void printPreview(); }}
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
                    >
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      PRINT
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

      {showNoticePreview && (
        <section ref={previewRef} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Notice Preview</h3>
            <button
              type="button"
              onClick={() => setShowNoticePreview(false)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              aria-label="Close notice preview"
            >
              <X className="h-4 w-4" />
              Close Preview
            </button>
          </div>
          <div
            className="max-h-[520px] overflow-auto rounded-lg bg-white dark:bg-slate-900 p-6 text-slate-900 dark:text-white shadow-inner ring-1 ring-slate-100"
            style={{ fontFamily: NOTICE_FONT_STACK, fontSize: '12pt', lineHeight: 1.15 }}
            dangerouslySetInnerHTML={{ __html: noticeHtml }}
          />
        </section>
      )}

      <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Saved Notices</h3>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              value={savedSearch}
              onChange={(event) => setSavedSearch(event.target.value)}
              placeholder="Search saved notices"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Memo</th>
                <th className="px-3 py-2">Dealer</th>
                <th className="px-3 py-2">Inspection</th>
                <th className="px-3 py-2">Clauses/Sections/Rules</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSaved.map((notice) => (
                <tr key={notice.id}>
                  <td className="px-3 py-2 font-black">{notice.memoNumber}</td>
                  <td className="px-3 py-2">{notice.firmName || notice.dealerName || '-'}</td>
                  <td className="px-3 py-2">{notice.inspectionDate}</td>
                  <td className="px-3 py-2">{allShowCauseViolations.filter((item) => notice.selectedViolationIds.includes(item.violationId)).map((item) => item.exactReference).join(', ') || '-'}</td>
                  <td className="px-3 py-2">{notice.status}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => editSavedNotice(notice)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteSavedNotice(notice)} aria-label="Delete saved notice" className="inline-flex items-center justify-center rounded-md p-1.5 text-red-600 dark:text-red-300 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSaved.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center font-semibold text-slate-500 dark:text-slate-400">No saved notices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600 dark:text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export function TextInput({ label, value, onChange, type = 'text', optional = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; optional?: boolean }) {
  return (
    <div className="block">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-black text-slate-600 dark:text-slate-300">
        <span>
          {label}
          {optional && <span className="ml-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">(Optional)</span>}
        </span>
        {type === 'date' && value ? (
          <DateClearButton onClick={() => onChange('')} />
        ) : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </div>
  );
}
