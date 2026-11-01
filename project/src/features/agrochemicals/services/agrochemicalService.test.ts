import { describe, it, expect } from 'vitest';
import {
  filterAgrochemicals,
  getCategoryCounts,
  getAvailableLetters,
  buildWhatsAppAdvisory,
} from './agrochemicalService';
import { AGROCHEMICALS_DATA } from '../data/agrochemicalsData';

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
});
