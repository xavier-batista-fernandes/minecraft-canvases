import { describe, expect, it } from 'vitest';
import { columnName, luminance, toHex } from '../src/lib/color';

describe('toHex', () => {
  it('pads and upper-cases', () => {
    expect(toHex({ r: 0, g: 10, b: 255 })).toBe('#000AFF');
  });
});

describe('luminance', () => {
  it('runs from 0 for black to 255 for white', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(255);
  });
});

describe('columnName', () => {
  it('labels columns like a spreadsheet', () => {
    expect([0, 1, 25, 26, 27, 51, 52, 63].map(columnName)).toEqual(['A', 'B', 'Z', 'AA', 'AB', 'AZ', 'BA', 'BL']);
  });
});
