import type { jsPDF as JsPdfInstance } from 'jspdf';
import { setupPdfUnicodeFonts } from '../../../shared/lib/pdfUnicodeFonts';
import { applyDeterministicPdfMetadata } from '../../../shared/lib/pdfDeterministic';
import { mergePdfs } from '../../../shared/utils/pdfHelpers';
import type {
  ReanalysisCase,
  ReanalysisDeclarationValues,
  ReanalysisScnValues,
} from './reanalysisStore';

const PAGE = { marginX: 20, top: 20, bottom: 275, width: 210, height: 297 };
const BODY = 11;
const LINE = 6;

type Ctx = { doc: JsPdfInstance; y: number };

function createDoc(title: string) {
  return import('jspdf').then(({ jsPDF }) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    applyDeterministicPdfMetadata(doc, title);
    doc.setProperties({ title, subject: 'Fertilizer reanalysis', creator: 'AGRONIX' });
    return doc;
  });
}

function ensureSpace(ctx: Ctx, needed = 20) {
  if (ctx.y + needed > PAGE.bottom) {
    ctx.doc.addPage();
    ctx.y = PAGE.top;
  }
}

function line(ctx: Ctx, text: string, opts: { size?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; gap?: number } = {}) {
  const { size = BODY, bold = false, align = 'left', gap = LINE } = opts;
  ctx.doc.setFont('times', bold ? 'bold' : 'normal');
  ctx.doc.setFontSize(size);
  const x = align === 'center' ? PAGE.width / 2 : align === 'right' ? PAGE.width - PAGE.marginX : PAGE.marginX;
  ctx.doc.text(text, x, ctx.y, { align });
  ctx.y += gap;
}

function wrapped(ctx: Ctx, text: string, opts: { size?: number; bold?: boolean; indent?: number; gap?: number; align?: 'left' | 'center' | 'right' } = {}) {
  const { size = BODY, bold = false, indent = 0, gap = LINE, align = 'left' } = opts;
  ctx.doc.setFont('times', bold ? 'bold' : 'normal');
  ctx.doc.setFontSize(size);
  const maxWidth = PAGE.width - PAGE.marginX * 2 - indent;
  const lines = ctx.doc.splitTextToSize(text || ' ', maxWidth) as string[];
  for (const l of lines) {
    ensureSpace(ctx);
    const x = align === 'center' ? PAGE.width / 2 : align === 'right' ? PAGE.width - PAGE.marginX - indent : PAGE.marginX + indent;
    ctx.doc.text(l, x, ctx.y, { align });
    ctx.y += gap;
  }
}

function para(ctx: Ctx, text: string, opts: { indent?: number; gap?: number; justify?: boolean; bold?: boolean } = {}) {
  const { indent = 0, gap = LINE * 0.9, justify = false, bold = false } = opts;
  ctx.doc.setFont('times', bold ? 'bold' : 'normal');
  ctx.doc.setFontSize(BODY);
  const maxWidth = PAGE.width - PAGE.marginX * 2 - indent;
  const lines = ctx.doc.splitTextToSize(text, maxWidth) as string[];
  lines.forEach((l, i) => {
    ensureSpace(ctx);
    const isLast = i === lines.length - 1;
    const x = PAGE.marginX + indent;
    if (justify && !isLast) {
      const words = l.trim().split(/\s+/);
      if (words.length > 1) {
        const wordW = ctx.doc.getTextWidth(words.join(' '));
        const spaceW = (maxWidth - wordW) / (words.length - 1);
        let cx = x;
        words.forEach((w, wi) => {
          ctx.doc.text(w, cx, ctx.y);
          cx += ctx.doc.getTextWidth(w) + (wi < words.length - 1 ? spaceW : 0);
        });
      } else {
        ctx.doc.text(l, x, ctx.y);
      }
    } else {
      ctx.doc.text(l, x, ctx.y);
    }
    ctx.y += gap;
  });
}

function kv(ctx: Ctx, label: string, value: string | undefined, indent = 0) {
  if (!value) return;
  wrapped(ctx, `${label}: ${value}`, { indent });
}

const clean = (s?: string) => (s || '').trim();

// ---------------------------------------------------------------------------
// Declarations — wording follows the standard FCO reanalysis file formats.
// ---------------------------------------------------------------------------

