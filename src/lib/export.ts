import { toHex } from './color';
import type { Chart } from './quantize';

/** Tab-separated color list, ready to paste into a spreadsheet or notes app. */
export function paletteToText(title: string, chart: Chart): string {
  const header = `${title} (${chart.width}x${chart.height})`;
  const rows = chart.palette.map(
    (p) => `${p.number}\t${toHex(p)}\tRGB(${p.r}, ${p.g}, ${p.b})\t${p.count} squares`,
  );
  return [header, ...rows].join('\n');
}
