import { el } from '../dom';
import './status.css';

export interface StatusHandle {
  root: HTMLElement;
  show: (message: string) => void;
}

/** A live region for short confirmations and errors. */
export function Status(): StatusHandle {
  const root = el('div', { className: 'status', attrs: { role: 'status' } });
  return { root, show: (message) => (root.textContent = message) };
}
