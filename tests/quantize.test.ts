import { describe, expect, it } from 'vitest';
import { buildChart, countColors, type PixelSource } from '../src/lib/quantize';
import { paletteToText } from '../src/lib/export';

type Px = [number, number, number, number?];

function image(width: number, height: number, pixels: Px[]): PixelSource {
  const data = new Uint8ClampedArray(width * height * 4);
  pixels.forEach(([r, g, b, a = 255], i) => data.set([r, g, b, a], i * 4));
  return { width, height, data };
}

const full = (src: PixelSource) => ({ x: 0, y: 0, width: src.width, height: src.height });

const WHITE: Px = [255, 255, 255];
const BLACK: Px = [0, 0, 0];
const RED: Px = [200, 0, 0];
const CLEAR: Px = [0, 0, 0, 0];

describe('buildChart', () => {
  it('keeps exact colors when under the limit, numbered dark to light', () => {
    const src = image(2, 2, [WHITE, BLACK, RED, WHITE]);
    const chart = buildChart(src, full(src), 24);
    expect(chart.palette.map((p) => [p.r, p.g, p.b, p.number, p.count])).toEqual([
      [0, 0, 0, 1, 1],
      [200, 0, 0, 2, 1],
      [255, 255, 255, 3, 2],
    ]);
    expect([...chart.cells]).toEqual([2, 0, 1, 2]);
    expect(chart.originalColorCount).toBe(3);
  });

  it('marks transparent pixels as -1 and leaves them out of the palette', () => {
    const src = image(2, 1, [CLEAR, RED]);
    const chart = buildChart(src, full(src), 24);
    expect([...chart.cells]).toEqual([-1, 0]);
    expect(chart.palette).toHaveLength(1);
  });

  it('reduces to at most the requested number of paints', () => {
    // A 16-step gray ramp, simplified to 4 paints.
    const ramp: Px[] = Array.from({ length: 16 }, (_, i) => [i * 17, i * 17, i * 17]);
    const src = image(16, 1, ramp);
    const chart = buildChart(src, full(src), 4);
    expect(chart.palette).toHaveLength(4);
    expect(chart.originalColorCount).toBe(16);
    expect(chart.palette.reduce((n, p) => n + p.count, 0)).toBe(16);
    // Dark → light ordering survives simplification.
    const lums = chart.palette.map((p) => p.r);
    expect([...lums].sort((a, b) => a - b)).toEqual(lums);
  });

  it('is deterministic', () => {
    const pixels: Px[] = Array.from({ length: 64 }, (_, i) => [(i * 37) % 256, (i * 91) % 256, (i * 53) % 256]);
    const src = image(8, 8, pixels);
    const a = buildChart(src, full(src), 6);
    const b = buildChart(src, full(src), 6);
    expect(a.palette).toEqual(b.palette);
    expect([...a.cells]).toEqual([...b.cells]);
  });

  it('only reads the cropped area', () => {
    const src = image(2, 2, [WHITE, RED, BLACK, RED]);
    const chart = buildChart(src, { x: 1, y: 0, width: 1, height: 2 }, 24);
    expect(chart.width).toBe(1);
    expect(chart.palette).toHaveLength(1);
    expect(chart.palette[0]).toMatchObject({ r: 200, g: 0, b: 0, count: 2 });
  });

  it('can reduce to a single paint', () => {
    const src = image(3, 1, [WHITE, BLACK, RED]);
    const chart = buildChart(src, full(src), 1);
    expect(chart.palette).toHaveLength(1);
    expect([...chart.cells]).toEqual([0, 0, 0]);
  });

  it('keeps every color when the limit is Infinity', () => {
    const pixels: Px[] = Array.from({ length: 100 }, (_, i) => [i, 255 - i, i * 2]);
    const src = image(10, 10, pixels);
    expect(buildChart(src, full(src), Infinity).palette).toHaveLength(100);
  });
});

describe('paletteToText', () => {
  it('formats a tab-separated list', () => {
    const src = image(2, 1, [BLACK, WHITE]);
    expect(paletteToText('Test', buildChart(src, full(src), 24))).toBe(
      'Test (2x1)\n1\t#000000\tRGB(0, 0, 0)\t1 squares\n2\t#FFFFFF\tRGB(255, 255, 255)\t1 squares',
    );
  });
});

describe('countColors', () => {
  it('counts distinct opaque colors in the crop', () => {
    const src = image(4, 1, [WHITE, BLACK, WHITE, CLEAR]);
    expect(countColors(src, full(src))).toBe(2);
    expect(countColors(src, { x: 2, y: 0, width: 2, height: 1 })).toBe(1);
  });

  it('matches the original color count of a chart', () => {
    const pixels: Px[] = Array.from({ length: 64 }, (_, i) => [(i * 37) % 256, (i * 91) % 256, 7]);
    const src = image(8, 8, pixels);
    expect(countColors(src, full(src))).toBe(buildChart(src, full(src), 4).originalColorCount);
  });
});
