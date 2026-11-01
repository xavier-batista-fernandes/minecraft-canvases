import { columnName, luminance, toCss } from './color';
import type { Chart } from './quantize';

export interface RenderOptions {
  /** Size of one square in CSS pixels. */
  cellSize: number;
  showNumbers: boolean;
  showCoordinates: boolean;
  showGridLines: boolean;
  /** Palette index to highlight, or -1 for none. */
  highlight: number;
}

export interface RenderTheme {
  background: string;
  muted: string;
  font: string;
}

/** Minecraft paintings are 16 texture pixels per block; a heavier line marks each block. */
export const PIXELS_PER_BLOCK = 16;
const MIN_CELL_FOR_NUMBERS = 14;
const DIMMED_ALPHA = 0.18;

/** A comfortable starting cell size for an image of this size. */
export function suggestedCellSize(width: number, height: number): number {
  const biggest = Math.max(width, height);
  if (biggest <= 16) return 40;
  if (biggest <= 32) return 30;
  if (biggest <= 64) return 20;
  return 14;
}

export function renderChart(
  canvas: HTMLCanvasElement,
  chart: Chart,
  options: RenderOptions,
  theme: RenderTheme,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H, cells, palette } = chart;
  const { cellSize: s, showNumbers, showCoordinates, showGridLines, highlight } = options;

  const margin = showCoordinates ? Math.max(18, s * 0.8) : 0;
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = margin + W * s + 1;
  const cssHeight = margin + H * s + 1;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = cells[y * W + x]!;
      const X = margin + x * s;
      const Y = margin + y * s;
      if (v < 0) {
        // Transparent pixel: checkerboard, nothing to paint.
        ctx.fillStyle = '#ccc';
        ctx.fillRect(X, Y, s, s);
        ctx.fillStyle = '#eee';
        ctx.fillRect(X, Y, s / 2, s / 2);
        ctx.fillRect(X + s / 2, Y + s / 2, s / 2, s / 2);
        continue;
      }
      const paint = palette[v]!;
      const dimmed = highlight >= 0 && highlight !== v;
      ctx.globalAlpha = dimmed ? DIMMED_ALPHA : 1;
      ctx.fillStyle = toCss(paint);
      ctx.fillRect(X, Y, s, s);
      ctx.globalAlpha = 1;
      if (showNumbers && s >= MIN_CELL_FOR_NUMBERS && !dimmed) {
        ctx.fillStyle = luminance(paint) > 140 ? 'rgba(0,0,0,.8)' : 'rgba(255,255,255,.92)';
        ctx.font = `600 ${Math.floor(s * (paint.number > 99 ? 0.34 : 0.42))}px ${theme.font}`;
        ctx.fillText(String(paint.number), X + s / 2, Y + s / 2 + 0.5);
      }
    }
  }

  if (showGridLines) {
    const lines = (step: number) => {
      ctx.beginPath();
      for (let x = 0; x <= W; x += step) {
        const X = margin + x * s + 0.5;
        ctx.moveTo(X, margin);
        ctx.lineTo(X, margin + H * s);
      }
      for (let y = 0; y <= H; y += step) {
        const Y = margin + y * s + 0.5;
        ctx.moveTo(margin, Y);
        ctx.lineTo(margin + W * s, Y);
      }
      ctx.stroke();
    };
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1;
    lines(1);
    ctx.strokeStyle = 'rgba(0,0,0,.85)';
    ctx.lineWidth = 2;
    lines(PIXELS_PER_BLOCK);
  }

  if (showCoordinates) {
    ctx.fillStyle = theme.muted;
    ctx.font = `${Math.floor(Math.min(margin, s) * 0.5)}px ${theme.font}`;
    for (let x = 0; x < W; x++) ctx.fillText(columnName(x), margin + x * s + s / 2, margin / 2);
    for (let y = 0; y < H; y++) ctx.fillText(String(y + 1), margin / 2, margin + y * s + s / 2);
  }
}
