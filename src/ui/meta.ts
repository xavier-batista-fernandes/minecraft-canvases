import type { Chart } from '../lib/quantize';
import { PIXELS_PER_BLOCK } from '../lib/render';
import { el } from './dom';

export function renderMeta(container: HTMLElement, title: string, chart: Chart): void {
  const { width: W, height: H, palette, originalColorCount } = chart;
  const blocks =
    W % PIXELS_PER_BLOCK === 0 && H % PIXELS_PER_BLOCK === 0
      ? ` · ${W / PIXELS_PER_BLOCK}×${H / PIXELS_PER_BLOCK} blocks`
      : '';
  const simplified = originalColorCount > palette.length ? ` (simplified from ${originalColorCount})` : '';
  container.replaceChildren(
    el('span', { text: title }),
    el('span', { text: `${W}×${H} pixels${blocks}` }),
    el('span', { text: `${palette.length} paint colors${simplified}` }),
    el('span', { text: `${W * H} squares` }),
  );
}