function declHeader(ctx: Ctx, title: string) {
  line(ctx, 'GOVERNMENT OF TELANGANA', { size: 12, bold: true, align: 'center', gap: 3 });
  line(ctx, 'DEPARTMENT OF AGRICULTURE', { size: 12, bold: true, align: 'center', gap: 8 });
  line(ctx, title, { size: 13, bold: true, align: 'center', gap: 10 });
}

function declSignature(ctx: Ctx, lines: string[]) {
  ctx.y += 10;
  for (const l of lines) line(ctx, l, { align: 'right', size: l.startsWith('Signature') ? BODY : 10 });
  ctx.y += 4;
  line(ctx, '_____________________', { align: 'right' });
}

export async function generateDeclarationPdf(kind: 'dealer' | 'inspector' | 'authority', c: ReanalysisCase) {
  const v: ReanalysisDeclarationValues = c.declarations[kind];
  const doc = await createDoc(`${kind.toUpperCase()} DECLARATION - ${c.sample.sampleCode || 'Reanalysis'}`);
  await setupPdfUnicodeFonts(doc);
  const ctx: Ctx = { doc, y: PAGE.top };
  const s = c.sample;
  const fert = clean(s.fertilizerName) || 'the fertilizer';
  const firm = clean(s.dealerName) || 'the firm';
  const addr = clean(s.dealerAddress);
  const sampleDate = clean(s.samplingDate);
  const insp = c.declarations.inspector;

  if (kind === 'dealer') {
    declHeader(ctx, 'DECLARATION OF THE DEALER');
    const who = [
      clean(v.name),
      clean(v.fatherName) ? `S/o ${clean(v.fatherName)}` : '',
      clean(v.designation),
    ].filter(Boolean).join(', ');
    const inspName = clean(insp.name) || '[Name of the Fertilizer Inspector]';
    const inspRole = clean(insp.role) || clean(insp.designation) || 'Fertilizer Inspector';
    const inspPlace = clean(insp.jurisdiction) || clean(insp.place);
    para(ctx, `I, ${who || '[Name of the person responsible]'}, of M/s. ${firm}${addr ? `, ${addr}` : ''} do hereby declare that ${inspName}, ${inspRole}${inspPlace ? `, ${inspPlace}` : ''} has handed over the dealer portion to me after the drawl of the fertilizer sample of ${fert}${sampleDate ? ` on ${sampleDate}` : ''} from the above said premises in intact condition and the sample in question is genuine.`);
    ctx.y += 8;
    kv(ctx, 'Date', clean(v.date) || clean(v.receivedDate));
    kv(ctx, 'Place', clean(v.place));
    declSignature(ctx, [
      'Signature of the Dealer',
      'Stamp',
      firm ? `For ${firm}` : '',
      clean(v.designation),
    ].filter(Boolean));
  } else if (kind === 'inspector') {
    declHeader(ctx, 'DECLARATION OF THE FERTILIZER INSPECTOR');
    const role = clean(v.role) || clean(v.designation) || 'Fertilizer Inspector';
    const jurisdiction = clean(v.jurisdiction) || clean(v.place);
    para(ctx, `I, ${clean(v.name) || '[Name]'} working as ${role}${jurisdiction ? ` of ${jurisdiction}` : ''} do hereby declare that after the drawl of the fertilizer sample, ${fert}, from M/s ${firm}${addr ? `, ${addr}` : ''}${sampleDate ? ` on ${sampleDate}` : ''}, I have handed over the dealer portion sample, ${fert}, in intact form to the above said firm under acknowledgement and the sample in question is genuine.`);
    ctx.y += 8;
    kv(ctx, 'Date', clean(v.date));
    kv(ctx, 'Place', clean(v.place));
    declSignature(ctx, [
      `Signature & Stamp of the ${role}`,
      clean(v.place),
    ].filter(Boolean));
  } else {
    declHeader(ctx, 'DECLARATION OF THE NOTIFIED AUTHORITY');
    const divDist = [clean(v.division) ? `${clean(v.division)} Div` : '', clean(v.district) ? `${clean(v.district)} District` : ''].filter(Boolean).join(', ');
    para(ctx, `I, ${clean(v.name) || '[Name]'} working as ${clean(v.designation) || '[Designation]'}${divDist ? `, ${divDist}` : ''} do hereby declare that the Dealer Portion of the fertilizer sample, ${fert} drawn from M/s ${firm}${addr ? `, ${addr}` : ''}${sampleDate ? ` on ${sampleDate}` : ''}, is received from the Dealer${clean(v.receivedDate) ? ` on ${clean(v.receivedDate)}` : ''} for re-analysis, is in intact form and the sample in question is genuine.`);
    ctx.y += 8;
    kv(ctx, 'Date', clean(v.date));
    kv(ctx, 'Place', clean(v.place));
    declSignature(ctx, [
      'Signature & Stamp of the Notified Authority',
      clean(v.designation),
      divDist,
    ].filter(Boolean));
  }
  return doc;
}

