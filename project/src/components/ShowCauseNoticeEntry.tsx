import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Edit3, FileText, Printer, Save, Search } from 'lucide-react';
import { currentFinancialYear } from '../utils/financialYear';
import {
  noticeCategoryConfigs,
  allShowCauseViolations,
  type NoticeCategory,
  type RecommendedAction,
  type ShowCauseViolation,
} from '../data/showCauseViolationData';

type NoticeStatus = 'Draft' | 'Issued' | 'Explanation Received' | 'Closed' | 'Action Proposed';

interface NoticeFormState {
  category: NoticeCategory;
  dealerName: string;
  firmName: string;
  licenceNumber: string;
  dealerAddress: string;
  memoNumber: string;
  financialYear: string;
  inspectionDate: string;
  deadline: string;
  officerName: string;
  officerDesignation: string;
  mandal: string;
  district: string;
  productName: string;
  batchLotNumber: string;
  quantityInvolved: string;
  invoiceDetails: string;
  observation: string;
  recommendedActions: RecommendedAction[];
  selectedViolationIds: string[];
  status: NoticeStatus;
}

interface SavedNotice extends NoticeFormState {
  id: string;
  savedAt: string;
}

const STORAGE_KEY = 'agri-legal-show-cause-notices';
const today = () => new Date().toISOString().slice(0, 10);

const recommendedActions: RecommendedAction[] = [
  'show cause',
  'stop sale',
  'seizure',
  'suspension',
  'cancellation',
  'prosecution',
];

const dealerOptions = ['Select dealer from records', 'Sri Lakshmi Agro Agencies', 'Tiryani Farmers Service Centre', 'Rythu Seeds & Pesticides'];

