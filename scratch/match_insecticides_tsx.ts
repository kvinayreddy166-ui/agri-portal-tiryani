import fs from 'fs';
import { AGROCHEMICALS_DATA } from '../project/src/features/agrochemicals/data/agrochemicalsData';

const pdfRows = JSON.parse(fs.readFileSync('./scratch/extracted_crop_pest_insecticides.json', 'utf-8'));
console.log(`Total PDF rows: ${pdfRows.length}`);
console.log(`Total AGROCHEMICALS_DATA items: ${AGROCHEMICALS_DATA.length}`);

function normalizeName(s: string) {
  let str = s.toLowerCase().replace(/–/g, '-').replace(/—/g, '-');
  str = str.replace(/[\s/]+/g, ' ').trim();
  str = str.replace(/(\d+)\s*%/g, '$1%');
  str = str.replace(/% w\/w/g, '').replace(/w\/w/g, '').replace(/m\/m/g, '').replace(/min\./g, '').replace(/min/g, '');
  str = str.replace(/d\.p\./g, 'dp').replace(/w\.p\./g, 'wp').replace(/c\.g\./g, 'cg').replace(/g\.r\./g, 'gr');
  str = str.replace(/chlorpyriphos/g, 'chlorpyrifos');
  str = str.replace(/imidaclopride/g, 'imidacloprid');
  str = str.replace(/lambdacyhalothrin/g, 'lambda-cyhalothrin');
  return str.trim();
}

const activeMap = new Map<string, typeof AGROCHEMICALS_DATA[0]>();
for (const item of AGROCHEMICALS_DATA) {
  const norm = normalizeName(item.name);
  activeMap.set(norm, item);
  activeMap.set(norm.replace(/%/g, ''), item);
  // Base active
  const base = norm.replace(/[\d.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$/g, '').trim();
  if (base.length > 3 && !activeMap.has(base)) {
    activeMap.set(base, item);
  }
}

const uniquePdfInsecticides = Array.from(new Set(pdfRows.map((r: any) => r.insecticide))).sort();
console.log(`Unique PDF insecticides: ${uniquePdfInsecticides.length}`);

let matchedCount = 0;
const unmatched: string[] = [];
for (const ins of uniquePdfInsecticides as string[]) {
  const norm = normalizeName(ins);
  const normNoPct = norm.replace(/%/g, '');
  const base = norm.replace(/[\d.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$/g, '').trim();

  let found = activeMap.get(norm) || activeMap.get(normNoPct) || activeMap.get(base);
  if (!found) {
    for (const [k, v] of activeMap.entries()) {
      if (k === norm || (k.length > 5 && (k.includes(norm) || norm.includes(k)))) {
        found = v;
        break;
      }
    }
  }

  if (found) {
    matchedCount++;
  } else {
    unmatched.push(ins);
  }
}

console.log(`Matched insecticides: ${matchedCount} / ${uniquePdfInsecticides.length}`);
console.log(`Unmatched:`, unmatched);
