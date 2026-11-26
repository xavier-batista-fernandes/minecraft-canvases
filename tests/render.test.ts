import { describe, expect, it } from 'vitest';
import type { Chart } from '../src/lib/quantize';
import { cellAt, fitCellSize, MAX_CELL_SIZE, MIN_CELL_SIZE } from '../src/lib/render';

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

describe('cellAt', () => {
  // 2×2 chart: paints 0 and 1 on the top row, a transparent pixel and paint 0 below.
  const chart: Chart = {
    width: 2,
    height: 2,
    cells: Int32Array.from([0, 1, -1, 0]),
    palette: [
      { r: 0, g: 0, b: 0, number: 1, count: 2 },
      { r: 255, g: 255, b: 255, number: 2, count: 1 },
    ],
    originalColorCount: 2,
  };

  it('finds the square under a point', () => {
    const options = { cellSize: 20, showCoordinates: false };
    expect(cellAt(chart, options, 5, 5)).toBe(0);
    expect(cellAt(chart, options, 25, 5)).toBe(1);
    expect(cellAt(chart, options, 39.9, 39.9)).toBe(0);
  });

  it('skips the coordinate margin', () => {
    const options = { cellSize: 20, showCoordinates: true }; // margin is 18px
    expect(cellAt(chart, options, 10, 30)).toBe(-1);
    expect(cellAt(chart, options, 20, 20)).toBe(0);
    expect(cellAt(chart, options, 40, 20)).toBe(1);
  });

  it('returns -1 outside the chart and for transparent pixels', () => {
    const options = { cellSize: 20, showCoordinates: false };
    expect(cellAt(chart, options, 5, 25)).toBe(-1);
    expect(cellAt(chart, options, 41, 5)).toBe(-1);
    expect(cellAt(chart, options, -1, 5)).toBe(-1);
  });
});
