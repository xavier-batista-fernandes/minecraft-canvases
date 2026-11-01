import { el } from '../dom';
import './pixel-image.css';

export interface PixelImageProps {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

/** An image scaled with crisp, unblurred pixels. */
export function PixelImage({ src, width, height, alt = '' }: PixelImageProps): HTMLImageElement {
  return el('img', {
    className: 'pixel-image',
    attrs: { src, alt, width: String(width), height: String(height), loading: 'lazy' },
  });
}
