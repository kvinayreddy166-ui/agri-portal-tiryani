import React, { useEffect, useMemo, useState } from 'react';
import { Download, Eye, RotateCcw, Save } from 'lucide-react';

const STORAGE_KEY = 'tiryani-seed-forms-draft';
const DRAFTS_KEY = 'tiryani-seed-forms-named-drafts';
const PDF_FONT = 'times';
const PDF_BODY_SIZE = 13.4;
const PDF_TITLE_SIZE = 16.4;
const PDF_SUBTITLE_SIZE = 14.4;
const FORM_II_COTTON_QUANTITY = '25 grams * 3';

const cropOptions = ['Paddy', 'Cotton', 'Maize', 'Redgram', 'Greengram', 'Blackgram', 'Soybean', 'Bengalgram', 'Jowar', 'Other'];
const natureOptions = ['Seed sample', 'Truthfully Labelled Seed', 'Certified Seed', 'Foundation Seed', 'Hybrid Seed', 'Other'];
const classOptions = ['Breeder Seed', 'Foundation Seed', 'Certified Seed', 'Truthfully Labelled Seed', 'Hybrid Seed', 'Other'];
const testOptions = ['Germination, Purity & Moisture Test', 'BT Protein Test', 'Genetic Purity Test', 'Seed Health Test', 'Complete Analysis', 'Other'];
const designationOptions = ['Mandal Agriculture Officer', 'Asst. Director of Agriculture'];
const labOptions = [
  {
    id: 'seed-testing',
    label: 'Seed Testing Laboratory, Rajendranagar',
    value: 'The Asst. Director of Agriculture,\nSeed Testing Laboratory,\nRajendranagar, Hyderabad - 500030',
  },
  {
    id: 'dna-lab',
    label: 'DNA Finger Printing Lab, Old Malakpet',
    value: 'The Govt. Analyst/ADA,\nDNA Finger Printing Lab,\nOld Malakpet, Hyderabad - 500036',
  },
  { id: 'other', label: 'Other', value: '' },
];

const initialSeedForm = {
  officerName: '',
  designation: '',
  officeAddress: '',
  place: '',
  date: new Date().toISOString().slice(0, 10),
  serialNo: '',
  codeNo: '',
  collectionDate: new Date().toISOString().slice(0, 10),
  collectionPlace: '',
  nature: 'Seed sample',
  natureOther: '',
  crop: 'Paddy',
  cropOther: '',
  variety: '',
  lotNo: '',
  quantityDrawn: '',
  quantityInLot: '',
  seedClass: 'Certified Seed',
  seedClassOther: '',
  packingDate: '',
  stockPosition: '',
  sourceOfSupply: '',
  testRequired: 'Germination, Purity & Moisture Test',
  testRequiredOther: '',
  remarks: '',
  dealerName: '',
  dealerAddress: '',
  premisesLocation: '',
  costDemanded: 'No',
  costPaid: 'Not Applicable',
  labId: 'seed-testing',
  customLabAddress: '',
};