// ---------------------------------------------------------------------------
// Show Cause Notice — follows the standard FCO SCN format.
// ---------------------------------------------------------------------------

export async function generateScnPdf(c: ReanalysisCase) {
  const v: ReanalysisScnValues = c.scn;
  const doc = await createDoc(`SHOW CAUSE NOTICE - ${c.sample.sampleCode || 'Reanalysis'}`);
  await setupPdfUnicodeFonts(doc);
  const ctx: Ctx = { doc, y: PAGE.top };
  const s = c.sample;
  const fert = clean(s.fertilizerName) || 'fertilizer';
  const firm = clean(s.dealerName) || '[Dealer name]';
  const addr = clean(s.dealerAddress);
  const dept = clean(v.designation) || 'Fertilizer Inspector';
  const officePlace = clean(v.officeAddress) || [clean(v.division), clean(v.district)].filter(Boolean).join(', ');
  const signerPlace = clean(v.division) || clean(v.district) || '';

  line(ctx, 'GOVERNMENT OF TELANGANA STATE', { size: 12, bold: true, align: 'center', gap: 3 });
  line(ctx, 'DEPARTMENT OF AGRICULTURE', { size: 12, bold: true, align: 'center', gap: 8 });
  if (clean(v.noticeNumber)) line(ctx, `No. ${clean(v.noticeNumber)},`, { gap: 2 });
  line(ctx, `Dt. ${clean(v.noticeDate) || new Date().toLocaleDateString('en-GB')}.`, { gap: 6 });
  line(ctx, 'Office of the', { bold: true, gap: 2 });
  wrapped(ctx, dept, { bold: true, gap: 2 });
  if (officePlace) wrapped(ctx, officePlace, { bold: true, gap: 12 });
  else ctx.y += 8;

  line(ctx, 'SHOW CAUSE NOTICE', { size: 13, bold: true, align: 'center', gap: 8 });

  const sub = `Sub: F.C.O.-1985 – Drawal of fertilizer sample ${fert} from the premises of M/s. ${firm}${addr ? ` situated at ${addr}` : ''} – Analytical report received as not according to the specification${clean(v.violation) ? ` & fails in ${clean(v.violation)}` : ''} – Show cause notice issued – Reg.`;
  wrapped(ctx, sub, { bold: true, gap: 5 });

  const refs: string[] = [];
  const formLRef = [
    clean(v.formLNumber) ? `Form-L No. ${clean(v.formLNumber)}` : '',
    clean(v.formLDate) ? `dt. ${clean(v.formLDate)}` : '',
    clean(v.memoNumber) ? `communicated through Memo No. ${clean(v.memoNumber)}${clean(v.memoDate) ? `, dated ${clean(v.memoDate)}` : ''}` : '',
  ].filter(Boolean).join(', ');
  if (formLRef) refs.push(`Analytical report in Form-L ${formLRef}.`);
  if (clean(v.communicatedDate)) refs.push(`Form-L analytical report served to the dealer on ${clean(v.communicatedDate)}.`);
  if (refs.length) {
    line(ctx, 'Ref:', { bold: true, gap: 2 });
    refs.forEach((r, i) => wrapped(ctx, `${i + 1}. ${r}`, { indent: 4, size: 10, gap: 3 }));
    ctx.y += 3;
  }

  const insp = c.declarations.inspector;
  const inspectorDesc = clean(insp.role) || clean(insp.designation) || dept;
  const inspectorPlace = clean(insp.jurisdiction) || clean(insp.place);
  const sampledOn = clean(s.samplingDate);
  const manufacturer = clean(v.manufacturerName);

  para(ctx, `You are hereby informed that M/s. ${firm}${addr ? ` situated at ${addr}` : ''} was inspected by the ${inspectorDesc}${inspectorPlace ? `, ${inspectorPlace}` : ''}${sampledOn ? ` on ${sampledOn}` : ''} and a fertilizer sample of ${fert}${manufacturer ? ` manufactured by M/s ${manufacturer}` : ''} was drawn and sent for analysis.`);
  ctx.y += 2;
  const finding = clean(v.violation) || 'the sample is not according to specifications';
  para(ctx, `Vide reference 1st cited, the analytical report in Form-L declares the sample as "${finding}".${clean(v.communicatedDate) ? ` The same was communicated to the dealer on ${clean(v.communicatedDate)}.` : ''}`);
  ctx.y += 2;
  para(ctx, `Thus the above analytical report is confirmed and it is evident that you have contravened the provisions of ${clean(v.clauseReference) || 'the Fertilizer Control Order, 1985'}.`);
  ctx.y += 2;
  para(ctx, 'Therefore, you are hereby called upon to show cause as to why legal action should not be initiated besides administrative action and why prosecution should not be launched against you in exercise of the powers vested in me under clause 31 of the Fertilizer Control Order, 1985.');
  ctx.y += 4;

  para(ctx, 'Further, the Dealer, Distributor and Manufacturer are requested to furnish the following particulars of the person responsible which are required for launching prosecution.', { bold: true });
  line(ctx, 'Persons Responsible — Dealer, Distributor and Manufacturer', { bold: true, gap: 3 });
  const particulars = [
    'Name with surname',
    "Father's name",
    'Age',
    'Designation',
    'Firm name and detailed address (office and residence with contact number and PIN code)',
  ];
  const letters = ['a', 'b', 'c', 'd', 'e'];
  particulars.forEach((p, i) => wrapped(ctx, `${letters[i]}. ${p}`, { indent: 6, gap: 3 }));
  ctx.y += 3;
  para(ctx, `You are requested to furnish your explanation along with the above particulars and submit to this office within (${clean(v.replyDays) || '10'}) days from the date of receipt of this show cause notice, failing which necessary action will be taken as per the records available in this office.`);
  ctx.y += 3;
  para(ctx, 'Acknowledge the receipt of this show cause notice.', { bold: true });
  ctx.y += 5;

  line(ctx, 'Encl: (1) Analytical report.', { size: 10 });
  ctx.y += 14;

  // Signature / recipient blocks — left aligned, as in the reference SCN.
  if (firm !== '[Dealer name]') {
    wrapped(ctx, `For M/s. ${firm}`, { bold: true, gap: 2 });
    const dealerRole = clean(c.declarations.dealer.designation) || 'Proprietor';
    line(ctx, dealerRole, { gap: 6 });
  }
  line(ctx, 'Notified Authority and', { bold: true, gap: 2 });
  wrapped(ctx, dept, { gap: 2 });
  if (signerPlace) line(ctx, signerPlace, { gap: 8 });

  // To: dealer / distributor / manufacturer addresses
  const toBlocks: { name: string; address: string }[] = [];
  if (firm !== '[Dealer name]') toBlocks.push({ name: `M/s. ${firm}`, address: addr });
  if (clean(v.distributorName)) toBlocks.push({ name: `M/s. ${clean(v.distributorName)}`, address: clean(v.distributorAddress) });
  if (manufacturer) toBlocks.push({ name: `M/s. ${manufacturer}${clean(v.manufacturerAddress) ? `, ${clean(v.manufacturerAddress)}` : ''}`, address: '' });
  if (toBlocks.length) {
    line(ctx, 'To:', { bold: true, gap: 3 });
    toBlocks.forEach((b) => {
      wrapped(ctx, b.name, { bold: true, gap: 1 });
      if (b.address) wrapped(ctx, b.address, { gap: 1 });
      ctx.y += 3;
    });
  }
  ctx.y += 6;

  const copies = v.copies.map(clean).filter(Boolean);
  const defaultCopies = [
    `${inspectorDesc || 'Fertilizer Inspector'}${inspectorPlace ? `, ${inspectorPlace}` : ''}, with instructions to serve the copy to the dealer and submit the dated acknowledgement to this office for further action.`,
    clean(v.district) ? `Copy submitted to the District Agriculture Officer, ${clean(v.district)} for favour of kind information.` : '',
  ].filter(Boolean);
  const copyLines = copies.length ? copies : defaultCopies;
  if (copyLines.length) {
    line(ctx, 'Copy to:', { bold: true, gap: 3 });
    copyLines.forEach((cp, i) => wrapped(ctx, `${i + 1}. ${cp}`, { indent: 4, size: 10, gap: 3 }));
  }
  return doc;
}

