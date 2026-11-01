import { toCss, toHex, type Rgb } from '../../lib/color';
import { el } from '../dom';
import './swatch.css';

export function Swatch(color: Rgb): HTMLSpanElement {
  const swatch = el('span', { className: 'swatch', attrs: { 'aria-hidden': 'true', title: toHex(color) } });
  swatch.style.background = toCss(color);
  return swatch;
}
