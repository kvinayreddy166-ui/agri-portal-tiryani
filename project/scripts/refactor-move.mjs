// Phase 2 refactor: move shared/app files via `git mv` and rewrite relative imports.
// Usage: node scripts/refactor-move.mjs   (run from project/)
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(projectRoot, 'src');
const toPosix = (p) => p.split(path.sep).join('/');

const MOVES = {
  // app shell
  'App.tsx': 'app/App.tsx',
  'main.tsx': 'app/main.tsx',
  'index.css': 'app/index.css',
  'components/Layout.tsx': 'app/Layout.tsx',
  // shared
  'context/AuthContext.tsx': 'shared/context/AuthContext.tsx',
  'context/LanguageContext.tsx': 'shared/context/LanguageContext.tsx',
  'context/ThemeContext.tsx': 'shared/context/ThemeContext.tsx',
  'hooks/useBackButtonOverlay.ts': 'shared/hooks/useBackButtonOverlay.ts',
  'hooks/useCropData.js': 'shared/hooks/useCropData.js',
  'hooks/useVirtualRows.ts': 'shared/hooks/useVirtualRows.ts',
  'types/database.ts': 'shared/types/database.ts',
  'types/jsx-modules.d.ts': 'shared/types/jsx-modules.d.ts',
  'styles/design-system.css': 'shared/styles/design-system.css',
  'services/translationService.ts': 'shared/services/translationService.ts',
  'components/ErrorBoundary.tsx': 'shared/components/ErrorBoundary.tsx',
  'components/PopupHint.tsx': 'shared/components/PopupHint.tsx',
  'components/UpdateBanner.tsx': 'shared/components/UpdateBanner.tsx',
};

for (const [dir, dest] of [
  ['components/ui', 'shared/components/ui'],
  ['components/charts', 'shared/components/charts'],
  ['components/seo', 'shared/components/seo'],
  ['components/preview', 'shared/components/preview'],
  ['components/pdf', 'shared/components/pdf'],
  ['utils', 'shared/utils'],
]) {
  for (const f of fs.readdirSync(path.join(SRC, dir))) {
    MOVES[`${dir}/${f}`] = `${dest}/${f}`;
  }
}
for (const f of [
  'appVersion.ts', 'constants.ts', 'excelParser.ts', 'fileBlob.ts', 'filePreviewUrls.ts',
  'fileTypes.ts', 'networkStatus.ts', 'offlineCache.ts', 'pdfText.ts', 'pdfWatermark.ts',
  'pwaRecovery.ts', 'siteHits.ts', 'supabase.ts', 'uploadFile.ts',
]) {
  MOVES[`lib/${f}`] = `shared/lib/${f}`;
}

// Resolve a specifier against the OLD tree layout, returning the file's NEW location.
const EXTS = ['.tsx', '.ts', '.jsx', '.js', '.d.ts', '.css', '.json'];
function resolveOld(dirRelOld, spec) {
  const base = path.posix.normalize(path.posix.join(dirRelOld, spec));
  const candidates = MOVES[base] || (fs.existsSync(path.join(SRC, base)) && fs.statSync(path.join(SRC, base)).isFile())
    ? [base]
    : [...EXTS.map((e) => base + e), ...EXTS.map((e) => `${base}/index${e}`)];
  const hadExt = /\.[a-z]+$/i.test(spec);
  for (const cand of candidates) {
    if (MOVES[cand]) return { rel: MOVES[cand], hadExt };
    if (fs.existsSync(path.join(SRC, cand))) return { rel: cand, hadExt };
  }
  // old file moved: strip ext candidates through MOVES
  for (const ext of EXTS) {
    if (MOVES[base + ext]) return { rel: MOVES[base + ext], hadExt: false };
  }
  return null;
}

const DRY = process.argv.includes('--dry');
const movedPaths = Object.entries(MOVES).filter(([f]) => fs.existsSync(path.join(SRC, f)));

if (!DRY) {
  for (const [from, to] of movedPaths) {
    fs.mkdirSync(path.dirname(path.join(SRC, to)), { recursive: true });
    fs.renameSync(path.join(SRC, from), path.join(SRC, to));
  }
  console.log(`Moved ${movedPaths.length} files`);
}

const SRC_RE = /(from\s*|import\s*\(\s*|import\s+)(['"])([^'"]+)\2/g;
function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(p);
  }
  return files;
}

const newLoc = (rel) => MOVES[rel] || rel;
const oldLoc = {};
for (const [f, t] of Object.entries(MOVES)) oldLoc[t] = f;
let rewritten = 0;
for (const fileAbs of walk(SRC)) {
  const fileRel = toPosix(path.relative(SRC, fileAbs));
  // In apply mode files are already at new locations: resolve specifiers against
  // the file's ORIGINAL directory (where its old relative imports were valid).
  const fileRelOld = DRY ? fileRel : (oldLoc[fileRel] || fileRel);
  const dirRelOld = path.posix.dirname(fileRelOld);
  const dirRelNew = path.posix.dirname(newLoc(fileRel));
  const src = fs.readFileSync(fileAbs, 'utf8');
  let changed = false;
  const out = src.replace(SRC_RE, (m, kw, q, spec) => {
    if (!spec.startsWith('.')) return m;
    const resolved = resolveOld(dirRelOld, spec);
    if (!resolved) {
      console.log(`  UNRESOLVED ${fileRel}: ${spec}`);
      return m;
    }
    let rel = path.posix.relative(dirRelNew === '.' ? '' : dirRelNew, resolved.rel);
    if (!resolved.hadExt) rel = rel.replace(/\.(d\.ts|tsx?|jsx?|json|css)$/, '');
    if (!rel.startsWith('.')) rel = './' + rel;
    if (rel !== spec) changed = true;
    return kw + q + rel + q;
  });
  if (changed && !DRY) {
    fs.writeFileSync(fileAbs, out, 'utf8');
    rewritten++;
  } else if (changed) rewritten++;
}
console.log(`${DRY ? '[dry] would rewrite' : 'Rewrote'} imports in ${rewritten} files`);
