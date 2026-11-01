import { el } from '../dom';
import './logo.css';

/** The app's pixel-art mark (same artwork as the favicon). Decorative, so it has no alt text. */
export function Logo(): HTMLImageElement {
  return el('img', {
    className: 'logo',
    attrs: { src: `${import.meta.env.BASE_URL}favicon.svg`, alt: '', width: '48', height: '48' },
  });
}
