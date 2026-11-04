import { describe, expect, it } from 'vitest';
import {
  calculateLabScore,
  calculateFieldScore,
  getHealthTier,
  type LabFormState,
  type FieldIndicatorState,
} from './soilHealthEngine';

describe('Soil Health Engine', () => {
  it('correctly scores an ideal fertile soil profile as healthy (>85%)', () => {
    const idealLab: LabFormState = {
      phBracket: '4', // Neutral
      ecBracket: '1', // Normal
      ocBracket: '3', // High (>1.5%)
      nBracket: '2', // Medium
      pBracket: '2', // Medium
      kBracket: '2', // Medium
      caBracket: '3', // High
      mgBracket: '3', // High
      sBracket: '2', // Sufficient
      znBracket: '3', // High
      mnBracket: '3', // High
      feBracket: '2', // Sufficient
      cuBracket: '3', // High
      bBracket: '3', // High
    };

    const res = calculateLabScore(idealLab);
    expect(res.totalLabScore).toBeGreaterThanOrEqual(90);
    expect(res.phStatus).toContain('Neutral');
    expect(res.nAdj).toBe('100% RDF');
    expect(res.pAdj).toBe('100% RDF');

    const tier = getHealthTier(res.totalLabScore);
    expect(tier.tier).toBe('healthy');
  });

  it('detects strongly acidic soil and recommends liming', () => {
    const acidicLab: LabFormState = {
      phBracket: '1', // Strongly acidic (<5.5)
      ecBracket: '1',
      ocBracket: '1', // Low
      nBracket: '1', // Low
      pBracket: '1', // Low
      kBracket: '1', // Low
      caBracket: '1',
      mgBracket: '1',
      sBracket: '1',
      znBracket: '1',
      mnBracket: '1',
      feBracket: '2',
      cuBracket: '1',
      bBracket: '1',
    };

    const res = calculateLabScore(acidicLab);
    expect(res.phStatus).toContain('Strongly Acidic');
    expect(res.phRemedy).toContain('Lime');
    expect(res.nAdj).toBe('+25% RDF');
    expect(res.pAdj).toBe('+25% RDF');
    expect(res.totalLabScore).toBeLessThan(50);

    const tier = getHealthTier(res.totalLabScore);
    expect(['degraded', 'critical']).toContain(tier.tier);
  });

  it('detects alkaline/sodic soil and recommends gypsum', () => {
    const sodicLab: LabFormState = {
      phBracket: '5', // Alkaline >8.0
      ecBracket: '3', // Injurious/saline >3.0
      ocBracket: '1',
      nBracket: '1',
      pBracket: '1',
      kBracket: '3',
      caBracket: '1',
      mgBracket: '1',
      sBracket: '2',
      znBracket: '1',
      mnBracket: '2',
      feBracket: '1',
      cuBracket: '2',
      bBracket: '2',
    };

    const res = calculateLabScore(sodicLab);
    expect(res.phStatus).toContain('Alkaline');
    expect(res.phRemedy).toContain('Gypsum');
    expect(res.ecStatus).toContain('Injurious');
  });

  it('calculates field indicators accurately for all good, medium, and poor observations', () => {
    const allGood: FieldIndicatorState = {
      soilStructure: 1,
      drainage: 1,
      waterHolding: 1,
      compaction: 1,
      erosion: 1,
      organicMatter: 1,
      earthworms: 1,
      cropCondition: 1,
      microbial: 1,
      rootGrowth: 1,
    };
    const goodRes = calculateFieldScore(allGood);
    expect(goodRes.totalScore).toBe(100);
    expect(goodRes.physPercent).toBe(100);
    expect(goodRes.bioPercent).toBe(100);

    const allPoor: FieldIndicatorState = {
      soilStructure: 3,
      drainage: 3,
      waterHolding: 3,
      compaction: 3,
      erosion: 3,
      organicMatter: 3,
      earthworms: 3,
      cropCondition: 3,
      microbial: 3,
      rootGrowth: 3,
    };
    const poorRes = calculateFieldScore(allPoor);
    expect(poorRes.totalScore).toBe(20);
    expect(poorRes.physPercent).toBe(20);
    expect(poorRes.bioPercent).toBe(20);
    expect(getHealthTier(poorRes.totalScore).tier).toBe('critical');
  });
});