// ---------------------------------------------------------------------------
// Covering letter — From/To letterhead format with refs, enclosures, copies.
// ---------------------------------------------------------------------------

export async function generateCoveringLetterPdf(c: ReanalysisCase) {
  const l = c.letter;
  const doc = await createDoc(`COVERING LETTER - ${c.sample.sampleCode || 'Reanalysis'}`);
  await setupPdfUnicodeFonts(doc);
  const ctx: Ctx = { doc, y: PAGE.top };

  line(ctx, 'GOVERNMENT OF TELANGANA', { size: 11, bold: true, align: 'center', gap: 3 });
  line(ctx, 'DEPARTMENT OF AGRICULTURE', { size: 11, bold: true, align: 'center', gap: 6 });
  ctx.y += 2;

  if (clean(l.fromName) || clean(l.fromDesignation) || clean(l.fromAddress)) {
    line(ctx, 'From', { bold: true, gap: 2 });
    if (clean(l.fromName)) wrapped(ctx, clean(l.fromName), { bold: true, gap: 2 });
    if (clean(l.fromDesignation)) wrapped(ctx, clean(l.fromDesignation), { gap: 2 });
    if (clean(l.fromAddress)) wrapped(ctx, clean(l.fromAddress), { gap: 6 });
  }
  if (clean(l.toName) || clean(l.toDesignation) || clean(l.toAddress)) {
    line(ctx, 'To,', { bold: true, gap: 2 });
    if (clean(l.toName)) wrapped(ctx, clean(l.toName), { bold: true, gap: 2 });
    if (clean(l.toDesignation)) wrapped(ctx, clean(l.toDesignation), { gap: 2 });
    if (clean(l.toAddress)) wrapped(ctx, clean(l.toAddress), { gap: 8 });
  }

  wrapped(ctx, clean(l.salutation) || 'Sir/Madam,');
  ctx.y += 2;

  if (clean(l.letterNumber)) line(ctx, `Lr. No. ${clean(l.letterNumber)}${clean(l.letterDate) ? `, Dt: ${clean(l.letterDate)}` : ''}`, { gap: 3 });
  if (clean(l.financialYear)) line(ctx, `Financial Year: ${clean(l.financialYear)}`, { size: 10, gap: 3 });
  if (clean(l.subject)) wrapped(ctx, `Sub: ${clean(l.subject)}`, { bold: true, gap: 4 });

  const refs = l.references.map(clean).filter(Boolean);
  if (refs.length) {
    line(ctx, 'Ref:', { bold: true, gap: 2 });
    refs.forEach((r, i) => wrapped(ctx, `${i + 1}. ${r}`, { indent: 4, size: 10, gap: 3 }));
    ctx.y += 3;
  }
  if (clean(l.memoNumber)) line(ctx, `Memo No. ${clean(l.memoNumber)}${clean(l.memoDate) ? `, Dt: ${clean(l.memoDate)}` : ''}`, { size: 10, gap: 6 });

  const paragraphs = l.paragraphs.map(clean).filter(Boolean);
  if (paragraphs.length) {
    paragraphs.forEach((p) => para(ctx, p));
  } else if (clean(l.body)) {
    para(ctx, clean(l.body));
  } else {
    const fert = clean(c.sample.fertilizerName) || 'fertilizer';
    const code = clean(c.sample.sampleCode);
    const firm = clean(c.sample.dealerName) || 'the dealer';
    const sdate = clean(c.sample.samplingDate);
    const insp = c.declarations.inspector;
    const inspName = clean(insp.name);
    const inspRole = clean(insp.role) || clean(insp.designation) || 'Fertilizer Inspector';
    const inspPlace = clean(insp.jurisdiction) || clean(insp.place);
    const commDate = clean(c.scn.communicatedDate);
    const formLNo = clean(c.scn.formLNumber);
    const formLDate = clean(c.scn.formLDate);
    const finding = clean(c.scn.violation) || 'Non-Standard';

    para(ctx, `I herewith submit that${inspName ? ` Sri. ${inspName}` : ''}, ${inspRole}${inspPlace ? `, ${inspPlace}` : ''} has drawn the fertilizer sample${code ? ` (Act Sample) ${code}` : ''} of ${fert}${sdate ? ` on ${sdate}` : ''} and the result of the sample is communicated as ${finding}${formLDate ? ` on Dt. ${formLDate}` : ''}${formLNo ? ` vide Form-L No. ${formLNo}` : ''}${commDate ? ` and the same was communicated to the dealer on ${commDate}` : ''}.`);
    ctx.y += 2;
    para(ctx, `The sample is drawn from the premises of M/s ${firm}${clean(c.sample.dealerAddress) ? `, ${clean(c.sample.dealerAddress)}` : ''}. The dealer has requested to send the sample for re-analysis under the provisions of the Fertilizer (Control) Order, 1985.`);
    ctx.y += 2;
    para(ctx, 'I am directed to submit herewith the dealer portion of the sample along with the connected documents for re-analysis, as required.');
  }
  ctx.y += 4;

  const defaultEnclosures = [
    'Dealer Sample.',
    'Reply & Requisition of Dealer & Manufacturer for reanalysis.',
    'Dated Acknowledgement of analytical report (Form-L) by the Dealer.',
    'Copy of Form J, Form P, Form K with attestation.',
    'Copy of Non-Standard Form "L" with attestation.',
    'Declaration by the Dealer.',
    'Declaration by the Fertilizer Inspector / Mandal Agriculture Officer.',
    'Declaration by the Asst. Director of Agriculture / Notified Authority.',
    'Bharatkosh.gov.in receipt portal transaction.',
  ];
  const enclosureLines = l.items.length
    ? l.items.map((item, i) => {
        const label = item.label || `Document ${i + 1}`;
        const refsStr = [item.reference, item.enclosure].filter(Boolean).join(' | ');
        return `${label}${refsStr ? ` — ${refsStr}` : ''}`;
      })
    : defaultEnclosures;
  if (enclosureLines.length) {
    line(ctx, 'The following documents are enclosed herewith:', { bold: true, gap: 4 });
    enclosureLines.forEach((label, i) => {
      ensureSpace(ctx, 16);
      wrapped(ctx, `${i + 1}. ${label}`, { indent: 5, gap: 4 });
    });
    ctx.y += 4;
  }

  const copies = l.copies.map(clean).filter(Boolean);

  ctx.y += 14;
  line(ctx, 'Thank You Sir.', { gap: 8 });
  line(ctx, clean(l.closing) || 'Yours faithfully,', { gap: 4 });
  ctx.y += 14;
  line(ctx, '__________________________', { align: 'right' });
  if (clean(l.fromDesignation)) line(ctx, clean(l.fromDesignation), { align: 'right', size: 10 });
  else if (clean(l.fromName)) line(ctx, clean(l.fromName), { align: 'right', size: 10 });
  if (clean(l.division)) line(ctx, `${clean(l.division)} (Div).`, { align: 'right', size: 10 });
  ctx.y += 10;

  if (copies.length) {
    line(ctx, 'Copy to:', { bold: true, gap: 3 });
    copies.forEach((cp, i) => wrapped(ctx, `${i + 1}. ${cp}`, { indent: 4, size: 10, gap: 3 }));
  }
  return doc;
}

