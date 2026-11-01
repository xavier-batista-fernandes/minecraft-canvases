import { describe, expect, it } from 'vitest';
import { fitCellSize, MAX_CELL_SIZE, MIN_CELL_SIZE } from '../src/lib/render';

describe('fitCellSize', () => {
  it('fills the width, leaving room for the coordinate margin', () => {
    const size = fitCellSize(32, 1000);
    const total = Math.max(18, size * 0.8) + 32 * size + 1;
    expect(total).toBeLessThanOrEqual(1000);
    expect(fitCellSize(32, 1000 + 40)).toBeGreaterThan(size);
  });

  it('never goes below the readable minimum or above the maximum', () => {
    expect(fitCellSize(64, 300)).toBe(MIN_CELL_SIZE);
    expect(fitCellSize(16, 5000)).toBe(MAX_CELL_SIZE);
  });
});
