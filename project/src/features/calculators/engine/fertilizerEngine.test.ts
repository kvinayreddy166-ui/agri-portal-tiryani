import { describe, expect, it } from 'vitest';
import { calculateFertilizers, round } from './fertilizerEngine';
import type { FertilizerGrade } from './fertilizerTypes';

describe('fertilizerEngine', () => {
  it('calculates optimal fertilizer allocation satisfying NPK requirements', () => {
    const grades: FertilizerGrade[] = [
      { name: 'DAP', n: 18, p: 46, k: 0, s: 0, bag_kg: 50, composition: { n: 18, p: 46 } },
      { name: 'MOP', n: 0, p: 0, k: 60, s: 0, bag_kg: 50, composition: { k: 60 } },
      { name: 'Urea', n: 46, p: 0, k: 0, s: 0, bag_kg: 45, composition: { n: 46 } },
    ];

    const result = calculateFertilizers({ n: 48, p: 20, k: 16 }, grades);
    const byName = Object.fromEntries(result.results.map((row) => [row.grade.name, row]));

    expect(round(byName.DAP.kg)).toBe(43.48);
    expect(round(byName.MOP.kg)).toBe(26.67);
    expect(round(byName.Urea.kg)).toBe(87.33);
    expect(round(result.supplied.n)).toBe(48);
    expect(result.excess.n).toBeLessThan(0.01);
  });
});
