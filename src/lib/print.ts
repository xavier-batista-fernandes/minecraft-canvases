import type { RenderOptions } from './render';

export type PaperSize = 'A4' | 'Letter' | 'A3';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface PrintOptions {
  paper: PaperSize;
  /** "auto" picks landscape for charts wider than they are tall. */
  orientation: Orientation;
  /** Fill squares with paint colors; off prints a blank outline chart to paint on. */
  colors: boolean;
  numbers: boolean;
  coordinates: boolean;
  gridLines: boolean;
  includeTitle: boolean;
  /** Add a page listing every paint with its code and count. */
  includePalette: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  paper: 'A4',
  orientation: 'auto',
  colors: true,
  numbers: true,
  coordinates: true,
  gridLines: true,
  includeTitle: true,
  includePalette: true,
};

/** Paper sizes in millimetres, portrait. */
export const PAPER_MM: Record<PaperSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 },
  A3: { width: 297, height: 420 },
};

/** Page margin used for printing and the preview, in millimetres. */
export const PAGE_MARGIN_MM = 10;

/** Square size the printed chart is drawn at before it is scaled to the page. Big enough for readable numbers. */
const PRINT_CELL_SIZE = 40;

export function resolveOrientation(
  orientation: Orientation,
  chart: { width: number; height: number },
): 'portrait' | 'landscape' {
  if (orientation !== 'auto') return orientation;
  return chart.width > chart.height ? 'landscape' : 'portrait';
}

/** Page size in millimetres after applying the orientation. */
export function pageSize(options: PrintOptions, chart: { width: number; height: number }): { width: number; height: number } {
  const { width, height } = PAPER_MM[options.paper];
  return resolveOrientation(options.orientation, chart) === 'landscape' ? { width: height, height: width } : { width, height };
}

/** The CSS @page rule for these options. */
export function pageRule(options: PrintOptions, chart: { width: number; height: number }): string {
  return `@page { size: ${options.paper} ${resolveOrientation(options.orientation, chart)}; margin: ${PAGE_MARGIN_MM}mm; }`;
}

/** How the printed chart is drawn. Printing never dims paints, whatever is highlighted on screen. */
export function printRenderOptions(options: PrintOptions): RenderOptions {
  return {
    cellSize: PRINT_CELL_SIZE,
    showColors: options.colors,
    showNumbers: options.numbers,
    showCoordinates: options.coordinates,
    showGridLines: options.gridLines,
    highlight: -1,
  };
}

export function pageCount(options: PrintOptions): number {
  return options.includePalette ? 2 : 1;
}
