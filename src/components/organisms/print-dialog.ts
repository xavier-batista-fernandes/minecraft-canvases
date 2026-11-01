import { toHex } from '../../lib/color';
import {
  DEFAULT_PRINT_OPTIONS,
  PAGE_MARGIN_MM,
  pageCount,
  pageSize,
  printRenderOptions,
  resolveOrientation,
  type Orientation,
  type PaperSize,
  type PrintOptions,
} from '../../lib/print';
import type { Chart } from '../../lib/quantize';
import { renderChart } from '../../lib/render';
import { Button, Swatch, Switch, Text } from '../atoms';
import { el } from '../dom';
import { Modal, PaperPreview, SegmentedControl, SettingsGroup } from '../molecules';
import { PRINT_THEME } from './print-sheet';
import './print-dialog.css';

/** Long side of the preview bitmap; enough for a sharp on-screen preview. */
const PREVIEW_PIXELS = 1200;

export interface PrintSubject {
  title: string;
  summary: string;
  chart: Chart;
}

export interface PrintDialogProps {
  /** Called with the chosen options when the user confirms. */
  onPrint: (options: PrintOptions) => void;
}

export interface PrintDialogHandle {
  root: HTMLDialogElement;
  open: (subject: PrintSubject) => void;
  /** The options last chosen (also used for Ctrl/Cmd+P). */
  options: () => PrintOptions;
}

/** Print options with a live preview of the pages, shown only when the user asks to print. */
export function PrintDialog({ onPrint }: PrintDialogProps): PrintDialogHandle {
  const options: PrintOptions = { ...DEFAULT_PRINT_OPTIONS };
  let subject: PrintSubject | null = null;

  const pages = el('div', { className: 'print-dialog__pages' });
  const pageInfo = Text('', { tone: 'muted', size: 'sm' });

  function set<K extends keyof PrintOptions>(key: K, value: PrintOptions[K]): void {
    options[key] = value;
    renderPreview();
  }

  function renderPreview(): void {
    if (!subject) return;
    const { chart, title, summary } = subject;
    const size = pageSize(options, chart);
    const orientation = resolveOrientation(options.orientation, chart);

    const canvas = el('canvas', { className: 'print-dialog__canvas', attrs: { role: 'img', 'aria-label': 'Chart preview' } });
    const render = printRenderOptions(options);
    renderChart(canvas, chart, render, PRINT_THEME, PREVIEW_PIXELS / (Math.max(chart.width, chart.height) * render.cellSize));

    const sheets = [
      PaperPreview({
        widthMm: size.width,
        heightMm: size.height,
        marginMm: PAGE_MARGIN_MM,
        label: 'Page 1 · chart',
        content: [
          options.includeTitle && el('h3', { className: 'print-dialog__title', text: title }),
          options.includeTitle && el('p', { className: 'print-dialog__summary', text: summary }),
          canvas,
        ],
      }),
    ];
    if (options.includePalette) {
      sheets.push(
        PaperPreview({
          widthMm: size.width,
          heightMm: size.height,
          marginMm: PAGE_MARGIN_MM,
          label: 'Page 2 · color list',
          content: [
            el('h3', { className: 'print-dialog__list-title', text: `Colors · ${title}` }),
            el(
              'div',
              { className: 'print-dialog__list' },
              chart.palette.map((p) =>
                el('div', { className: 'print-dialog__list-row' }, [
                  el('span', { text: String(p.number) }),
                  Swatch(p),
                  el('span', { text: toHex(p) }),
                  el('span', { text: `×${p.count}` }),
                ]),
              ),
            ),
          ],
        }),
      );
    }
    sheets.forEach((s) => s.classList.toggle('paper-preview--landscape', orientation === 'landscape'));
    pages.replaceChildren(...sheets);
    const count = pageCount(options);
    pageInfo.textContent = `${count} ${count === 1 ? 'page' : 'pages'} · ${options.paper} ${orientation}`;
  }

  const modal = Modal({
    title: 'Print chart',
    body: [
      el('div', { className: 'print-dialog__layout' }, [
        el('div', { className: 'print-dialog__options' }, [
          SettingsGroup('Chart', [
            SegmentedControl<'colors' | 'blank'>({
              label: 'Squares',
              name: 'print-squares',
              value: options.colors ? 'colors' : 'blank',
              options: [
                { value: 'colors', label: 'With colors' },
                { value: 'blank', label: 'Blank' },
              ],
              onChange: (v) => set('colors', v === 'colors'),
            }),
            Switch({ label: 'Numbers', checked: options.numbers, onChange: (v) => set('numbers', v) }),
            Switch({ label: 'Coordinates', checked: options.coordinates, onChange: (v) => set('coordinates', v) }),
            Switch({ label: 'Grid lines', checked: options.gridLines, onChange: (v) => set('gridLines', v) }),
          ]),
          SettingsGroup('Page', [
            SegmentedControl<PaperSize>({
              label: 'Paper',
              name: 'print-paper',
              value: options.paper,
              options: [
                { value: 'A4', label: 'A4' },
                { value: 'Letter', label: 'Letter' },
                { value: 'A3', label: 'A3' },
              ],
              onChange: (v) => set('paper', v),
            }),
            SegmentedControl<Orientation>({
              label: 'Orientation',
              name: 'print-orientation',
              value: options.orientation,
              options: [
                { value: 'auto', label: 'Auto' },
                { value: 'portrait', label: 'Portrait' },
                { value: 'landscape', label: 'Landscape' },
              ],
              onChange: (v) => set('orientation', v),
            }),
            Switch({ label: 'Title', checked: options.includeTitle, onChange: (v) => set('includeTitle', v) }),
            Switch({ label: 'Color list page', checked: options.includePalette, onChange: (v) => set('includePalette', v) }),
          ]),
          Text('Blank squares with numbers make a classic paint-by-numbers sheet.', { tone: 'muted', size: 'sm' }),
        ]),
        el('section', { className: 'print-dialog__preview', attrs: { 'aria-label': 'Print preview' } }, [pageInfo, pages]),
      ]),
    ],
    footer: [
      Button({ label: 'Cancel', variant: 'ghost', onClick: () => modal.close() }),
      Button({
        label: 'Print',
        onClick: () => {
          modal.close();
          onPrint({ ...options });
        },
      }),
    ],
  });

  return {
    root: modal.root,
    open(next) {
      subject = next;
      renderPreview();
      modal.open();
    },
    options: () => ({ ...options }),
  };
}
