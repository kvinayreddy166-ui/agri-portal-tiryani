import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'node:fs';

const out = 'G:/agri-portal-tiryani/AGRONIX-Project-Intro.pdf';
const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const W = doc.internal.pageSize.getWidth();
const H = doc.internal.pageSize.getHeight();
const M = 48;
const CW = W - M * 2;

const EMERALD = [4, 120, 87];
const EMERALD_DARK = [6, 78, 59];
const GOLD = [180, 130, 20];
const SLATE = [51, 65, 85];
const GREY = [100, 116, 139];

let y = 0;
function ensure(needed = 40) {
  if (y + needed > H - 56) { doc.addPage(); y = M; }
}
function heading(text, size = 15) {
  ensure(size + 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.setTextColor(...EMERALD_DARK);
  doc.text(text, M, y);
  y += size * 0.55;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.4);
  doc.line(M, y + 2, M + 46, y + 2);
  y += 14;
}
function para(text, size = 9.5, gap = 6) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(text, CW);
  ensure(lines.length * size * 0.48 + gap);
  doc.text(lines, M, y);
  y += lines.length * size * 0.48 + gap;
}
function bullets(items) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, CW - 18);
    ensure(lines.length * 13 + 4);
    doc.setFillColor(...GOLD);
    doc.circle(M + 4, y - 3, 1.8, 'F');
    doc.setTextColor(...SLATE);
    doc.text(lines, M + 14, y);
    y += lines.length * 13 + 4;
  }
  y += 4;
}
function footer() {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text('AGRONIX — Agricultural Governance & Agronomy Operating System  •  MAO Tiryani, Telangana', M, H - 30);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 30, { align: 'right' });
  }
}

// ---------- Cover ----------
doc.setFillColor(...EMERALD_DARK);
doc.rect(0, 0, W, H, 'F');
doc.setFillColor(...EMERALD);
doc.rect(0, H - 210, W, 210, 'F');
doc.setDrawColor(...GOLD);
doc.setLineWidth(2);
doc.line(M, 120, W - M, 120);

doc.setFont('helvetica', 'bold');
doc.setFontSize(42);
doc.setTextColor(255, 255, 255);
doc.text('AGRONIX', M, 210);
doc.setFontSize(15);
doc.setTextColor(212, 175, 55);
doc.text('Agricultural Governance & Agronomy Operating System', M, 244);

doc.setFont('helvetica', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(203, 213, 225);
const subtitle = doc.splitTextToSize(
  'Official Field Operations, Statutory Enforcement & Agronomy Intelligence Platform — Mandal Agricultural Office (MAO), Tiryani, Kumram Bheem Asifabad District, Department of Agriculture, Government of Telangana.',
  CW
);
doc.text(subtitle, M, 285);

doc.setFontSize(10);
doc.setTextColor(148, 163, 184);
doc.text('Bilingual (English / Telugu)  •  Offline-First PWA  •  React 18 + TypeScript + Vite + Supabase', M, 285 + subtitle.length * 14 + 18);

// Stat chips
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(255, 255, 255);
const stats = ['15+ Modules', 'Statutory PDF Engines', 'RAG Knowledge Base', 'Offline PWA + Android'];
let sx = M;
doc.setFontSize(10);
for (const s of stats) {
  const w = doc.getTextWidth(s) + 24;
  doc.setDrawColor(212, 175, 55);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sx, H - 160, w, 30, 15, 15, 'FD');
  doc.setTextColor(...EMERALD_DARK);
  doc.text(s, sx + 12, H - 141);
  sx += w + 10;
}

// ---------- Page 2 ----------
doc.addPage();
y = M;
heading('1. About the Project', 16);
para('AGRONIX is an enterprise-grade, bilingual (English & Telugu), offline-first digital governance and agronomic management system engineered for grassroots agricultural administration in the Government of Telangana. Developed for the Mandal Agricultural Office (MAO), Tiryani — a predominantly tribal, remote agrarian jurisdiction — it bridges field inspection realities, statutory law enforcement, and real-time farmer advisory.');
para('Agricultural extension officers manage regulatory, administrative and agronomic responsibilities across vast rural areas with unreliable connectivity. AGRONIX replaces disconnected paper registers and spreadsheets with a single digital workbench covering statutory enforcement, sample management, input dealer stock, subsidy schemes, and crop advisory.');

heading('2. Key Features', 16);
bullets([
  'Automated statutory legal engines — court-ready Show Cause Notices, Seizure Orders, Stop Sale Orders and Revocations with bilingual rendering, watermarking and strict clause citation.',
  'Confidential Sampling Hub — dual-coding registers, Fertilizer Form J/K/L, Pesticide Form XX/XXI and Seed Form VIII generation, covering letters with date lifecycle automation.',
  'Hybrid AI Knowledge Base (RAG) — pgvector + Ollama (bge-m3 embeddings, llama3.2) with cited answers from official Acts, Rules and Government Orders.',
  'On-device agronomic intelligence — crop disease detection, NPK fertilizer recommendations, tank-mix calculators and acreage converters that work fully offline.',
  'Supply chain & subsidy transparency — dealer stock reconciliation, IFMS validation and beneficiary tracking for NFSM and state seed allocations.',
  'Enforcement Tracker — end-to-end case management linking notices, samples, lab results and prosecution status.',
]);

