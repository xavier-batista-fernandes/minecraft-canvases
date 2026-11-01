import { paintingUrl, type Painting } from '../../data/paintings';
import { PixelImage } from '../atoms';
import { el } from '../dom';
import './painting-card.css';

const MAX_W = 80;
const MAX_H = 48;

export interface PaintingCardProps {
  painting: Painting;
  selected: boolean;
  onSelect: (painting: Painting) => void;
}

export function PaintingCard({ painting, selected, onSelect }: PaintingCardProps): HTMLButtonElement {
  const scale = Math.min(MAX_W / painting.width, MAX_H / painting.height);
  const button = el(
    'button',
    {
      className: 'painting-card',
      attrs: { type: 'button', 'data-id': painting.id, 'aria-pressed': String(selected) },
    },
    [
      el('span', { className: 'painting-card__image' }, [
        PixelImage({ src: paintingUrl(painting), width: painting.width * scale, height: painting.height * scale }),
      ]),
      el('span', { text: painting.name }),
    ],
  );
  button.addEventListener('click', () => onSelect(painting));
  return button;
}
