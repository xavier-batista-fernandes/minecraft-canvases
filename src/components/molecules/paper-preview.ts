import { el, type Child } from '../dom';
import './paper-preview.css';

export interface PaperPreviewProps {
  /** Page size in millimetres (after orientation). */
  widthMm: number;
  heightMm: number;
  marginMm: number;
  label: string;
  content: Child[];
}

/** A scaled sheet of paper with margins, for print previews. */
export function PaperPreview({ widthMm, heightMm, marginMm, label, content }: PaperPreviewProps): HTMLElement {
  const sheet = el('div', { className: 'paper-preview__sheet' }, [el('div', { className: 'paper-preview__content' }, content)]);
  sheet.style.aspectRatio = `${widthMm} / ${heightMm}`;
  const inner = sheet.firstElementChild as HTMLElement;
  // Margins as a share of the sheet, so they scale with it.
  inner.style.inset = `${(marginMm / heightMm) * 100}% ${(marginMm / widthMm) * 100}%`;
  return el('figure', { className: 'paper-preview', attrs: { 'aria-label': label } }, [
    sheet,
    el('figcaption', { className: 'paper-preview__label', text: label }),
  ]);
}
