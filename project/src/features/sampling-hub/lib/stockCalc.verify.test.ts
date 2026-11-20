import { describe, it, expect } from 'vitest';
import { calculateStockAfterSampling } from './statutoryPesticidePdf';

describe('Point 12 stock calculation', () => {
  it('50 × 120 gms -> 47 × 120 gms', () => {
    expect(calculateStockAfterSampling('50 × 120 gms', '120 gms')).toBe('47 × 120 gms');
  });
  it('50 * (120 ml) -> 47 × 120 ml', () => {
    expect(calculateStockAfterSampling('50 * (120 ml)', '120 ml')).toBe('47 × 120 ml');
  });
  it('1000 gms - 120 gms x3 -> 640 gms', () => {
    expect(calculateStockAfterSampling('1000 gms', '120 gms')).toBe('640 gms');
  });
  it('1 kg - 120 gms x3 -> 640 gms', () => {
    expect(calculateStockAfterSampling('1 kg', '120 gms')).toBe('640 gms');
  });
  it('0.4 kg - 20 gms x3 -> 340 gms', () => {
    expect(calculateStockAfterSampling('0.4 kg', '20 gms')).toBe('340 gms');
  });
  it('5 litres - 750 ml x3 -> 2.75 litres', () => {
    expect(calculateStockAfterSampling('5 litres', '750 ml')).toBe('2.75 litres');
  });
  it('15 litres - 750 ml x3 -> 12.75 litres', () => {
    expect(calculateStockAfterSampling('15 litres', '750 ml')).toBe('12.75 litres');
  });
  it('50 bottles - 1 bottle x3 -> 47 bottles', () => {
    expect(calculateStockAfterSampling('50 bottles', '1 bottle')).toBe('47 bottles');
  });
  it('68 bottles legacy -> 65 bottles', () => {
    expect(calculateStockAfterSampling('68 bottles', '120 gms')).toBe('65 bottles');
  });
  it('1000 with sample 1000*3 -> no double multiply', () => {
    const r = calculateStockAfterSampling('1000 gms', '1000*3');
    expect(r).toBe('Error: Insufficient stock for sampling');
  });
  it('50 nos x 120 gms -> 47 × 120 gms', () => {
    expect(calculateStockAfterSampling('50 nos x 120 gms', '120 gms')).toBe('47 × 120 gms');
  });
  it('50 packets of 120 gms -> 47 × 120 gms', () => {
    expect(calculateStockAfterSampling('50 packets of 120 gms', '120 gms')).toBe('47 × 120 gms');
  });
  it('approx 1000 gms stock -> 640 gms', () => {
    expect(calculateStockAfterSampling('approx 1000 gms', '120 gms')).toBe('640 gms');
  });
  it('1/2 kg stock - 100 gms x3 -> 200 gms', () => {
    expect(calculateStockAfterSampling('1/2 kg', '100 gms')).toBe('200 gms');
  });
  it('prefix multiplier 3 x 120 gms -> 640 gms', () => {
    expect(calculateStockAfterSampling('1000 gms', '3 x 120 gms')).toBe('640 gms');
  });
  it('50 pkts x 120 ml -> 47 × 120 ml', () => {
    expect(calculateStockAfterSampling('50 pkts x 120 ml', '120 ml')).toBe('47 × 120 ml');
  });
  it('50 boxes x 100 g -> 47 × 100 g', () => {
    expect(calculateStockAfterSampling('50 boxes x 100 g', '100 g')).toBe('47 × 100 g');
  });
});
