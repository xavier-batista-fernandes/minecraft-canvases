import { luminance, toCss, toHex } from '../../lib/color';
import type { PaletteEntry } from '../../lib/quantize';
import { el } from '../dom';
import './paint-spotlight.css';

export interface PaintSpotlightHandle {
  root: HTMLDialogElement;
  /** Show `palette[index]` filling the screen; the arrows step through the rest of `palette`. */
  open: (palette: PaletteEntry[], index: number) => void;
  close: () => void;
}

function barButton(label: string, text: string): HTMLButtonElement {
  return el('button', { className: 'paint-spotlight__button', text, attrs: { type: 'button', 'aria-label': label } });
}

/**
 * One paint color filling the whole window, big enough to hold a brush or a paint swatch up against
 * while mixing it. Escape, the close button or a click on the color closes it; the arrow keys and
 * buttons step to the previous and next paint.
 */
export function PaintSpotlight(): PaintSpotlightHandle {
  const prev = barButton('Previous paint', '‹');
  const next = barButton('Next paint', '›');
  const position = el('span', { className: 'paint-spotlight__position', attrs: { 'aria-live': 'polite' } });
  const fullscreen = barButton('Full screen', '⛶');
  const close = barButton('Close', '×');
  const number = el('span', { className: 'paint-spotlight__number' });
  const hex = el('span', { className: 'paint-spotlight__hex' });
  const rgb = el('span', { className: 'paint-spotlight__detail' });
  const count = el('span', { className: 'paint-spotlight__detail' });
  const info = el('div', { className: 'paint-spotlight__info' }, [number, hex, rgb, count]);
  const root = el('dialog', { className: 'paint-spotlight', attrs: { 'aria-label': 'Paint color' } }, [
    el('div', { className: 'paint-spotlight__bar' }, [
      el('div', { className: 'paint-spotlight__group' }, [prev, position, next]),
      el('div', { className: 'paint-spotlight__group' }, [fullscreen, close]),
    ]),
    info,
  ]);

  let palette: PaletteEntry[] = [];
  let index = 0;

  function show(i: number): void {
    if (palette.length === 0) return;
    index = (i + palette.length) % palette.length;
    const paint = palette[index]!;
    root.style.setProperty('--paint', toCss(paint));
    root.dataset.contrast = luminance(paint) > 140 ? 'dark' : 'light';
    root.setAttribute('aria-label', `Paint ${paint.number}, ${toHex(paint)}`);
    position.textContent = `Paint ${paint.number} of ${palette.length}`;
    number.textContent = String(paint.number);
    hex.textContent = toHex(paint);
    rgb.textContent = `RGB ${paint.r}, ${paint.g}, ${paint.b}`;
    count.textContent = `${paint.count} ${paint.count === 1 ? 'square' : 'squares'}`;
    const single = palette.length < 2;
    prev.disabled = single;
    next.disabled = single;
  }

  const isFullscreen = () => document.fullscreenElement === root;
  function exitFullscreen(): void {
    if (isFullscreen()) void document.exitFullscreen().catch(() => {});
  }
  function syncFullscreen(): void {
    fullscreen.setAttribute('aria-pressed', String(isFullscreen()));
  }

  // Element full screen is missing on some phones; the dialog already covers the window there.
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener('click', () => {
    if (isFullscreen()) exitFullscreen();
    else void root.requestFullscreen?.().catch(() => {});
  });
  document.addEventListener('fullscreenchange', syncFullscreen);

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  close.addEventListener('click', () => root.close());
  // Clicking the color itself (anything but the buttons) closes too.
  root.addEventListener('click', (e) => {
    if (e.target === root || info.contains(e.target as Node)) root.close();
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else return;
    e.preventDefault();
  });
  root.addEventListener('close', exitFullscreen);

  syncFullscreen();
  return {
    root,
    open(entries, i) {
      palette = entries;
      show(i);
      if (!root.open) root.showModal();
      close.focus();
    },
    close: () => root.close(),
  };
}
