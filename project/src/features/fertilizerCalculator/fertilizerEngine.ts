import { NUTRIENT_LABELS, PRIMARY_NUTRIENTS } from './fertilizerData';
import type { FertilizerCalculation, FertilizerGrade, NutrientComposition, Nutrients } from './fertilizerTypes';

export type { Nutrients } from './fertilizerTypes';

export const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export const numberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const emptyNutrients = (): Nutrients => ({ n: 0, p: 0, k: 0 });

export function normalizeNutrientKey(key: string) {
  const normalized = key.trim();
  const lower = normalized.toLowerCase().replace(/[\s_-]+/g, '');
  if (lower === 'nitrogen' || lower === 'n') return 'n';
  if (lower === 'phosphorus' || lower === 'p' || lower === 'p2o5') return 'p';
  if (lower === 'potash' || lower === 'potassium' || lower === 'k' || lower === 'k2o') return 'k';
  if (lower === 'organiccarbon' || lower === 'oc') return 'organicCarbon';
  return lower;
}

export function nutrientLabel(key: string) {
  return NUTRIENT_LABELS[key] || key;
}

export function normalizeComposition(composition?: NutrientComposition | null): NutrientComposition {
  const result: NutrientComposition = {};
  Object.entries(composition || {}).forEach(([key, value]) => {
    const nutrient = normalizeNutrientKey(key);
    const amount = numberValue(value);
    if (amount > 0) result[nutrient] = amount;
  });
  return result;
}

export function gradeComposition(grade: FertilizerGrade): NutrientComposition {
  return normalizeComposition({
    n: grade.n,
    p: grade.p,
    k: grade.k,
    s: grade.s,
    ...(grade.composition || {}),
  });
}

export function nutrientsFromNpk(nutrients: Nutrients): Nutrients {
  return {
    ...normalizeComposition(nutrients as NutrientComposition),
    n: numberValue(nutrients.n),
    p: numberValue(nutrients.p),
    k: numberValue(nutrients.k),
  };
}

export function visibleNutrientKeys(...groups: Array<NutrientComposition | Nutrients | undefined>) {
  const keys = new Set<string>();
  groups.forEach((group) => {
    Object.entries(group || {}).forEach(([key, value]) => {
      if (numberValue(value) > 0) keys.add(normalizeNutrientKey(key));
    });
  });
  PRIMARY_NUTRIENTS.forEach((key) => keys.add(key));
  return [...keys];
}

export function calculateFertilizers(requiredInput: Nutrients, selected: FertilizerGrade[]): FertilizerCalculation {
  const required = nutrientsFromNpk(requiredInput);
  const quantities = new Map<string, number>();
  const remaining: Nutrients = { ...required };
  const selectedWithComposition = selected.map((grade) => ({ grade, composition: gradeComposition(grade) }));
  const nutrientOrder = visibleNutrientKeys(required)
    .filter((nutrient) => numberValue(required[nutrient]) > 0)
    .sort((a, b) => {
      if (a === 'n' && b !== 'n') return 1;
      if (b === 'n' && a !== 'n') return -1;
      return numberValue(required[b]) - numberValue(required[a]);
    });

  const addQuantity = (grade: FertilizerGrade, composition: NutrientComposition, kg: number) => {
    if (kg <= 0 || !Number.isFinite(kg)) return;
    const key = grade.id || grade.name;
    quantities.set(key, (quantities.get(key) || 0) + kg);
    Object.entries(composition).forEach(([nutrient, percent]) => {
      remaining[nutrient] = numberValue(remaining[nutrient]) - kg * (percent / 100);
    });
  };

  nutrientOrder.forEach((nutrient) => {
    if (numberValue(remaining[nutrient]) <= 0.01) return;
    const candidates = selectedWithComposition
      .filter(({ composition }) => numberValue(composition[nutrient]) > 0)
      .sort((a, b) => {
        const bTarget = numberValue(b.composition[nutrient]);
        const aTarget = numberValue(a.composition[nutrient]);
        const bPenalty = numberValue(b.composition.p) && nutrient !== 'p' ? numberValue(b.composition.p) : 0;
        const aPenalty = numberValue(a.composition.p) && nutrient !== 'p' ? numberValue(a.composition.p) : 0;
        return (bTarget - bPenalty * 0.35) - (aTarget - aPenalty * 0.35);
      });
    const best = candidates[0];
    if (!best) return;
    addQuantity(best.grade, best.composition, numberValue(remaining[nutrient]) / (numberValue(best.composition[nutrient]) / 100));
  });

  const results = selected.map((grade) => {
    const kg = quantities.get(grade.id || grade.name) || 0;
    const composition = gradeComposition(grade);
    const supplied = visibleNutrientKeys(composition).reduce<Nutrients>((total, nutrient) => {
      total[nutrient] = kg * (numberValue(composition[nutrient]) / 100);
      return total;
    }, emptyNutrients());
    return { grade, kg, bags: grade.bag_kg > 0 ? kg / grade.bag_kg : 0, supplied };
  });

  const allKeys = visibleNutrientKeys(required, ...results.map((row) => row.supplied));
  const supplied = results.reduce<Nutrients>((total, row) => {
    allKeys.forEach((nutrient) => {
      total[nutrient] = numberValue(total[nutrient]) + numberValue(row.supplied[nutrient]);
    });
    return total;
  }, emptyNutrients());

  const balance = allKeys.reduce<Nutrients>((total, nutrient) => {
    total[nutrient] = numberValue(required[nutrient]) - numberValue(supplied[nutrient]);
    return total;
  }, emptyNutrients());
  const excess = allKeys.reduce<Nutrients>((total, nutrient) => {
    total[nutrient] = Math.max(0, numberValue(supplied[nutrient]) - numberValue(required[nutrient]));
    return total;
  }, emptyNutrients());

  const remarks = allKeys
    .filter((nutrient) => numberValue(excess[nutrient]) > Math.max(1, numberValue(required[nutrient]) * 0.1))
    .map((nutrient) => `Excess ${nutrientLabel(nutrient)} supplied. Prefer a lower-${nutrientLabel(nutrient)} fertilizer where possible.`);

  return { results, supplied, balance, excess, remarks };
}