function readSavedNotices(): SavedNotice[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedNotices(notices: SavedNotice[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
}

function makeInitialForm(category: NoticeCategory): NoticeFormState {
  const config = noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
  const fy = currentFinancialYear();
  return {
    category,
    dealerName: '',
    firmName: '',
    licenceNumber: '',
    dealerAddress: '',
    memoNumber: `${config.memoPrefix}/${fy}`,
    financialYear: fy,
    inspectionDate: today(),
    deadline: '7 (seven) days',
    officerName: '',
    officerDesignation: 'Agriculture Officer',
    mandal: 'Tiryani',
    district: 'Kumuram Bheem Asifabad',
    productName: '',
    batchLotNumber: '',
    quantityInvolved: '',
    invoiceDetails: '',
    observation: '',
    recommendedActions: ['show cause'],
    selectedViolationIds: [],
    status: 'Draft',
  };
}

function getConfig(category: NoticeCategory) {
  return noticeCategoryConfigs.find((item) => item.category === category) || noticeCategoryConfigs[0];
}

function buildNoticeText(form: NoticeFormState, selectedViolations: ShowCauseViolation[]) {
  const refs = selectedViolations.map((item) => `${item.exactReference} - ${item.shortDescription}`).join('\n');
  const paragraphs = selectedViolations.map((item) => item.noticeParagraph).join('\n\n');
  return `Office of the ${form.officerDesignation || 'Agriculture Officer'}, ${form.mandal || 'Mandal'}
${form.district || 'District'}

Memo No: ${form.memoNumber || 'Draft'}                         Date: ${today()}

To
${form.firmName || form.dealerName || 'Dealer / Firm Name'}
${form.dealerAddress || 'Dealer Address'}
Licence No: ${form.licenceNumber || '-'}

Subject: Show Cause Notice - irregularities noticed during inspection on ${form.inspectionDate || '-'} - explanation called for.

Reference: Field inspection conducted on ${form.inspectionDate || '-'}.

The following irregularities were noticed:
${refs || 'No violation selected.'}

Product details: ${form.productName || '-'} | Batch/Lot: ${form.batchLotNumber || '-'} | Quantity: ${form.quantityInvolved || '-'} | Invoice/Bill: ${form.invoiceDetails || '-'}

Specific observation:
${form.observation || '-'}

${paragraphs}

You are hereby directed to submit your written explanation within ${form.deadline || '7 (seven) days'} from receipt of this notice. Failing which, action may be proposed as per applicable Act/Order/Rules, including ${form.recommendedActions.join(', ')} where legally applicable.

Officer Signature
${form.officerName || ''}
${form.officerDesignation || ''}

Copy submitted to the higher authority for information where required.`;
}

export function ShowCauseNoticeEntry() {
  const [form, setForm] = useState<NoticeFormState>(() => makeInitialForm('fertiliser'));
  const [savedNotices, setSavedNotices] = useState<SavedNotice[]>(() => readSavedNotices());
  const [savedSearch, setSavedSearch] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const config = useMemo(() => getConfig(form.category), [form.category]);
  const categoryViolations = useMemo(
    () => allShowCauseViolations.filter((item) => item.category === form.category),
    [form.category]
  );
  const selectedViolations = useMemo(
    () => allShowCauseViolations.filter((item) => form.selectedViolationIds.includes(item.violationId)),
    [form.selectedViolationIds]
  );
  const noticeText = useMemo(() => buildNoticeText(form, selectedViolations), [form, selectedViolations]);

  const filteredSaved = useMemo(() => {
    const term = savedSearch.trim().toLowerCase();
    if (!term) return savedNotices;
    return savedNotices.filter((notice) =>
      [notice.memoNumber, notice.dealerName, notice.firmName, notice.category, notice.inspectionDate, notice.status]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [savedNotices, savedSearch]);

  useEffect(() => {
    writeSavedNotices(savedNotices);
  }, [savedNotices]);

  const updateForm = (patch: Partial<NoticeFormState>) => setForm((current) => ({ ...current, ...patch }));

  const changeCategory = (category: NoticeCategory) => {
    const next = makeInitialForm(category);
    updateForm({
      category,
      memoNumber: next.memoNumber,
      selectedViolationIds: [],
      observation: '',
      dealerName: '',
      firmName: '',
      productName: '',
    });
  };

  const toggleViolation = (violationId: string) => {
    setForm((current) => {
      const selected = new Set(current.selectedViolationIds);
      if (selected.has(violationId)) selected.delete(violationId);
      else selected.add(violationId);
      return { ...current, selectedViolationIds: Array.from(selected) };
    });
  };

  const toggleAction = (action: RecommendedAction) => {
    setForm((current) => {
      const selected = new Set(current.recommendedActions);
      if (selected.has(action) && selected.size > 1) selected.delete(action);
      else selected.add(action);
      return { ...current, recommendedActions: Array.from(selected) };
    });
  };

  const saveNotice = () => {
    const id = `${form.memoNumber || 'draft'}-${Date.now()}`;
    const saved: SavedNotice = { ...form, id, savedAt: new Date().toISOString() };
    setSavedNotices((current) => [saved, ...current.filter((item) => item.memoNumber !== form.memoNumber)]);
  };

  const editSavedNotice = (notice: SavedNotice) => {
    const noticeForm: NoticeFormState = {
      category: notice.category,
      dealerName: notice.dealerName,
      firmName: notice.firmName,
      licenceNumber: notice.licenceNumber,
      dealerAddress: notice.dealerAddress,
      memoNumber: notice.memoNumber,
      financialYear: notice.financialYear,
      inspectionDate: notice.inspectionDate,
      deadline: notice.deadline,
      officerName: notice.officerName,
      officerDesignation: notice.officerDesignation,
      mandal: notice.mandal,
      district: notice.district,
      productName: notice.productName,
      batchLotNumber: notice.batchLotNumber,
      quantityInvolved: notice.quantityInvolved,
      invoiceDetails: notice.invoiceDetails,
      observation: notice.observation,
      recommendedActions: notice.recommendedActions,
      selectedViolationIds: notice.selectedViolationIds,
      status: notice.status,
    };
    setForm(noticeForm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const printNotice = () => {
    const popup = window.open('', '_blank', 'width=900,height=1000');
    if (!popup) return;
    popup.document.write(`<html><head><title>${form.memoNumber || 'notice'}</title><style>body{font-family:Arial,sans-serif;line-height:1.55;padding:32px;color:#111827} pre{white-space:pre-wrap;font-family:inherit} h1{text-align:center;font-size:20px}</style></head><body><h1>Show Cause Notice</h1><pre>${noticeText.replace(/</g, '&lt;')}</pre></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const lines = doc.splitTextToSize(noticeText, 520);
    let y = 48;
    doc.setFont('helvetica', 'bold');
    doc.text('Show Cause Notice', 210, y);
    doc.setFont('helvetica', 'normal');
    y += 28;
    lines.forEach((line: string) => {
      if (y > 780) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, 42, y);
      y += 14;
    });
    doc.save(`${form.memoNumber || 'show-cause-notice'}.pdf`.replace(/[\\/]/g, '-'));
  };

  return (
    <div className="space-y-4">
      <section className={`overflow-hidden rounded-lg border shadow-sm ${config.theme.panel}`}>
        <div className={`bg-gradient-to-r ${config.theme.header} px-4 py-3 text-white`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">{config.title}</h2>
              <p className="text-xs font-semibold text-white/85">Show Cause Notice / Memo Entry</p>
            </div>
            <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-black">FY {form.financialYear}</span>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="inline-flex flex-wrap rounded-lg border border-white bg-white p-1 shadow-sm">
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

          <div className="grid gap-3 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-600">{config.dealerLabel}</span>
              <select
                value={form.dealerName}
                onChange={(event) => updateForm({ dealerName: event.target.value, firmName: event.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select</option>
                {dealerOptions.map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
              </select>
            </label>
            <TextInput label="Memo Number" value={form.memoNumber} onChange={(value) => updateForm({ memoNumber: value })} />
            <TextInput label="Inspection Date" type="date" value={form.inspectionDate} onChange={(value) => updateForm({ inspectionDate: value })} />
            <TextInput label="Deadline" value={form.deadline} onChange={(value) => updateForm({ deadline: value })} />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <TextInput label="Firm Name" value={form.firmName} onChange={(value) => updateForm({ firmName: value })} />
            <TextInput label="Licence Number" value={form.licenceNumber} onChange={(value) => updateForm({ licenceNumber: value })} />
            <TextInput label="Financial Year" value={form.financialYear} onChange={(value) => updateForm({ financialYear: value })} />
            <TextInput label="Inspecting Officer Name" value={form.officerName} onChange={(value) => updateForm({ officerName: value })} />
            <TextInput label="Officer Designation" value={form.officerDesignation} onChange={(value) => updateForm({ officerDesignation: value })} />
            <TextInput label="Mandal" value={form.mandal} onChange={(value) => updateForm({ mandal: value })} />
            <TextInput label="District" value={form.district} onChange={(value) => updateForm({ district: value })} />
            <TextInput label="Product Name" value={form.productName} onChange={(value) => updateForm({ productName: value })} />
            <TextInput label="Batch/Lot Number" value={form.batchLotNumber} onChange={(value) => updateForm({ batchLotNumber: value })} />
            <TextInput label="Quantity involved" value={form.quantityInvolved} onChange={(value) => updateForm({ quantityInvolved: value })} />
            <TextInput label="Invoice/Bill details" value={form.invoiceDetails} onChange={(value) => updateForm({ invoiceDetails: value })} />
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-black text-slate-600">Dealer Address</span>
              <input
                value={form.dealerAddress}
                onChange={(event) => updateForm({ dealerAddress: event.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <section>
            <h3 className={`mb-3 rounded-lg px-3 py-2 text-sm font-black ${config.theme.badge}`}>{config.heading}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {categoryViolations.map((violation) => (
                <label key={violation.violationId} className={`flex cursor-pointer gap-3 rounded-lg border p-3 shadow-sm transition ${config.theme.card}`}>
                  <input
                    type="checkbox"
                    checked={form.selectedViolationIds.includes(violation.violationId)}
                    onChange={() => toggleViolation(violation.violationId)}
                    className={`mt-1 h-4 w-4 rounded ${config.theme.checkbox}`}
                  />
                  <span className="min-w-0">
                    <span className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-black ${config.theme.badge}`}>
                      {violation.exactReference}
                    </span>
                    <span className="block text-sm font-bold text-slate-900">{violation.shortDescription}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">{violation.sourceStatus}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <label className="block">
            <span className="mb-1 block text-xs font-black text-slate-600">{config.observationLabel}</span>
            <textarea
              value={form.observation}
              onChange={(event) => updateForm({ observation: event.target.value })}
              placeholder={config.observationPlaceholder}
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-black text-slate-600">Recommended action</p>
            <div className="flex flex-wrap gap-2">
              {recommendedActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => toggleAction(action)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-black capitalize transition ${
                    form.recommendedActions.includes(action) ? `${config.theme.button} border-transparent text-white` : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black text-white shadow-sm ${config.theme.button}`}>
              <FileText className="h-4 w-4" />
              {config.previewButtonLabel}
            </button>
            <button type="button" onClick={saveNotice} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-900">
              <Save className="h-4 w-4" />
              Save Entry
            </button>
            <button type="button" onClick={printNotice} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </section>

      <section ref={previewRef} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-black text-slate-900">Notice Preview</h3>
        <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-800">{noticeText}</pre>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h3 className="text-base font-black text-slate-900">Saved Notices</h3>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={savedSearch}
              onChange={(event) => setSavedSearch(event.target.value)}
              placeholder="Search saved notices"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Memo</th>
                <th className="px-3 py-2">Dealer</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Inspection</th>
                <th className="px-3 py-2">Clauses/Sections/Rules</th>
                <th className="px-3 py-2">Deadline</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSaved.map((notice) => (
                <tr key={notice.id}>
                  <td className="px-3 py-2 font-black">{notice.memoNumber}</td>
                  <td className="px-3 py-2">{notice.firmName || notice.dealerName || '-'}</td>
                  <td className="px-3 py-2 capitalize">{notice.category}</td>
                  <td className="px-3 py-2">{notice.inspectionDate}</td>
                  <td className="px-3 py-2">{allShowCauseViolations.filter((item) => notice.selectedViolationIds.includes(item.violationId)).map((item) => item.exactReference).join(', ') || '-'}</td>
                  <td className="px-3 py-2">{notice.deadline}</td>
                  <td className="px-3 py-2">{notice.status}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => editSavedNotice(notice)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-emerald-700 hover:bg-emerald-50">
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSaved.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center font-semibold text-slate-500">No saved notices yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TextInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </label>
  );
}
