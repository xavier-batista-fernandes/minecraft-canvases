import { cx, el, type Child } from '../dom';
import './text.css';

export interface TextProps {
  tone?: 'default' | 'muted';
  size?: 'md' | 'sm' | 'xs';
  strong?: boolean;
  as?: 'p' | 'span';
}

export function Text(children: Child | Child[], { tone = 'default', size = 'md', strong = false, as = 'p' }: TextProps = {}): HTMLElement {
  return el(
    as,
    { className: cx('text', tone === 'muted' && 'text--muted', size !== 'md' && `text--${size}`, strong && 'text--strong') },
    Array.isArray(children) ? children : [children],
  );
}
