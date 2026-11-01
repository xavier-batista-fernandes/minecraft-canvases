import type { Chart } from '../../lib/quantize';
import { renderChart, type RenderOptions } from '../../lib/render';
import { Panel, Text } from '../atoms';
import { el } from '../dom';
import { SectionHeader } from '../molecules';
import './chart-canvas.css';

export interface ChartCanvasHandle {
  root: HTMLElement;
  render: (chart: Chart | null, options: RenderOptions) => void;
}

/** The numbered grid, drawn on a canvas using the current theme colors. */
export function ChartCanvas(): ChartCanvasHandle {
  const canvas = el('canvas', {
    className: 'chart-canvas__canvas',
    attrs: { role: 'img', 'aria-label': 'Paint-by-numbers chart' },
  });
  const root = Panel(
    [
      SectionHeader('Chart', Text('Click a color in the list to highlight its squares.', { tone: 'muted', size: 'sm', as: 'span' })),
      el('div', { className: 'chart-canvas__scroll' }, [canvas]),
    ],
    { as: 'div', label: 'Chart' },
  );
  return {
    root,
    render(chart, options) {
      if (!chart) return;
      const styles = getComputedStyle(document.documentElement);
      renderChart(canvas, chart, options, {
        background: styles.getPropertyValue('--bg').trim(),
        muted: styles.getPropertyValue('--muted').trim(),
        font: '"IBM Plex Mono", monospace',
      });
    },
  };
}
