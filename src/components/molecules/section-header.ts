import { Heading } from '../atoms';
import { el, type Child } from '../dom';
import './section-header.css';

/** A panel title with optional content (a control or hint) aligned to the right. */
export function SectionHeader(title: string, aside?: Child): HTMLElement {
  return el('div', { className: 'section-header' }, [Heading({ level: 2, text: title }), aside]);
}
