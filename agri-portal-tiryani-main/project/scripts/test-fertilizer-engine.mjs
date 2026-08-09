import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const root = new URL('../src/features/fertilizerCalculator/', import.meta.url);
const tempDir = await mkdtemp(join(tmpdir(), 'fertilizer-engine-'));

try {
  const dataSource = await readFile(new URL('fertilizerData.ts', root), 'utf8');
  const engineSource = await readFile(new URL('fertilizerEngine.ts', root), 'utf8');

  const transpile = (source) =>
    ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
      },
    }).outputText;

  await writeFile(join(tempDir, 'fertilizerData.mjs'), transpile(dataSource));
  await writeFile(
    join(tempDir, 'fertilizerEngine.mjs'),
    transpile(engineSource.replace("from './fertilizerData'", "from './fertilizerData.mjs'"))
  );

  const { calculateFertilizers, round } = await import(`file:///${join(tempDir, 'fertilizerEngine.mjs').replace(/\\/g, '/')}`);
  const grades = [
    { name: 'DAP', n: 18, p: 46, k: 0, s: 0, bag_kg: 50, composition: { n: 18, p: 46 } },
    { name: 'MOP', n: 0, p: 0, k: 60, s: 0, bag_kg: 50, composition: { k: 60 } },
    { name: 'Urea', n: 46, p: 0, k: 0, s: 0, bag_kg: 45, composition: { n: 46 } },
  ];

  const result = calculateFertilizers({ n: 48, p: 20, k: 16 }, grades);
  const byName = Object.fromEntries(result.results.map((row) => [row.grade.name, row]));

  assert.equal(round(byName.DAP.kg), 43.48, 'DAP must meet 20 kg P2O5');
  assert.equal(round(byName.MOP.kg), 26.67, 'MOP must meet 16 kg K2O');
  assert.equal(round(byName.Urea.kg), 87.33, 'Urea must fill only remaining nitrogen after DAP contribution');
  assert.equal(round(result.supplied.n), 48, 'Supplied N must be close to 48 kg, not 56 kg');
  assert.ok(result.excess.n < 0.01, 'Excess N must be zero or near zero');

  console.log('fertilizer engine regression passed');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
