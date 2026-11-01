import { el } from '../dom';
import './heading.css';

export interface HeadingProps {
  level: 1 | 2 | 3;
  text: string;
}

export function Heading({ level, text }: HeadingProps): HTMLHeadingElement {
  return el(`h${level}`, { className: `heading heading--${level}`, text });
}
