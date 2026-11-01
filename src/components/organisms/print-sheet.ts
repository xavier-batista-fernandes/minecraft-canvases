import { toHex } from '../../lib/color';
import type { Chart } from '../../lib/quantize';
import { pageRule, printRenderOptions, type PrintOptions } from '../../lib/print';
import { renderChart, type RenderTheme } from '../../lib/render';
import { Swatch } from '../atoms';
import { el } from '../dom';
import './print-sheet.css';

/** Long side of the printed chart bitmap, in device pixels: sharp at A3 without huge memory use. */
const TARGET_PIXELS = 4000;

export const PRINT_THEME: RenderTheme = { background: '#ffffff', muted: '#555555', font: '"IBM Plex Mono", monospace' };

export interface PrintJob {
  title: string;
  summary: string;
  chart: Chart;
  options: PrintOptions;
}

export interface PrintSheetHandle {
  root: HTMLElement;
  /** Lay out the printed pages. Synchronous, so it is safe to call from a `beforeprint` handler. */
  prepare: (job: PrintJob) => void;
}

/** Hidden on screen; the only thing shown when printing. Also owns the @page rule (paper and orientation). */
export function PrintSheet(): PrintSheetHandle {
  const root = el('div', { className: 'print-sheet', attrs: { 'data-testid': 'print-sheet' } });
  const pageStyle = el('style', { attrs: { 'data-print-page': '' } });
  document.head.append(pageStyle);

  return {
    root,
    prepare({ title, summary, chart, options }) {
      const canvas = el('canvas', { className: 'print-sheet__canvas', attrs: { role: 'img', 'aria-label': 'Printed chart' } });
      const render = printRenderOptions(options);
      const longSide = Math.max(chart.width, chart.height) * render.cellSize;
      renderChart(canvas, chart, render, PRINT_THEME, Math.min(8, Math.max(2, TARGET_PIXELS / longSide)));

pageStyle.textContent = pageRule(options, chart);

      const chartPage = el('section', { className: 'print-sheet__chart-page' }, [
        options.includeTitle && el('h1', { className: 'print-sheet__title', text: title }),
        options.includeTitle && el('p', { className: 'print-sheet__summary', text: summary }),
        canvas,
      ]);

      const palette =
        options.includePalette &&
        el('section', { className: 'print-sheet__palette' }, [
          el('h2', { text: `Colors · ${title}` }),
          el('table', { className: 'print-sheet__table' }, [
            el('thead', {}, [
              el('tr', {}, ['#', 'Color', 'Hex', 'RGB', 'Squares'].map((h) => el('th', { text: h }))),
            ]),
            el(
              'tbody',
              {},
              chart.palette.map((p) =>
                el('tr', {}, [
                  el('td', { text: String(p.number) }),
                  el('td', {}, [Swatch(p)]),
                  el('td', { text: toHex(p) }),
                  el('td', { text: `${p.r}, ${p.g}, ${p.b}` }),
                  el('td', { text: String(p.count) }),
                ]),
              ),
            ),
          ]),
        ]);

      root.replaceChildren(...[chartPage, palette].filter((n): n is HTMLElement => !!n));
    },
  };
}