heading('3. Module Directory', 16);
autoTable(doc, {
  startY: y,
  head: [['Module', 'Purpose']],
  body: [
    ['Dashboard', 'Mandal overview, weather, mandi prices, maps and officer KPIs'],
    ['Sampling Hub', 'Statutory forms, covering letters, dispatched-sample tracking'],
    ['Officer Toolkit', 'Field tools, inspections, enforcement tracker, government portals'],
    ['Saved Records & Storage', 'Officer records synced to cloud archive (R2 + Supabase)'],
    ['Farmer Database', 'Farmer registry, Excel import, urea requirement analytics'],
    ['Dealer Stock Portal', 'Fertilizer/seed/pesticide stock, receipts, sales and analytics'],
    ['Farm Calculators', 'Acreage, fertilizer, pesticide, seed rate, irrigation, profitability, soil health'],
    ['Crop Doctor / Intelligence', 'Crop advisory, protection recommendations, pest & disease guidance'],
    ['Agrochemical Database', 'Pesticide catalogue, toxicity bands, CIBRC data'],
    ['Knowledge Base', 'RAG document library, assistant, search and analytics (admin)'],
    ['Documents', 'Forms library, GOs & circulars, file directory'],
    ['Schemes', 'Subsidy tracking, farm mechanization, beneficiary records'],
    ['Quality Control', 'QC targets and sample analysis tracking'],
    ['Tour Diary', 'Monthly tour diaries, journeys, leaves and holidays'],
    ['Contacts', 'Officer contact directory (AEO/MAO)'],
  ],
  styles: { fontSize: 8.5, cellPadding: 4, textColor: SLATE },
  headStyles: { fillColor: EMERALD, textColor: 255, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [241, 245, 249] },
  margin: { left: M, right: M },
});
y = doc.lastAutoTable.finalY + 16;

heading('4. Technical Architecture', 16);
para('Frontend: React 18 + TypeScript SPA built with Vite, deployed on Vercel as an installable PWA with offline service worker and Android packaging via Capacitor. Backend: Supabase (PostgreSQL 17, Auth, Storage, Edge Functions in Deno) with Row Level Security on all tables. AI services run server-side only — Ollama embeddings/LLM on a separate VPS, secrets held in Edge Function environment variables and never exposed to the browser. Generated legal documents are archived to Cloudflare R2 via a dedicated storage worker.');

heading('5. Security & Compliance', 16);
bullets([
  'Supabase Auth with email OTP verification, Cloudflare Turnstile bot protection, and strict password policy on registration/reset.',
  'RLS policies enforce admin/officer/dealer role separation; service-role keys exist only inside Edge Functions.',
  'Officer document archive uses client-side encryption and compression before cloud storage.',
  'Statutory documents carry watermark protection and bilingual (English/Telugu) rendering per departmental format.',
]);

doc.addPage();
y = M;
heading('6. Statutory & Legal Coverage', 16);
para('AGRONIX embeds the legal framework governing agricultural inputs in India:');
bullets([
  'Essential Commodities Act, 1955 and FCO 1985 — fertilizer enforcement, stop-sale, seizure and revocation workflows.',
  'Seeds Act, 1966 — seed sample forms and licensing checks.',
  'Insecticides Act, 1968 — pesticide inspection, sample drawal and CIBRC formulation compliance.',
  'Fertiliser Control Order clauses, forms schedules and enforcement mind-maps built into the Officer Toolkit.',
]);

heading('7. Deployment', 16);
para('The application is a static Vite SPA hosted on Vercel with SPA rewrites and cache headers. Database migrations are applied via the Supabase CLI (supabase db push) and Edge Functions deployed with supabase functions deploy. An Android build is produced through Capacitor for field officers requiring a native install.');

heading('8. Project Repository Layout', 16);
autoTable(doc, {
  startY: y,
  head: [['Path', 'Contents']],
  body: [
    ['project/src/app', 'Router, page switcher, layout shell'],
    ['project/src/features', 'Feature modules (dashboard, sampling-hub, officers-toolkit, calculators, knowledge-base, etc.)'],
    ['project/src/shared', 'UI kit, contexts, Supabase client, utilities'],
    ['supabase/migrations', 'PostgreSQL schema migrations'],
    ['supabase/functions', 'Deno Edge Functions (OTP, RAG, ogd-proxy, account deletion)'],
    ['workers/', 'Cloudflare storage worker for officer records'],
    ['docs/', 'Architecture and project documentation'],
  ],
  styles: { fontSize: 8.5, cellPadding: 4, textColor: SLATE },
  headStyles: { fillColor: EMERALD, textColor: 255, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [241, 245, 249] },
  margin: { left: M, right: M },
});

footer();
fs.writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
console.log('Written:', out);
