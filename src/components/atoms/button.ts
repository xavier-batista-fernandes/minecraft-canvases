import { cx, el } from '../dom';
import './button.css';

export interface ButtonProps {
  label: string;
  variant?: 'primary' | 'ghost';
  onClick?: () => void;
}

export function Button({ label, variant = 'primary', onClick }: ButtonProps): HTMLButtonElement {
  const button = el('button', { className: cx('btn', variant === 'ghost' && 'btn--ghost'), text: label, attrs: { type: 'button' } });
  if (onClick) button.addEventListener('click', onClick);
  return button;
}
