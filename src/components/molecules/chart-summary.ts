import type { Chart } from '../../lib/quantize';
import { PIXELS_PER_BLOCK } from '../../lib/render';
import { el } from '../dom';
import './chart-summary.css';

export interface ChartSummaryHandle {
  root: HTMLElement;
  update: (title: string, chart: Chart | null) => void;
}

/** One line of facts about the current chart: name, size, paints, squares. */
export function ChartSummary(): ChartSummaryHandle {
  const root = el('div', { className: 'chart-summary', attrs: { 'data-testid': 'chart-summary' } });
  return {
    root,
    update(title, chart) {
      if (!chart) {
        root.replaceChildren();
        return;
      }
      const { width: W, height: H, palette, originalColorCount } = chart;
      const blocks =
        W % PIXELS_PER_BLOCK === 0 && H % PIXELS_PER_BLOCK === 0
          ? ` · ${W / PIXELS_PER_BLOCK}×${H / PIXELS_PER_BLOCK} blocks`
          : '';
      const simplified = originalColorCount > palette.length ? ` (simplified from ${originalColorCount})` : '';
      root.replaceChildren(
        el('span', { text: title }),
        el('span', { text: `${W}×${H} pixels${blocks}` }),
        el('span', { text: `${palette.length} paint colors${simplified}` }),
        el('span', { text: `${W * H} squares` }),
      );
    },
  };
}
