import { toHex } from '../../lib/color';
import type { PaletteEntry } from '../../lib/quantize';
import { Swatch } from '../atoms';
import { el } from '../dom';
import './palette-row.css';

export interface PaletteRowProps {
  entry: PaletteEntry;
  selected: boolean;
  onToggle: () => void;
}

export function PaletteRow({ entry, selected, onToggle }: PaletteRowProps): HTMLButtonElement {
  const button = el(
    'button',
    { className: 'palette-row', attrs: { type: 'button', 'aria-pressed': String(selected) } },
    [
      el('span', { className: 'palette-row__number', text: String(entry.number) }),
      Swatch(entry),
      el('span', {}, [
        toHex(entry),
        el('span', { className: 'palette-row__rgb', text: `RGB ${entry.r}, ${entry.g}, ${entry.b}` }),
      ]),
      el('span', { className: 'palette-row__count', text: `×${entry.count}` }),
    ],
  );
  button.addEventListener('click', onToggle);
  return button;
}
