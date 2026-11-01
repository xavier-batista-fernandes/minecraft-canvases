import { luminance, type Rgb } from './color';
import type { CropRect } from './crop';

/** The subset of ImageData this module needs, so it can run outside a browser (tests). */
export interface PixelSource {
  width: number;
  height: number;
  data: Uint8ClampedArray | Uint8Array;
}

export interface PaletteEntry extends Rgb {
  /** 1-based paint number shown on the chart. Numbers run dark → light. */
  number: number;
  /** How many squares use this paint. */
  count: number;
}

export interface Chart {
  width: number;
  height: number;
  /** Palette index for each pixel, row by row; -1 for transparent pixels. */
  cells: Int32Array;
  palette: PaletteEntry[];
  /** Exact colors in the source before simplification. */
  originalColorCount: number;
}

/** Pixels with alpha below this are treated as transparent (left unpainted). */
const ALPHA_THRESHOLD = 128;
const KMEANS_ITERATIONS = 20;

interface WeightedColor extends Rgb {
  weight: number;
}

/** Perceptually weighted squared distance: the eye is most sensitive to green, least to red. */
function distance(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

/**
 * Reduce `colors` to at most `k` centers with weighted k-means. Seeding is deterministic
 * (most common color first, then farthest-point), so the same image always gives the same chart.
 * Returns the center index for each input color, plus the centers.
 */
export function reduceColors(colors: WeightedColor[], k: number): { assign: number[]; centers: Rgb[] } {
  if (colors.length <= k) {
    return { assign: colors.map((_, i) => i), centers: colors.map(({ r, g, b }) => ({ r, g, b })) };
  }

  const first = colors.reduce((best, c, i) => (c.weight > colors[best]!.weight ? i : best), 0);
  const seed = colors[first]!;
  let centers: Rgb[] = [{ r: seed.r, g: seed.g, b: seed.b }];
  const nearest = colors.map((c) => distance(c, seed));
  while (centers.length < k) {
    let pick = 0;
    let pickScore = -1;
    colors.forEach((c, i) => {
      const score = nearest[i]! * Math.sqrt(c.weight);
      if (score > pickScore) {
        pickScore = score;
        pick = i;
      }
    });
    const center = { r: colors[pick]!.r, g: colors[pick]!.g, b: colors[pick]!.b };
    centers.push(center);
    colors.forEach((c, i) => {
      nearest[i] = Math.min(nearest[i]!, distance(c, center));
    });
  }

  const assign = new Array<number>(colors.length).fill(0);
  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    colors.forEach((c, i) => {
      let best = 0;
      let bestDist = Infinity;
      centers.forEach((center, j) => {
        const d = distance(c, center);
        if (d < bestDist) {
          bestDist = d;
          best = j;
        }
      });
      assign[i] = best;
    });
    const sums = centers.map(() => ({ r: 0, g: 0, b: 0, w: 0 }));
    colors.forEach((c, i) => {
      const s = sums[assign[i]!]!;
      s.r += c.r * c.weight;
      s.g += c.g * c.weight;
      s.b += c.b * c.weight;
      s.w += c.weight;
    });
    centers = sums.map((s, j) => (s.w ? { r: s.r / s.w, g: s.g / s.w, b: s.b / s.w } : centers[j]!));
  }

  return {
    assign,
    centers: centers.map((c) => ({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) })),
  };
}

/**
 * Build a paint-by-numbers chart for the cropped area of `source`, using at most
 * `maxColors` paints (pass Infinity to keep every exact color).
 */
export function buildChart(source: PixelSource, crop: CropRect, maxColors: number): Chart {
  const { width, height } = crop;
  const { data } = source;

  // 1. Unique colors with their pixel counts.
  const lookup = new Map<number, number>();
  const unique: WeightedColor[] = [];
  const raw = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = ((crop.y + y) * source.width + (crop.x + x)) * 4;
      if (data[i + 3]! < ALPHA_THRESHOLD) {
        raw[y * width + x] = -1;
        continue;
      }
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const key = (r << 16) | (g << 8) | b;
      let u = lookup.get(key);
      if (u === undefined) {
        u = unique.length;
        unique.push({ r, g, b, weight: 0 });
        lookup.set(key, u);
      }
      unique[u]!.weight++;
      raw[y * width + x] = u;
    }
  }

  // 2. Simplify to the requested number of paints.
  const { assign, centers } = reduceColors(unique, Math.max(1, maxColors));
  const counts = new Array<number>(centers.length).fill(0);
  for (const u of raw) if (u >= 0) counts[assign[u]!]!++;

  // 3. Drop unused centers and number the rest dark → light (handy for layering paint).
  const order = centers
    .map((_, i) => i)
    .filter((i) => counts[i]! > 0)
    .sort((a, b) => luminance(centers[a]!) - luminance(centers[b]!));
  const remap = new Int32Array(centers.length).fill(-1);
  order.forEach((old, n) => (remap[old] = n));

  const cells = new Int32Array(raw.length);
  raw.forEach((u, i) => (cells[i] = u < 0 ? -1 : remap[assign[u]!]!));

  return {
    width,
    height,
    cells,
    palette: order.map((old, n) => ({ ...centers[old]!, number: n + 1, count: counts[old]! })),
    originalColorCount: unique.length,
  };
}
