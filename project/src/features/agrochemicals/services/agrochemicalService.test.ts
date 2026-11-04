import { describe, it, expect } from 'vitest';
import {
  filterAgrochemicals,
  getCategoryCounts,
  getAvailableLetters,
  buildWhatsAppAdvisory,
  getCropList,
  getPestListForCrop,
  getAvailableIracGroups,
  filterCropPestInsecticides,
  buildCropPestWhatsAppAdvisory,
  entryToAgrochemicalItem,
} from './agrochemicalService';
import { AGROCHEMICALS_DATA } from '../data/agrochemicalsData';
import { CROP_PEST_INSECTICIDES_DATA } from '../data/cropPestInsecticidesData';

describe('Agrochemical Service', () => {
  describe('Dataset validation', () => {
    it('has at least 15 verified agrochemicals across all 4 categories', () => {
      expect(AGROCHEMICALS_DATA.length).toBeGreaterThanOrEqual(15);
      const counts = getCategoryCounts(AGROCHEMICALS_DATA);
      expect(counts.insecticide).toBeGreaterThanOrEqual(5);
      expect(counts.fungicide).toBeGreaterThanOrEqual(3);
      expect(counts.weedicide).toBeGreaterThanOrEqual(3);
      expect(counts.fertilizer).toBeGreaterThanOrEqual(3);
    });

    it('contains valid IRAC groups for insecticides', () => {
      const insecticides = AGROCHEMICALS_DATA.filter((i) => i.category === 'insecticide');
      for (const item of insecticides) {
        expect(item.moaGroup).toMatch(/IRAC Group/i);
        expect(item.moaGroupName.length).toBeGreaterThan(0);
        expect(item.dosagePerAcre.length).toBeGreaterThan(0);
        expect(item.targetCrops.length).toBeGreaterThan(0);
      }
    });

    it('contains valid FRAC groups for fungicides', () => {
      const fungicides = AGROCHEMICALS_DATA.filter((f) => f.category === 'fungicide');
      for (const item of fungicides) {
        expect(item.moaGroup).toMatch(/FRAC Group/i);
        expect(item.moaGroupName.length).toBeGreaterThan(0);
      }
    });

    it('contains valid HRAC groups for weedicides', () => {
      const weedicides = AGROCHEMICALS_DATA.filter((w) => w.category === 'weedicide');
      for (const item of weedicides) {
        expect(item.moaGroup).toMatch(/HRAC Group/i);
        expect(item.moaGroupName.length).toBeGreaterThan(0);
      }
    });
  });

  describe('filterAgrochemicals', () => {
    it('filters accurately by brand name', () => {
      const results = filterAgrochemicals(AGROCHEMICALS_DATA, {
        query: 'Coragen',
        category: 'all',
        letter: '',
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toContain('Chlorantraniliprole');
    });

    it('filters accurately by IRAC group', () => {
      const results = filterAgrochemicals(AGROCHEMICALS_DATA, {
        query: 'Group 28',
        category: 'all',
        letter: '',
      });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.name.includes('Chlorantraniliprole'))).toBe(true);
    });

    it('filters accurately by target pest', () => {
      const results = filterAgrochemicals(AGROCHEMICALS_DATA, {
        query: 'Stem Borer',
        category: 'insecticide',
        letter: '',
      });
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('filters by initial letter (A-Z)', () => {
      const aItems = filterAgrochemicals(AGROCHEMICALS_DATA, {
        query: '',
        category: 'all',
        letter: 'A',
      });
      expect(aItems.length).toBeGreaterThan(0);
      for (const item of aItems) {
        expect(item.name.toUpperCase().startsWith('A')).toBe(true);
      }
    });

    it('combines category and search query correctly', () => {
      const results = filterAgrochemicals(AGROCHEMICALS_DATA, {
        query: 'Thrips',
        category: 'insecticide',
        letter: '',
      });
      expect(results.length).toBeGreaterThan(0);
      for (const item of results) {
        expect(item.category).toBe('insecticide');
      }
    });
  });

  describe('getAvailableLetters', () => {
    it('extracts unique alphabet letters sorted A to Z', () => {
      const letters = getAvailableLetters(AGROCHEMICALS_DATA);
      expect(letters).toContain('A');
      expect(letters).toContain('C');
      expect(letters).toContain('N');
      expect(letters).toEqual([...letters].sort());
    });
  });

  describe('buildWhatsAppAdvisory', () => {
    it('generates readable advisory markdown with all key parameters', () => {
      const coragen = AGROCHEMICALS_DATA.find((i) => i.id === 'chlorantraniliprole-18-5-sc');
      expect(coragen).toBeDefined();

      const advisory = buildWhatsAppAdvisory(coragen!, (en) => en);
      expect(advisory).toContain('AGRONIX — Agrochemical Advisory');
      expect(advisory).toContain('Chlorantraniliprole');
      expect(advisory).toContain('Coragen');
      expect(advisory).toContain('IRAC Group 28');
      expect(advisory).toContain('60 ml / acre');
    });
  });

  describe('CROP_PEST_INSECTICIDES_DATA (CIB-RC Approved Uses)', () => {
    it('contains all 732 extracted crop-pest-insecticide records across 68 crops', () => {
      expect(CROP_PEST_INSECTICIDES_DATA.length).toBe(732);
      const crops = getCropList(CROP_PEST_INSECTICIDES_DATA);
      expect(crops.length).toBe(68);
    });

    it('every record preserves IRAC group, MoA, toxicity band, and field dosages', () => {
      for (const entry of CROP_PEST_INSECTICIDES_DATA) {
        expect(entry.crop.length).toBeGreaterThan(0);
        expect(entry.pest.length).toBeGreaterThan(0);
        expect(entry.insecticide.length).toBeGreaterThan(0);
        expect(entry.iracGroup.length).toBeGreaterThan(0);
        expect(entry.moaGroupName.length).toBeGreaterThan(0);
        expect(entry.popularBrands.length).toBeGreaterThan(0);
        expect(['green', 'blue', 'yellow', 'red']).toContain(entry.toxicityBand);
        expect(entry.calculatedDosePerAcre.length).toBeGreaterThan(0);
        expect(entry.calculatedDosePerPump.length).toBeGreaterThan(0);
        expect(entry.cibrcPage).toBeGreaterThanOrEqual(1);
        expect(entry.cibrcPage).toBeLessThanOrEqual(28);
      }
    });

    it('returns sorted unique pests for Paddy', () => {
      const paddyPests = getPestListForCrop(CROP_PEST_INSECTICIDES_DATA, 'Paddy');
      expect(paddyPests.length).toBeGreaterThan(5);
      const pestNames = paddyPests.map((p) => p.name.toLowerCase());
      expect(pestNames.some((p) => p.includes('stem borer'))).toBe(true);
      expect(pestNames.some((p) => p.includes('leaf folder') || p.includes('leaf roller'))).toBe(true);
      expect(pestNames.some((p) => p.includes('brown plant hopper') || p.includes('bph'))).toBe(true);
    });

    it('deduplicates pest variations in Cotton without repeating bollworms or whitefly', () => {
      const cottonPests = getPestListForCrop(CROP_PEST_INSECTICIDES_DATA, 'Cotton');
      const names = cottonPests.map((p) => p.name);
      
      // Ensure no duplicate names
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);

      // Verify canonical grouping
      expect(names).toContain('Bollworms (All)');
      expect(names).toContain('Whitefly');
      expect(names).toContain('Aphids');
      expect(names).toContain('Jassids / Leafhoppers');
      expect(names).toContain('Thrips');

      // Ensure raw string duplicates like 'Bollworm,', 'Boll worms', 'Boll Worms' are gone
      expect(names).not.toContain('Bollworm,');
      expect(names).not.toContain('Boll worms');
      expect(names).not.toContain('Boll Worms');
      expect(names).not.toContain('White flies');
    });

    it('correctly groups multi-target sucking pest insecticides into Sucking Pests Complex', () => {
      const cottonPests = getPestListForCrop(CROP_PEST_INSECTICIDES_DATA, 'Cotton');
      const suckingComplex = cottonPests.find((p) => p.name === 'Sucking Pests Complex');
      expect(suckingComplex).toBeDefined();
      expect(suckingComplex!.count).toBeGreaterThanOrEqual(30);

      const suckingChemicals = filterCropPestInsecticides(CROP_PEST_INSECTICIDES_DATA, {
        crop: 'Cotton',
        pest: 'Sucking Pests Complex',
        query: '',
      });
      expect(suckingChemicals.length).toBeGreaterThanOrEqual(30);
      expect(suckingChemicals.some((c) => c.insecticide.includes('Diafenthiuron') || c.insecticide.includes('Dinotefuran') || c.insecticide.includes('Acetamiprid'))).toBe(true);
    });

    it('returns unique IRAC groups for a selected crop', () => {
      const groups = getAvailableIracGroups(CROP_PEST_INSECTICIDES_DATA, 'Paddy');
      expect(groups.length).toBeGreaterThan(3);
      expect(groups.some((g) => g.group.includes('Group 28'))).toBe(true);
    });

    it('filters insecticides by crop and pest with high accuracy', () => {
      const paddyStemBorer = filterCropPestInsecticides(CROP_PEST_INSECTICIDES_DATA, {
        crop: 'Paddy',
        pest: 'Stem borer',
        query: '',
      });
      expect(paddyStemBorer.length).toBeGreaterThanOrEqual(10);
      expect(paddyStemBorer.some((r) => r.insecticide.includes('Chlorantraniliprole'))).toBe(true);
    });

    it('filters by brand name (e.g. Coragen)', () => {
      const coragenHits = filterCropPestInsecticides(CROP_PEST_INSECTICIDES_DATA, {
        crop: '',
        pest: '',
        query: 'Coragen',
      });
      expect(coragenHits.length).toBeGreaterThan(0);
      for (const hit of coragenHits) {
        expect(hit.insecticide).toContain('Chlorantraniliprole');
      }
    });

    it('filters by IRAC group (e.g. IRAC Group 28)', () => {
      const group28 = filterCropPestInsecticides(CROP_PEST_INSECTICIDES_DATA, {
        crop: '',
        pest: '',
        query: '',
        iracGroup: 'IRAC Group 28',
      });
      expect(group28.length).toBeGreaterThan(0);
      for (const item of group28) {
        expect(item.iracGroup).toBe('IRAC Group 28');
      }
    });

    it('builds WhatsApp advisory with IRAC resistance warning and crop/pest details', () => {
      const sample = CROP_PEST_INSECTICIDES_DATA.find(
        (e) => e.crop === 'Paddy' && e.insecticide.includes('Chlorantraniliprole 18.5% SC')
      );
      expect(sample).toBeDefined();

      const advisory = buildCropPestWhatsAppAdvisory(sample!, (en) => en);
      expect(advisory).toContain('AGRONIX — Crop Protection Advisory');
      expect(advisory).toContain('Paddy');
      expect(advisory).toContain('Chlorantraniliprole 18.5% SC');
      expect(advisory).toContain('IRAC Group 28');
      expect(advisory).toContain('Resistance Management Tip');
      expect(advisory).toContain('CIB-RC Reference: Approved Insecticides Crop Schedule');
    });

    it('converts CropPestInsecticideEntry to full AgrochemicalItem for detail modal', () => {
      const sample = CROP_PEST_INSECTICIDES_DATA[0];
      const agroItem = entryToAgrochemicalItem(sample);
      expect(agroItem.id).toBeDefined();
      expect(agroItem.name).toBe(sample.insecticide);
      expect(agroItem.moaGroup).toBe(sample.iracGroup);
      expect(agroItem.toxicityBand).toBe(sample.toxicityBand);
      expect(agroItem.cibrcApprovedClaims).toBeDefined();
      expect(agroItem.cibrcApprovedClaims?.length).toBe(1);
      expect(agroItem.cibrcApprovedClaims?.[0].crop).toBe(sample.crop);
    });
  });
});