export interface ReanalysisExtraDoc {
  name: string;
  blob: Blob;
}

/**
 * Builds the combined reanalysis case PDF:
 * Covering Letter → SCN → Declarations (Dealer, Inspector, Authority) → uploads.
 */
export async function generateCombinedReanalysisPdf(
  c: ReanalysisCase,
  extraDocs: ReanalysisExtraDoc[] = []
): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib');

  const letterDoc = await generateCoveringLetterPdf(c);
  const scnDoc = await generateScnPdf(c);
  const declDocs = await Promise.all(
    (['dealer', 'inspector', 'authority'] as const).map((k) => generateDeclarationPdf(k, c))
  );

  const merged = await PDFDocument.create();
  const appendDoc = async (d: JsPdfInstance) => {
    const bytes = new Uint8Array(d.output('arraybuffer') as ArrayBuffer);
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  };

  await appendDoc(letterDoc);
  await appendDoc(scnDoc);
  for (const d of declDocs) await appendDoc(d);

  const generatedBytes = await merged.save();
  const files: File[] = [
    new File([generatedBytes as BlobPart], `reanalysis-core-${c.sample.sampleCode || c.id}.pdf`, { type: 'application/pdf' }),
    ...extraDocs.map(
      (d) => new File([d.blob], d.name, { type: d.blob.type || 'application/pdf' })
    ),
  ];

  return mergePdfs(files);
}
