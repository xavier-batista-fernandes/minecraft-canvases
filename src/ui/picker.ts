import { groupPaintings, paintingUrl, type Painting } from '../data/paintings';
import { el } from './dom';

const THUMB_MAX_W = 80;
const THUMB_MAX_H = 48;

export function renderPicker(
  container: HTMLElement,
  paintings: readonly Painting[],
  query: string,
  currentId: string | null,
  onSelect: (painting: Painting) => void,
): void {
  const groups = groupPaintings(paintings, query);
  if (!groups.length) {
    container.replaceChildren(el('p', { className: 'lede', text: 'No painting matches that name.' }));
    return;
  }
  container.replaceChildren(
    ...groups.map((group) =>
      el('div', { className: 'group' }, [
        el('h3', { text: `${group.label} blocks · ${group.width}×${group.height} px` }),
        el(
          'div',
          { className: 'thumbs' },
          group.paintings.map((p) => {
            const scale = Math.min(THUMB_MAX_W / p.width, THUMB_MAX_H / p.height);
            const img = el('img', {
              attrs: {
                alt: '',
                src: paintingUrl(p),
                width: String(p.width * scale),
                height: String(p.height * scale),
                loading: 'lazy',
              },
            });
            const button = el(
              'button',
              { className: 'thumb' + (p.id === currentId ? ' on' : ''), attrs: { type: 'button', 'data-id': p.id } },
              [el('span', { className: 'im' }, [img]), el('span', { text: p.name })],
            );
            button.addEventListener('click', () => onSelect(p));
            return button;
          }),
        ),
      ]),
    ),
  );
}

export function markSelected(container: HTMLElement, id: string | null): void {
  container.querySelectorAll<HTMLElement>('.thumb').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
}
