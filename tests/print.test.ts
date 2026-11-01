import { describe, expect, it } from 'vitest';
import { DEFAULT_PRINT_OPTIONS, pageCount, pageRule, pageSize, printRenderOptions, resolveOrientation } from '../src/lib/print';

const wide = { width: 32, height: 16 };
const tall = { width: 16, height: 32 };
const square = { width: 16, height: 16 };

describe('resolveOrientation', () => {
  it('auto follows the chart shape, square charts print portrait', () => {
    expect(resolveOrientation('auto', wide)).toBe('landscape');
    expect(resolveOrientation('auto', tall)).toBe('portrait');
    expect(resolveOrientation('auto', square)).toBe('portrait');
  });

  it('an explicit choice wins', () => {
    expect(resolveOrientation('portrait', wide)).toBe('portrait');
    expect(resolveOrientation('landscape', tall)).toBe('landscape');
  });
});

describe('page size and rule', () => {
  it('swaps width and height for landscape', () => {
    expect(pageSize({ ...DEFAULT_PRINT_OPTIONS, paper: 'A4' }, tall)).toEqual({ width: 210, height: 297 });
    expect(pageSize({ ...DEFAULT_PRINT_OPTIONS, paper: 'A3' }, wide)).toEqual({ width: 420, height: 297 });
  });

  it('writes the @page rule', () => {
    expect(pageRule({ ...DEFAULT_PRINT_OPTIONS, paper: 'Letter' }, wide)).toBe('@page { size: Letter landscape; margin: 10mm; }');
  });
});

describe('printRenderOptions', () => {
  it('maps print choices onto the renderer and never dims paints', () => {
    const options = printRenderOptions({ ...DEFAULT_PRINT_OPTIONS, colors: false, numbers: true, coordinates: false, gridLines: true });
    expect(options).toMatchObject({ showColors: false, showNumbers: true, showCoordinates: false, showGridLines: true, highlight: -1 });
  });
});

describe('pageCount', () => {
  it('adds a page for the color list', () => {
    expect(pageCount(DEFAULT_PRINT_OPTIONS)).toBe(2);
    expect(pageCount({ ...DEFAULT_PRINT_OPTIONS, includePalette: false })).toBe(1);
  });
});
