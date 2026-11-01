import { toCss, toHex } from '../lib/color';
import type { Chart } from '../lib/quantize';
import { el } from './dom';

export function renderPalette(
  container: HTMLElement,
  chart: Chart,
  highlight: number,
  onToggle: (index: number) => void,
): void {
  container.replaceChildren(
    ...chart.palette.map((p, i) => {
      const swatch = el('span', { className: 'sw' });
      swatch.style.background = toCss(p);
      const button = el(
        'button',
        {
          className: 'prow' + (highlight === i ? ' on' : ''),
          attrs: { type: 'button', 'aria-pressed': String(highlight === i) },
        },
        [
          el('span', { className: 'n', text: String(p.number) }),
          swatch,
          el('span', {}, [toHex(p), el('span', { className: 'rgb', text: `RGB ${p.r}, ${p.g}, ${p.b}` })]),
          el('span', { className: 'c', text: `×${p.count}` }),
        ],
      );
      button.addEventListener('click', () => onToggle(i));
      return button;
    }),
  );
}
