// Move a batch of files and rewrite all relative imports.
// Usage: node scripts/move-batch.mjs <moves.json>   (run from project/)
// moves.json: { "old/src/rel/path.tsx": "new/src/rel/path.tsx", ... }
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(projectRoot, 'src');
const toPosix = (p) => p.split(path.sep).join('/');
const mapFile = process.argv[2];
if (!mapFile) { console.error('usage: move-batch.mjs <moves.json>'); process.exit(1); }
const MOVES = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

const EXTS = ['.tsx', '.ts', '.jsx', '.js', '.d.ts', '.css', '.json'];
function resolveOld(dirRelOld, spec) {
  const base = path.posix.normalize(path.posix.join(dirRelOld, spec));
  const hadExt = /\.[a-z]+$/i.test(spec);
  const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => `${base}/index${e}`)];
  for (const cand of candidates) {
    if (MOVES[cand]) return { rel: MOVES[cand], hadExt };
    if (fs.existsSync(path.join(SRC, cand)) && fs.statSync(path.join(SRC, cand)).isFile()) return { rel: cand, hadExt };
  }
  return null;
}

const DRY = process.argv.includes('--dry');
let moved = 0;
if (!DRY) {
  for (const [from, to] of Object.entries(MOVES)) {
    const fromAbs = path.join(SRC, from);
    if (!fs.existsSync(fromAbs)) { console.log(`  skip (missing): ${from}`); continue; }
    fs.mkdirSync(path.dirname(path.join(SRC, to)), { recursive: true });
    fs.renameSync(fromAbs, path.join(SRC, to));
    moved++;
  }
  console.log(`Moved ${moved}/${Object.keys(MOVES).length} files`);
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
let rewritten = 0, unresolved = 0;
for (const fileAbs of walk(SRC)) {
  const fileRel = toPosix(path.relative(SRC, fileAbs));
  const fileRelOld = oldLoc[fileRel] || fileRel;
  const dirRelOld = path.posix.dirname(fileRelOld);
  const dirRelNew = path.posix.dirname(newLoc(fileRel));
  const src = fs.readFileSync(fileAbs, 'utf8');
  let changed = false;
  const out = src.replace(SRC_RE, (m, kw, q, spec) => {
    if (!spec.startsWith('.')) return m;
    const resolved = resolveOld(dirRelOld, spec);
    if (!resolved) { unresolved++; console.log(`  UNRESOLVED ${fileRel}: ${spec}`); return m; }
    let rel = path.posix.relative(dirRelNew === '.' ? '' : dirRelNew, resolved.rel);
    if (!resolved.hadExt) rel = rel.replace(/\.(d\.ts|tsx?|jsx?|json|css)$/, '');
    if (!rel.startsWith('.')) rel = './' + rel;
    if (rel !== spec) changed = true;
    return kw + q + rel + q;
  });
  if (changed && !DRY) { fs.writeFileSync(fileAbs, out, 'utf8'); rewritten++; }
  else if (changed) rewritten++;
}
console.log(`${DRY ? '[dry] would rewrite' : 'Rewrote'} imports in ${rewritten} files, ${unresolved} unresolved`);