export function SeedForms() {
  const [form, setForm] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? { ...initialSeedForm, ...JSON.parse(saved) } : initialSeedForm;
    } catch {
      return initialSeedForm;
    }
  });
  const [message, setMessage] = useState('');
  const [draftName, setDraftName] = useState('');
  const [savedDrafts, setSavedDrafts] = useState(() => loadSeedDrafts());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const resolved = useMemo(() => resolveSeedValues(form), [form]);
  const isCottonCrop = resolved.crop === 'Cotton';

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const saveDraft = () => {
    const name = buildSeedDraftName(draftName, form);
    const nextDrafts = upsertSeedDraft(savedDrafts, {
      name,
      form,
      updatedAt: new Date().toISOString(),
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setDraftName(name);
    setSavedDrafts(nextDrafts);
    setMessage(`Draft saved: ${name}`);
  };

  const resetDraft = () => {
    if (!confirm('Reset seed form draft?')) return;
    setForm(initialSeedForm);
    window.localStorage.removeItem(STORAGE_KEY);
    setMessage('Draft reset.');
  };

  const loadDraft = (name) => {
    const draft = savedDrafts.find((item) => item.name === name);
    if (!draft) return;
    setForm({ ...initialSeedForm, ...draft.form });
    setDraftName(draft.name);
    setMessage(`Draft loaded: ${draft.name}`);
  };

  const deleteDraft = () => {
    const name = draftName.trim();
    if (!name) {
      setMessage('Select a saved draft to delete.');
      return;
    }
    if (!confirm(`Delete saved draft "${name}"?`)) return;
    const nextDrafts = savedDrafts.filter((draft) => draft.name !== name);
    window.localStorage.setItem(DRAFTS_KEY, JSON.stringify(nextDrafts));
    setSavedDrafts(nextDrafts);
    setDraftName('');
    setMessage(`Draft deleted: ${name}`);
  };

  const buildValidatedPdf = async (kind) => {
    const error = validateSeedForm(form, kind);
    if (error) {
      setMessage(error);
      return null;
    }

    try {
      return await buildSeedPdf(kind, form);
    } catch (error) {
      console.error('Seed PDF generation failed:', error);
      setMessage('PDF could not be generated. Please check the entered details and try again.');
      return null;
    }
  };

  const generate = async (kind) => {
    const targetWindow = openBlankSeedPdfTab();
    const doc = await buildValidatedPdf(kind);
    if (!doc) {
      targetWindow?.close();
      return;
    }
    openSeedDocInTab(doc, seedFileName(kind, form), targetWindow);
    setMessage('PDF opened in a new tab.');
  };

  const preview = async (kind) => {
    const targetWindow = openBlankSeedPdfTab();
    const doc = await buildValidatedPdf(kind);
    if (!doc) {
      targetWindow?.close();
      return;
    }
    openSeedDocInTab(doc, seedFileName(kind, form), targetWindow);
    setMessage('PDF preview opened in a new tab.');
  };

  return (
    <section className="rounded-lg border border-emerald-100 bg-white p-3 shadow-sm">
      <div className="mb-2 flex justify-end gap-2">
          <button type="button" onClick={saveDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button type="button" onClick={resetDraft} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
      </div>

      <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
        <p className="mb-1 text-[11px] font-black uppercase tracking-wide text-slate-600">Multiple user drafts</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Draft name / officer / dealer"
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value=""
            onChange={(event) => loadDraft(event.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Load saved draft...</option>
            {savedDrafts.map((draft) => (
              <option key={draft.name} value={draft.name}>
                {draft.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={deleteDraft}
            className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
          {message}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Officer / From Details">
          <Input label="From officer name" value={form.officerName} onChange={(value) => setField('officerName', value)} />
          <Select label="From designation" value={form.designation} onChange={(value) => setField('designation', value)} options={designationOptions.map(toOption)} />
          <Input label="From office address" value={form.officeAddress} onChange={(value) => setField('officeAddress', value)} textarea />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Form place" value={form.place} onChange={(value) => setField('place', value)} />
            <Input label="Form date" type="date" value={form.date} onChange={(value) => setField('date', value)} />
          </div>
        </Card>

        <Card title="Laboratory / To Details">
          <Select label="To Address / Laboratory" value={form.labId} onChange={(value) => setField('labId', value)} options={labOptions.map((item) => ({ label: item.label, value: item.id }))} />
          {form.labId === 'other' ? (
            <Input label="Custom laboratory address" value={form.customLabAddress} onChange={(value) => setField('customLabAddress', value)} textarea />
          ) : (
            <p className="whitespace-pre-line rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-600">{resolved.labAddress}</p>
          )}
          <PreviewCard title="Information Slip Logic" lines={resolved.crop === 'Cotton' ? ['Cotton selected: two slips will be generated.', '1. Germination, Purity & Moisture Test', '2. BT Protein Test'] : [`One slip: ${resolved.testRequired}`]} />
        </Card>

        <Card title="Sample Details">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Serial No. of sample" value={form.serialNo} onChange={(value) => setField('serialNo', value)} />
            <Input label="Code No. of sample" value={form.codeNo} onChange={(value) => setField('codeNo', value)} />
            <Input label="Date of collection / sampling" type="date" value={form.collectionDate} onChange={(value) => setField('collectionDate', value)} />
            <Input label="Place of collection" value={form.collectionPlace} onChange={(value) => setField('collectionPlace', value)} />
          </div>
          <SelectWithOther label="Nature of article submitted" valueKey="nature" otherKey="natureOther" form={form} setField={setField} options={natureOptions} />
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectWithOther label="Crop" valueKey="crop" otherKey="cropOther" form={form} setField={setField} options={cropOptions} />
            <Input label="Variety" value={form.variety} onChange={(value) => setField('variety', value)} />
            <Input label="Lot No. of sample" value={form.lotNo} onChange={(value) => setField('lotNo', value)} />
            <Input label="Quantity of sample drawn" value={form.quantityDrawn} onChange={(value) => setField('quantityDrawn', value)} />
            <SelectWithOther label="Class / Origin of seed" valueKey="seedClass" otherKey="seedClassOther" form={form} setField={setField} options={classOptions} />
            <Input label="Date of packing" type="date" value={form.packingDate} onChange={(value) => setField('packingDate', value)} />
            <Input label="Stock position" value={form.stockPosition} onChange={(value) => setField('stockPosition', value)} />
          </div>
          <Input label="Source of supply" value={form.sourceOfSupply} onChange={(value) => setField('sourceOfSupply', value)} />
          <SelectWithOther label="Kind of test required" valueKey="testRequired" otherKey="testRequiredOther" form={form} setField={setField} options={testOptions} />
          <Input label="Remarks" value={form.remarks} onChange={(value) => setField('remarks', value)} textarea />
        </Card>

        <Card title="Dealer / Form VI & VIII Details">
          <Input label="Dealer / Party name" value={form.dealerName} onChange={(value) => setField('dealerName', value)} />
          <Input label="Dealer / Party address" value={form.dealerAddress} onChange={(value) => setField('dealerAddress', value)} textarea />
          <Input label="Dealer location" value={form.premisesLocation} onChange={(value) => setField('premisesLocation', value)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Select label="Cost of sample demanded" value={form.costDemanded} onChange={(value) => setField('costDemanded', value)} options={['Yes', 'No'].map(toOption)} />
            <Select label="Cost paid" value={form.costPaid} onChange={(value) => setField('costPaid', value)} options={['Paid', 'Not Paid', 'Not Applicable'].map(toOption)} />
          </div>
        </Card>
      </div>

      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-600">PDF Generation</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {isCottonCrop && <PdfAction label="Form II" onPreview={() => preview('II')} onDownload={() => generate('II')} />}
          <PdfAction label="Form V" onPreview={() => preview('V')} onDownload={() => generate('V')} />
          <PdfAction label="Form VI Notice" onPreview={() => preview('VI')} onDownload={() => generate('VI')} />
          <PdfAction label="Form VIII" onPreview={() => preview('VIII')} onDownload={() => generate('VIII')} />
          <PdfAction label="Information Slip" onPreview={() => preview('SLIP')} onDownload={() => generate('SLIP')} />
          <PdfAction label="All Forms" onPreview={() => preview('ALL')} onDownload={() => generate('ALL')} primary />
        </div>
      </div>

    </section>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <h3 className="mb-2 text-sm font-black text-slate-900">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function PreviewCard({ title, lines }) {
  return (
    <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 p-2.5">
      <p className="text-xs font-black text-emerald-900">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-xs font-semibold text-emerald-800">{line}</p>
      ))}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', textarea = false }) {
  const className = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100';
  return (
    <label>
      <span className="mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={className} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label>
      <span className="mb-0.5 block text-[11px] font-black uppercase tracking-wide text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-semibold text-slate-950 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100">
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function SelectWithOther({ label, valueKey, otherKey, form, setField, options }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Select label={label} value={form[valueKey]} onChange={(value) => setField(valueKey, value)} options={options.map(toOption)} />
      {form[valueKey] === 'Other' && (
        <Input label={`${label} - Other`} value={form[otherKey]} onChange={(value) => setField(otherKey, value)} />
      )}
    </div>
  );
}

function PdfAction({ label, onPreview, onDownload, primary = false }) {
  return (
    <div className={`rounded-lg border p-2 ${primary ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-black text-slate-800">{label}</p>
        {primary && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-800">All</span>}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-black ${
            primary ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
}

function toOption(value) {
  return { label: value, value };
}

function resolveSeedValues(form) {
  const lab = labOptions.find((item) => item.id === form.labId) || labOptions[0];
  return {
    ...form,
    crop: form.crop === 'Other' ? form.cropOther : form.crop,
    nature: form.nature === 'Other' ? form.natureOther : form.nature,
    seedClass: form.seedClass === 'Other' ? form.seedClassOther : form.seedClass,
    testRequired: form.testRequired === 'Other' ? form.testRequiredOther : form.testRequired,
    labAddress: form.labId === 'other' ? form.customLabAddress : lab.value,
    fromAddress: [form.officerName, form.designation, form.officeAddress].filter(Boolean).join('\n'),
    senderAddress: [form.designation, form.officeAddress].filter(Boolean).join('\n'),
  };
}

function isCottonSeedForm(form) {
  return resolveSeedValues(form).crop === 'Cotton';
}

function validateSeedForm(form, kind) {
  if (kind === 'II' && !isCottonSeedForm(form)) {
    return 'Form II is available only when Cotton crop is selected.';
  }
  return '';
}

async function buildSeedPdf(kind, form) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({ title: `Seed Form ${kind}`, creator: 'Tiryani Agriculture Portal' });

  if (kind === 'ALL') {
    if (isCottonSeedForm(form)) {
      drawSeedFormII(doc, form);
      doc.addPage();
    }
    drawSeedFormV(doc, form);
    doc.addPage();
    drawSeedFormVI(doc, form);
    doc.addPage();
    drawSeedFormVIII(doc, form);
    drawInfoSlips(doc, form, true);
    return doc;
  }

  if (kind === 'II') drawSeedFormII(doc, form);
  if (kind === 'V') drawSeedFormV(doc, form);
  if (kind === 'VI') drawSeedFormVI(doc, form);
  if (kind === 'VIII') drawSeedFormVIII(doc, form);
  if (kind === 'SLIP') drawInfoSlips(doc, form, false);
  return doc;
}

function drawSeedFormII(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'ENVIRONMENT (PROTECTION) RULES, 1986', 'FORM II (SEE RULE 8)', 'MEMORANDUM TO GOVERNMENT ANALYST');
  drawFromTo(doc, p, r);
  para(doc, p, 'The portion of sample described below is sent herewith for analysis under Rule 6 of the Environment (Protection) Rules, 1986.');
  para(doc, p, 'The portion of sample has been marked by me with the following mark:');
  details(doc, p, [
    ['1. Serial No. of the sample', r.serialNo],
    ['2. Code No. of the sample', r.codeNo],
    ['3. Date and place of collection', `${fmtDate(r.collectionDate)} - ${r.collectionPlace}`],
    ['4. Nature of article submitted', r.nature],
    ['5. Crop & Variety', `${r.crop} - ${r.variety}`],
    ['6. Lot No. of the sample', r.lotNo],
    ['7. Quantity of sample drawn', FORM_II_COTTON_QUANTITY],
    ['8. Name and designation of the person who sends the sample', r.fromAddress],
  ]);
  footer(doc, p, r, { compact: true });
}

function drawSeedFormV(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'FORM V', '', 'MEMORANDUM TO GOVERNMENT ANALYST');
  drawFromTo(doc, p, r);
  para(doc, p, 'The portion of the sample described below is sent herewith for analysis under Clause (b) of Sub Section (1) of Section 14 and Clauses (b) and (c) of Sub Section (2) of Section 15 of the Seeds Act, 1966.');
  para(doc, p, 'The portion of the sample has been marked by me with the following mark.');
  details(doc, p, [
    ['1. Serial No. of the sample', r.serialNo],
    ['2. Code No. of the sample', r.codeNo],
    ['3. Date and place of collection', `${fmtDate(r.collectionDate)} - ${r.collectionPlace}`],
    ['4. Nature of article submitted', r.nature],
    ['5. Crop & Variety', `${r.crop} - ${r.variety}`],
    ['6. Lot No. of the sample', r.lotNo],
    ['7. Quantity of sample drawn', r.quantityDrawn],
    ['8. Name and designation of the person who sends the sample', r.fromAddress],
  ]);
  para(doc, p, 'A copy of this memo and specimen impression of the seal used to seal the packet of samples is being sent separately by post.');
  footer(doc, p, r);
}

function drawSeedFormVI(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_TITLE_SIZE);
  doc.text('FORM VI', 105, p.y, { align: 'center' });
  p.y += 8;
  doc.setFontSize(PDF_SUBTITLE_SIZE);
  doc.text('FORM OF NOTICE', 105, p.y, { align: 'center' });
  p.y += 18;

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_BODY_SIZE);
  doc.text('To', 20, p.y);
  p.y += 7;
  const dealerAddress = [r.dealerName, r.dealerAddress, r.premisesLocation].filter(Boolean).join('\n');
  doc.text(doc.splitTextToSize(dealerAddress || '.......................................................', 170), 20, p.y);
  doc.setFont(PDF_FONT, 'normal');
  p.y += Math.max(24, doc.splitTextToSize(dealerAddress || '', 170).length * 6 + 8);

  const notice =
    'I hereby give you the notice of my intension to draw sample of Seed from the Stocks available at the above mentioned premises for the purpose of tests or analysis.';
  p.y += 8;
  doc.setFont(PDF_FONT, 'normal');
  doc.text(doc.splitTextToSize(notice, 170), 28, p.y);
  p.y += 38;

  doc.text(`Date : ${fmtDate(r.date) || '____ / ____ / ______'}`, 20, p.y);
  signatureRight(doc, Math.min(p.y + 16, 246), ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function drawSeedFormVIII(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'FORM VIII', '', 'DETAILS OF SAMPLES TAKEN');
  richPara(doc, p, [
    { text: 'I have this day ' },
    { text: fmtDate(r.collectionDate) || '____ / ____ / ______', bold: true },
    { text: ' taken from the premises of ' },
    { text: [r.dealerName, r.dealerAddress].filter(Boolean).join(', ') || '________________', bold: true },
    { text: ' situated at ' },
    { text: blank(r.premisesLocation), bold: true },
    { text: ' Samples of Seeds specified below to have same tested / Analyzed by Seed Analyst.' },
  ]);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(`Date: ${fmtDate(r.date) || '__________'}`, 28, p.y);
  doc.text('SEED INSPECTOR', 176, p.y, { align: 'right' });
  doc.setFont(PDF_FONT, 'normal');
  p.y += 12;
  details(doc, p, [
    ['1. Serial No. of the sample', r.serialNo],
    ['2. Code No. of the sample', r.codeNo],
    ['3. Date of collection', fmtDate(r.collectionDate)],
    ['4. Place of collection', r.collectionPlace],
    ['5. Nature of article submitted', r.nature],
    ['6. Lot No. of the sample', r.lotNo],
    ['7. Quantity of sample drawn', r.quantityDrawn],
    ['8. Crop', r.crop],
    ['9. Variety', r.variety],
    ['10. Class of Seed', r.seedClass],
    ['11. Date of Packing', fmtDate(r.packingDate)],
    ['12. Stock Position', r.stockPosition],
    ['13. Source of Supply', r.sourceOfSupply],
  ], 78);
  field(doc, p, 'Whether Cost of Sample Demanded?', r.costDemanded, 78);
  field(doc, p, 'Whether Cost Paid', r.costPaid, 78);
  const signatureY = Math.min(Math.max(p.y + 8, 224), 242);
  doc.setFont(PDF_FONT, 'bold');
  doc.text(['Signature of the party / Dealer', 'from whose premises samples taken', 'and payment made'], 28, signatureY);
  signatureRight(doc, signatureY, ['Seed Inspector/', 'Mandal Agriculture Officer']);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`Place: ${r.place || '__________'}`, 28, signatureY + 24);
  doc.text(`Date: ${fmtDate(r.date) || '__________'}`, 28, signatureY + 32);
}

function drawInfoSlips(doc, form, addPageBefore) {
  const r = resolveSeedValues(form);
  const tests = r.crop === 'Cotton' ? ['Germination, Purity & Moisture Test', 'BT Protein Test'] : [r.testRequired];
  tests.forEach((test, index) => {
    if (addPageBefore || index > 0) doc.addPage();
    drawInformationSlip(doc, {
      ...form,
      testRequired: test,
      testRequiredOther: '',
      quantityDrawn: cottonSlipQuantity(r.crop, test) || form.quantityDrawn,
    });
  });
}

function drawInformationSlip(doc, form) {
  const r = resolveSeedValues(form);
  const p = page(doc);
  title(doc, p, 'INFORMATION TO ACCOMPANY THE SAMPLE', '', 'INFORMATION SLIP');
  p.y += 4;
  details(doc, p, [
    ['1. Date of sampling', fmtDate(r.collectionDate)],
    ["2. Sender's name", r.officerName],
    ['3. Sender address', r.senderAddress],
    ['4. Name of the Crop', r.crop],
    ['5. Name of the Variety', r.variety],
    ['6. Origin / Class of seed', r.seedClass],
    ['7. Lot No. of Sample', r.lotNo],
    ['8. Code No. of Sample', r.codeNo],
    ['9. Quantity of sample drawn', r.quantityDrawn],
    ['10. Kind of test required', r.testRequired],
    ['11. Remarks', r.remarks],
  ]);
  signatureRight(doc, Math.min(p.y + 16, 252), ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function page(doc) {
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
  return { y: 20, margin: 20, width: 170 };
}

function title(doc, p, heading, subheading, titleText) {
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(PDF_TITLE_SIZE);
  doc.text(heading, 105, p.y, { align: 'center' });
  p.y += 8;
  if (subheading) {
    doc.setFontSize(PDF_BODY_SIZE);
    doc.text(subheading, 105, p.y, { align: 'center' });
    p.y += 8;
  }
  doc.setFontSize(PDF_SUBTITLE_SIZE);
  doc.text(titleText, 105, p.y, { align: 'center' });
  p.y += 14;
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(PDF_BODY_SIZE);
}

function drawFromTo(doc, p, r) {
  doc.setFont(PDF_FONT, 'bold');
  doc.text('From', 20, p.y);
  doc.text('To', 112, p.y);
  doc.text(doc.splitTextToSize(r.fromAddress || '________________', 78), 20, p.y + 7);
  doc.text(doc.splitTextToSize(r.labAddress || '________________', 78), 112, p.y + 7);
  doc.setFont(PDF_FONT, 'normal');
  p.y += 44;
}

function details(doc, p, rows, labelWidth = 82) {
  rows.forEach(([label, value]) => field(doc, p, label, value, labelWidth));
}

function field(doc, p, label, value, labelWidth = 82) {
  const x = p.margin;
  const valueX = x + labelWidth + 4;
  const width = 190 - valueX;
  const labelLines = doc.splitTextToSize(label, labelWidth);
  const valueLines = doc.splitTextToSize(blank(value), width);
  const lineHeight = 7;
  const height = Math.max(labelLines.length, valueLines.length) * lineHeight + 2;
  if (p.y + height > 250) {
    doc.addPage();
    p.y = 20;
  }
  doc.setFont(PDF_FONT, 'normal');
  doc.text(labelLines, x, p.y);
  doc.text(':', x + labelWidth, p.y);
  doc.text(valueLines, valueX, p.y);
  p.y += height;
}

function para(doc, p, value) {
  const lines = doc.splitTextToSize(value, p.width);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(lines, 20, p.y);
  p.y += lines.length * 7 + 4;
}

function richPara(doc, p, segments) {
  const xStart = 20;
  const maxX = xStart + p.width;
  const lineHeight = 7;
  let x = xStart;
  let y = p.y;

  segments.forEach((segment) => {
    const parts = String(segment.text || '').split(/(\s+)/).filter((part) => part.length > 0);
    doc.setFont(PDF_FONT, segment.bold ? 'bold' : 'normal');

    parts.forEach((part) => {
      const width = doc.getTextWidth(part);
      if (!/^\s+$/.test(part) && x + width > maxX) {
        y += lineHeight;
        x = xStart;
      }
      doc.text(part, x, y);
      x += width;
    });
  });

  doc.setFont(PDF_FONT, 'normal');
  p.y = y + lineHeight + 4;
}

function footer(doc, p, r, options = {}) {
  const y = options.compact ? Math.min(Math.max(p.y + 10, 224), 246) : 250;
  doc.setFont(PDF_FONT, 'normal');
  doc.text(`Date: ${fmtDate(r.date) || '__________'}`, 24, y);
  doc.text(`Place: ${r.place || '__________'}`, 24, y + 8);
  signatureRight(doc, y, ['Seed Inspector/', 'Mandal Agriculture Officer']);
}

function signatureRight(doc, y, label) {
  doc.setFont(PDF_FONT, 'bold');
  const labelLines = Array.isArray(label) ? label : [label];
  doc.text(['Signature', ...labelLines], 176, y, { align: 'right' });
  doc.setFont(PDF_FONT, 'normal');
}

function fmtDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function blank(value) {
  return String(value || '').trim() || '________________';
}

function cottonSlipQuantity(crop, test) {
  if (crop !== 'Cotton') return '';
  if (test === 'BT Protein Test') return '25 grams * 3';
  if (test === 'Germination, Purity & Moisture Test') return '250 grams * 3';
  return '';
}

function openBlankSeedPdfTab() {
  const targetWindow = window.open('', '_blank');
  if (targetWindow) {
    targetWindow.opener = null;
    targetWindow.document.title = 'Preparing PDF...';
    targetWindow.document.body.innerHTML = '<p style="font-family: system-ui; padding: 24px;">Preparing PDF...</p>';
  }
  return targetWindow;
}

function openSeedDocInTab(doc, fileName, targetWindow) {
  const blob = new File([doc.output('blob')], fileName, { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = blobUrl;
  } else {
    window.open(blobUrl, '_blank', 'noopener,noreferrer');
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

function seedFileName(kind, form) {
  const date = fmtDate(form.date || form.collectionDate).replace(/\//g, '-');
  return `Seed_Form_${kind}_${form.codeNo || 'CodeNo'}_${date || 'Date'}.pdf`;
}

function loadSeedDrafts() {
  try {
    const raw = window.localStorage.getItem(DRAFTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSeedDraftName(name, form) {
  const fallback = form.codeNo || form.dealerName || form.officerName;
  return (name.trim() || fallback || `Draft ${new Date().toLocaleString('en-IN')}`).slice(0, 80);
}

function upsertSeedDraft(drafts, draft) {
  return [draft, ...drafts.filter((item) => item.name !== draft.name)].slice(0, 30);
}

export default SeedForms;
