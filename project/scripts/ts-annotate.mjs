#!/usr/bin/env node
// Codemod: insert ": any" annotations at positions reported by tsc
// TS7006 (parameter), TS7031 (binding element), TS7034/TS7005 (variable).
// Usage: node scripts/ts-annotate.mjs < tsc-errors.txt

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const input = readFileSync(0, 'utf8');
const re = /^(.+?)\((\d+),(\d+)\): error (TS7006|TS7031|TS7034|TS7005)/;

/** @type {Map<string, {line:number,col:number,code:string}[]>} */
const byFile = new Map();
for (const raw of input.split(/\r?\n/)) {
  const m = re.exec(raw.trim());
  if (!m) continue;
  const [, file, line, col, code] = m;
  const abs = path.resolve(ROOT, file);
  if (!byFile.has(abs)) byFile.set(abs, []);
  byFile.get(abs).push({ line: +line, col: +col, code });
}

function identEnd(src, i) {
  let j = i;
  while (j < src.length && /[\w$]/.test(src[j])) j++;
  // optional marker
  if (src[j] === '?') j++;
  return j;
}

/** Find the offset of the parameter-level object-pattern `{` that opens
 *  the binding containing `pos`, plus its matching `}`. Returns [open, close]. */
function enclosingPattern(src, pos) {
  // walk back to the parameter-list paren: scan backwards counting parens
  let depth = 0, open = -1;
  for (let i = pos; i >= 0; i--) {
    const c = src[i];
    if (c === ')') depth++;
    else if (c === '(') {
      if (depth === 0) { open = i; break; }
      depth--;
    }
  }
  if (open < 0) return null;
  // iterate '{' occurrences after the paren; first one whose span
  // contains pos is the outermost pattern for that parameter
  for (let i = open + 1; i < pos; i++) {
    if (src[i] !== '{') continue;
    let d = 0, close = -1;
    for (let k = i; k < src.length; k++) {
      if (src[k] === '{') d++;
      else if (src[k] === '}') { d--; if (d === 0) { close = k; break; } }
    }
    if (close < 0) return null;
    if (close > pos) return [i, close];
    i = close; // skip this whole brace region
  }
  return null;
}

let patched = 0;
for (const [file, errs] of byFile) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  // line/col (1-based col in chars) → absolute offset
  const offs = errs.map((e) => {
    let o = 0;
    for (let l = 0; l < e.line - 1; l++) o += lines[l].length + 1;
    return { ...e, at: o + e.col - 1 };
  });
  // apply descending so offsets stay valid
  offs.sort((a, b) => b.at - a.at);
  let text = src;
  for (const e of offs) {
    if (e.code === 'TS7031') {
      const span = enclosingPattern(text, e.at);
      if (span) {
        text = text.slice(0, span[1] + 1) + ': any' + text.slice(span[1] + 1);
        patched++;
        continue;
      }
      // fallback: annotate identifier in place (invalid but rare; tsc will flag)
      const j = e.at + identEnd(text.slice(e.at), 0);
      text = text.slice(0, j) + ': any' + text.slice(j);
      patched++;
      continue;
    }
    const j = e.at + identEnd(text.slice(e.at), 0);
    // skip if already has annotation
    if (text[j] === ':') continue;
    text = text.slice(0, j) + ': any' + text.slice(j);
    patched++;
  }
  writeFileSync(file, text);
  console.log(`${path.relative(ROOT, file)}: ${errs.length} sites`);
}
console.log(`patched ${patched}`);
