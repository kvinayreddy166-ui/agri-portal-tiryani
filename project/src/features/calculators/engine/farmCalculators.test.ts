import { describe, expect, it } from 'vitest';
import { calculatePlantPopulation, SQ_METERS_PER_ACRE } from '../pages/PlantPopulationCalculator';
import { calculateAcreageResult, calculateAcreValues } from '../pages/AcreageCalculator';
import { calculateSeedRate } from '../pages/SeedRateCalculator';
import { calculatePesticide } from '../pages/PesticideCalculator';

describe('Farm Calculators Engine & Agronomy Formulas', () => {
  describe('PlantPopulationCalculator', () => {
    it('uses standard acre area constant 4046.86 m²', () => {
      expect(SQ_METERS_PER_ACRE).toBeCloseTo(4046.86, 2);
    });

    it('calculates accurate plant population for standard maize/cotton spacing in acres', () => {
      const { errors, result } = calculatePlantPopulation({
        cropName: 'Maize',
        areaValue: '1',
        areaUnit: 'acres',
        rowSpacing: '60',
        rowSpacingUnit: 'cm',
        plantSpacing: '20',
        plantSpacingUnit: 'cm',
      });

      expect(errors).toHaveLength(0);
      expect(result).not.toBeNull();
      if (!result) return;

      // Spacing in meters: 0.6m * 0.2m = 0.12 m² per plant
      expect(result.areaPerPlant).toBeCloseTo(0.12, 4);
      expect(result.plantsPerSqMeter).toBeCloseTo(1 / 0.12, 2);

      // Total plants in 1 acre = 4046.86 / 0.12 ≈ 33,724
      expect(Math.round(result.totalPlants)).toBe(33724);
      expect(Math.round(result.plantsPerAcre)).toBe(33724);
      // Plants in 1 hectare = 10000 / 0.12 ≈ 83,333
      expect(Math.round(result.plantsPerHectare)).toBe(83333);
    });

    it('calculates population in hectares and handles feet units', () => {
      const { errors, result } = calculatePlantPopulation({
        cropName: 'Orchard',
        areaValue: '2',
        areaUnit: 'hectares',
        rowSpacing: '10',
        rowSpacingUnit: 'feet',
        plantSpacing: '10',
        plantSpacingUnit: 'feet',
      });

      expect(errors).toHaveLength(0);
      expect(result).not.toBeNull();
      if (!result) return;

      // 10 ft = 3.048 m -> Area per plant = 3.048 * 3.048 ≈ 9.2903 m²
      expect(result.areaPerPlant).toBeCloseTo(9.2903, 3);
      // 2 hectares = 20,000 m² -> ~2,153 plants
      expect(Math.round(result.totalPlants)).toBe(2153);
    });

    it('returns errors for non-positive dimensions', () => {
      const { errors, result } = calculatePlantPopulation({
        cropName: 'Paddy',
        areaValue: '0',
        areaUnit: 'acres',
        rowSpacing: '-10',
        rowSpacingUnit: 'cm',
        plantSpacing: '15',
        plantSpacingUnit: 'cm',
      });

      expect(result).toBeNull();
      expect(errors).toContain('Area must be greater than 0.');
      expect(errors).toContain('Row spacing must be greater than 0.');
    });
  });

  describe('AcreageCalculator', () => {
    it('accurately parses and converts Guntas to Cents and Hectares', () => {
      // 1 acre 20 guntas = 1 acre + 20/40 acre = 1.50 acres
      const values = calculateAcreValues('1.20');
      expect(values.formatted).toBe('1.20');
      expect(values.acres).toBe(1);
      expect(values.guntas).toBe(20);
      expect(Number.parseFloat(values.hectares)).toBeCloseTo(1.5 * 0.404686, 2);
    });

    it('calculates acreage result across different modes', () => {
      const t = (en: string) => en;

      // Guntas mode: 80 guntas = 2.00 acres
      const guntasResult = calculateAcreageResult({
        mode: 'guntas',
        acreInput: '',
        centInput: '',
        guntaInput: '80',
        hectareInput: '',
        acresCentsPasteInput: '',
        t,
      });
      expect(guntasResult.acresDecimal).toBe('2');
      expect(guntasResult.guntas).toBe('80');

      // Cents mode: 100 cents = 1.00 acre
      const centsResult = calculateAcreageResult({
        mode: 'cents',
        acreInput: '',
        centInput: '100',
        guntaInput: '',
        hectareInput: '',
        acresCentsPasteInput: '',
        t,
      });
      expect(centsResult.acresDecimal).toBe('1');
      expect(centsResult.cents).toBe('100');
    });
  });

  describe('SeedRateCalculator', () => {
    it('calculates correct seed rate in kg for given plant population and test weight', () => {
      const { errors, result } = calculateSeedRate({
        cropName: 'Paddy',
        areaValue: '1',
        areaUnit: 'acres',
        requiredPopulation: '20000',
        populationUnit: 'plants-acre',
        seedsPerHill: '1',
        germinationPercentage: '90',
        testWeight: '100', // 1000 seeds weigh 100g (0.1g per seed)
        wastagePercentage: '10',
      });

      expect(errors).toHaveLength(0);
      expect(result).not.toBeNull();
      if (!result) return;

      expect(result.requiredPlants).toBe(20000);
      // adjusted for 90% germination: 20000 / 0.90 ≈ 22,222.22
      expect(result.adjustedSeeds).toBeCloseTo(22222.22, 1);
      // with 10% wastage: 22222.22 * 1.10 ≈ 24,444.44 seeds
      expect(result.finalSeeds).toBeCloseTo(24444.44, 1);
      // weight in kg: 24444.44 * 0.1g / 1000g ≈ 2.44 kg
      expect(result.seedWeightKg).toBeCloseTo(2.44, 2);
      expect(result.seedRateKgPerAcre).toBeCloseTo(2.44, 2);
    });

    it('rejects germination percentage above 100% or zero area', () => {
      const { errors, result } = calculateSeedRate({
        cropName: 'Wheat',
        areaValue: '0',
        areaUnit: 'acres',
        requiredPopulation: '100000',
        populationUnit: 'plants-acre',
        seedsPerHill: '1',
        germinationPercentage: '105',
        testWeight: '40',
        wastagePercentage: '5',
      });

      expect(result).toBeNull();
      expect(errors).toContain('Area must be greater than 0.');
      expect(errors).toContain('Germination % must be greater than 0 and up to 100.');
    });
  });

  describe('PesticideCalculator', () => {
    it('calculates direct dose formulation requirements and knapsack tank loads', () => {
      const { errors, result } = calculatePesticide('direct', {
        areaValue: '2',
        areaUnit: 'acres',
        waterPerAcre: '200',
        tankChoice: '16', // standard 16L knapsack sprayer
        customTankSize: '',
        directDose: '2', // 2 ml per L
        formulationType: 'liquid',
        aiPercentage: '',
        aiDose: '',
        aiDoseUnit: 'g-ai-acre',
      });

      expect(errors).toHaveLength(0);
      expect(result).not.toBeNull();
      if (!result) return;

      // 2 acres * 200 L = 400 L total water
      expect(result.totalWater).toBe(400);
      // 400 L / 16 L per tank = 25 tanks
      expect(result.exactTanks).toBe(25);
      expect(result.tanksRequired).toBe(25);
      // Product per tank = 16 L * 2 ml/L = 32 ml
      expect(result.productPerSelectedTank).toBe(32);
      // Total product = 400 L * 2 ml/L = 800 ml
      expect(result.totalProduct).toBe(800);
    });

    it('calculates active ingredient dose correctly for EC/WP products', () => {
      const { errors, result } = calculatePesticide('activeIngredient', {
        areaValue: '1',
        areaUnit: 'acres',
        waterPerAcre: '200',
        tankChoice: '16',
        customTankSize: '',
        directDose: '',
        formulationType: 'powder',
        aiPercentage: '50', // 50% WP
        aiDose: '250', // 250 g a.i./acre
        aiDoseUnit: 'g-ai-acre',
      });

      expect(errors).toHaveLength(0);
      expect(result).not.toBeNull();
      if (!result) return;

      // 250 g a.i. / 0.50 = 500 g commercial product per acre
      // 500 g / 200 L = 2.5 g per L
      expect(result.productPerLitre).toBe(2.5);
      // Per 16 L tank = 16 * 2.5 = 40 g
      expect(result.productPerSelectedTank).toBe(40);
      // Total product = 500 g
      expect(result.totalProduct).toBe(500);
    });
  });
});
