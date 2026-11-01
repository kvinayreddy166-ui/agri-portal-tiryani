import { describe, expect, it } from 'vitest';
import {
  calculateDripIrrigation,
  calculateSprinklerIrrigation,
  DRIP_CROP_PRESETS,
  SPRINKLER_CROP_PRESETS,
  toSquareMeters,
  formatHoursMinutes,
  type DripIrrigationInput,
  type SprinklerIrrigationInput,
} from './irrigationEngine';

describe('Irrigation Engine', () => {
  describe('toSquareMeters', () => {
    it('converts acres correctly to m²', () => {
      expect(toSquareMeters(1, 'acres')).toBeCloseTo(4046.86, 2);
      expect(toSquareMeters(2.5, 'acres')).toBeCloseTo(10117.14, 1);
    });

    it('converts guntas correctly to m²', () => {
      // 1 gunta = 4046.86 / 40 ≈ 101.17 m²
      expect(toSquareMeters(1, 'guntas')).toBeCloseTo(101.17, 2);
      expect(toSquareMeters(40, 'guntas')).toBeCloseTo(4046.86, 2);
    });

    it('converts hectares correctly to m²', () => {
      expect(toSquareMeters(1, 'hectares')).toBe(10000);
    });
  });

  describe('formatHoursMinutes', () => {
    it('formats decimal hours into hours and minutes correctly', () => {
      expect(formatHoursMinutes(2.5)).toEqual({ hours: 2, minutes: 30, text: '2h 30m' });
      expect(formatHoursMinutes(1.25)).toEqual({ hours: 1, minutes: 15, text: '1h 15m' });
      expect(formatHoursMinutes(0.75)).toEqual({ hours: 0, minutes: 45, text: '45m' });
      expect(formatHoursMinutes(4)).toEqual({ hours: 4, minutes: 0, text: '4h 0m' });
      expect(formatHoursMinutes(0)).toEqual({ hours: 0, minutes: 0, text: '0m' });
    });
  });

  describe('Drip Irrigation Calculations', () => {
    it('calculates standard 1-acre Bt Cotton drip irrigation run time accurately', () => {
      // 1 acre Cotton: 0.9m row spacing (90cm), 0.6m plant spacing (60cm)
      // Emitter spacing = 0.6m (inline, 1 emitter per plant), Emitter discharge = 2.0 LPH
      // Water requirement = 3.5 Litres/plant/day
      const input: DripIrrigationInput = {
        cropName: 'Bt Cotton',
        area: 1,
        areaUnit: 'acres',
        rowSpacing: 90,
        rowSpacingUnit: 'cm',
        plantSpacing: 60,
        plantSpacingUnit: 'cm',
        emitterSpacing: 60,
        emitterSpacingUnit: 'cm',
        emitterDischarge: 2.0, // LPH
        waterRequirementPerPlant: 3.5, // Litres/plant/day
      };

      const result = calculateDripIrrigation(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Area = 4046.86 m²
      // Row spacing = 0.9m, Plant spacing = 0.6m -> Area per plant = 0.54 m²
      // Total plants ≈ 4046.86 / 0.54 ≈ 7494 plants
      expect(Math.round(result.totalPlants)).toBe(7494);

      // Total lateral length = 4046.86 / 0.9 ≈ 4496.5 m
      // Total emitters = 4496.5 / 0.6 ≈ 7494 emitters
      expect(Math.round(result.totalEmitters)).toBe(7494);

      // Total daily water needed = 7494 plants * 3.5 L/plant ≈ 26,230 Litres
      expect(Math.round(result.dailyWaterVolumeLitres)).toBe(26230);

      // System discharge rate = 7494 emitters * 2 LPH = 14,988 LPH ≈ 14.99 m³/hr
      expect(Math.round(result.systemDischargeLph)).toBe(14988);
      expect(result.systemDischargeM3Hr).toBeCloseTo(14.99, 2);

      // Run hours = 26,229 / 14,988 = 1.75 hours (1h 45m)
      expect(result.pumpRunHours).toBeCloseTo(1.75, 2);
      expect(result.formattedRunTime.hours).toBe(1);
      expect(result.formattedRunTime.minutes).toBe(45);
    });

    it('calculates 2-acre Chilli drip system with 4 LPH drippers correctly', () => {
      // 2 acres Chilli: 60cm row, 45cm plant, 45cm emitter, 2 LPH, 2.5 Litres/plant/day
      const input: DripIrrigationInput = {
        cropName: 'Chilli',
        area: 2,
        areaUnit: 'acres',
        rowSpacing: 60,
        rowSpacingUnit: 'cm',
        plantSpacing: 45,
        plantSpacingUnit: 'cm',
        emitterSpacing: 45,
        emitterSpacingUnit: 'cm',
        emitterDischarge: 2.0,
        waterRequirementPerPlant: 2.5,
      };

      const result = calculateDripIrrigation(input);

      expect(result.isValid).toBe(true);
      // Run hours = 2.5 Litres / 2 LPH = 1.25 hours (1h 15m)
      expect(result.pumpRunHours).toBeCloseTo(1.25, 2);
      expect(result.formattedRunTime.hours).toBe(1);
      expect(result.formattedRunTime.minutes).toBe(15);
    });

    it('handles zero or invalid inputs gracefully without throwing', () => {
      const input: DripIrrigationInput = {
        cropName: 'Invalid',
        area: 0,
        areaUnit: 'acres',
        rowSpacing: 0,
        rowSpacingUnit: 'cm',
        plantSpacing: 0,
        plantSpacingUnit: 'cm',
        emitterSpacing: 0,
        emitterSpacingUnit: 'cm',
        emitterDischarge: 0,
        waterRequirementPerPlant: 0,
      };

      const result = calculateDripIrrigation(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.pumpRunHours).toBe(0);
    });
  });

  describe('Sprinkler Irrigation Calculations', () => {
    it('calculates standard 2-acre Groundnut sprinkler system accurately', () => {
      // 2 acres Groundnut (8093.7 m²)
      // 12m x 12m spacing per nozzle = 144 m² per nozzle
      // Nozzle discharge = 1800 LPH (30 LPM)
      // Target application depth = 25 mm
      // Sprinklers operating at once = 10 sprinklers per set
      const input: SprinklerIrrigationInput = {
        cropName: 'Groundnut',
        area: 2,
        areaUnit: 'acres',
        spacingX: 12, // meters between sprinklers
        spacingY: 12, // meters between laterals
        nozzleDischargeLph: 1800, // LPH
        operatingSprinklers: 10,
        targetDepthMm: 25, // mm depth of water
      };

      const result = calculateSprinklerIrrigation(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Application Rate Pr = 1800 LPH / (12m * 12m = 144 m²) = 12.5 mm/hr
      expect(result.applicationRateMmHr).toBeCloseTo(12.5, 2);

      // Hours per shift = Target Depth (25 mm) / Application rate (12.5 mm/hr) = 2.0 hours
      expect(result.hoursPerShift).toBeCloseTo(2.0, 2);
      expect(result.formattedShiftTime.hours).toBe(2);
      expect(result.formattedShiftTime.minutes).toBe(0);

      // Area covered per set = 10 nozzles * 144 m² = 1440 m²
      expect(result.areaCoveredPerSetM2).toBe(1440);

      // Total area = 2 * 4046.86 = 8093.72 m²
      // Number of shifts required = ceil(8093.72 / 1440) = ceil(5.62) = 6 shifts
      expect(result.totalShiftsRequired).toBe(6);

      // Total irrigation time for field = 6 shifts * 2.0 hours = 12.0 hours
      expect(result.totalFieldIrrigationHours).toBeCloseTo(12.0, 2);

      // System discharge for 10 sprinklers = 10 * 1800 = 18,000 LPH (18 m³/hr)
      expect(result.setDischargeLph).toBe(18000);
      expect(result.setDischargeM3Hr).toBe(18);

      // Total water volume for 2 acres at 25 mm depth = 8093.72 * 0.025 = 202.34 m³ = 202,343 Litres
      expect(Math.round(result.totalWaterVolumeLitres)).toBe(202343);
    });

    it('handles zero or invalid sprinkler inputs without crashing', () => {
      const input: SprinklerIrrigationInput = {
        cropName: 'Empty',
        area: 0,
        areaUnit: 'acres',
        spacingX: 0,
        spacingY: 0,
        nozzleDischargeLph: 0,
        operatingSprinklers: 0,
        targetDepthMm: 0,
      };

      const result = calculateSprinklerIrrigation(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.hoursPerShift).toBe(0);
    });
  });

  describe('Presets', () => {
    it('has standard Drip presets with reasonable agronomic values', () => {
      expect(DRIP_CROP_PRESETS.length).toBeGreaterThanOrEqual(5);
      const cotton = DRIP_CROP_PRESETS.find((p) => p.id === 'cotton');
      expect(cotton).toBeDefined();
      expect(cotton?.rowSpacing).toBe(90);
      expect(cotton?.plantSpacing).toBe(60);
      expect(cotton?.emitterDischarge).toBe(2);

      const tomato = DRIP_CROP_PRESETS.find((p) => p.id === 'tomato');
      expect(tomato).toBeDefined();
      expect(tomato?.rowSpacing).toBe(60);
      expect(tomato?.plantSpacing).toBe(45);
      expect(tomato?.emitterSpacing).toBe(45);
    });

    it('has standard Sprinkler presets with reasonable agronomic values', () => {
      expect(SPRINKLER_CROP_PRESETS.length).toBeGreaterThanOrEqual(4);
      const groundnut = SPRINKLER_CROP_PRESETS.find((p) => p.id === 'groundnut');
      expect(groundnut).toBeDefined();
      expect(groundnut?.spacingX).toBe(12);
      expect(groundnut?.spacingY).toBe(12);
      expect(groundnut?.targetDepthMm).toBe(25);
    });
  });
});
