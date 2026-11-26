import type { Chart } from '../../lib/quantize';
import { cellAt, renderChart, type RenderOptions } from '../../lib/render';
import { Panel, Text } from '../atoms';
import { el } from '../dom';
import { SectionHeader } from '../molecules';
import './chart-canvas.css';

export interface ChartCanvasHandle {
  root: HTMLElement;
  render: (chart: Chart | null, options: RenderOptions) => void;
  /** Width available for the chart, in CSS pixels. */
  availableWidth: () => number;
}

export interface ChartCanvasProps {
  /** A painted square was clicked; gets its palette index. */
  onCellClick: (index: number) => void;
}

/** The numbered grid, drawn on a canvas using the current theme colors. */
export function ChartCanvas({ onCellClick }: ChartCanvasProps): ChartCanvasHandle {
  const canvas = el('canvas', {
    className: 'chart-canvas__canvas',
    attrs: { role: 'img', 'aria-label': 'Paint-by-numbers chart' },
  });
  const scroll = el('div', { className: 'chart-canvas__scroll' }, [canvas]);
  const root = Panel(
    [
      SectionHeader('Chart', Text('Click a palette color to highlight its squares, or a square to see its paint full screen.', { tone: 'muted', size: 'sm', as: 'span' })),
      scroll,
    ],
    { label: 'Chart' },
  );
  let drawn: { chart: Chart; options: RenderOptions } | null = null;
  canvas.addEventListener('click', (e) => {
    if (!drawn) return;
    const box = canvas.getBoundingClientRect();
    const index = cellAt(drawn.chart, drawn.options, e.clientX - box.left, e.clientY - box.top);
    if (index >= 0) onCellClick(index);
  });
  return {
    root,
    availableWidth: () => scroll.clientWidth,
    render(chart, options) {
      if (!chart) return;
      drawn = { chart, options };
      const styles = getComputedStyle(document.documentElement);
      renderChart(canvas, chart, options, {
        background: styles.getPropertyValue('--bg').trim(),
        muted: styles.getPropertyValue('--muted').trim(),
        font: '"IBM Plex Mono", monospace',
      });
    },
  };
}
