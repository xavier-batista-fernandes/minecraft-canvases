import { el, type Child } from '../dom';
import './panel.css';

export interface PanelProps {
  as?: 'section' | 'aside' | 'div';
  label?: string;
}

/** A card surface. `label` names the region for assistive tech (and tests). */
export function Panel(children: Child[], { as = 'section', label }: PanelProps = {}): HTMLElement {
  return el(as, { className: 'panel', attrs: label ? { 'aria-label': label } : {} }, children);
}
