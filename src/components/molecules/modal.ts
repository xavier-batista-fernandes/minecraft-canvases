import { Heading } from '../atoms';
import { el, type Child } from '../dom';
import './modal.css';

export interface ModalProps {
  title: string;
  body: Child[];
  footer: Child[];
}

export interface ModalHandle {
  root: HTMLDialogElement;
  open: () => void;
  close: () => void;
}

/** A native modal dialog: traps focus, closes on Escape, and is never printed. */
export function Modal({ title, body, footer }: ModalProps): ModalHandle {
  const close = el('button', { className: 'modal__close', text: '×', attrs: { type: 'button', 'aria-label': 'Close' } });
  const root = el('dialog', { className: 'modal', attrs: { 'aria-label': title } }, [
    el('div', { className: 'modal__frame' }, [
      el('div', { className: 'modal__header' }, [Heading({ level: 2, text: title }), close]),
      el('div', { className: 'modal__body' }, body),
      el('div', { className: 'modal__footer' }, footer),
    ]),
  ]);
  close.addEventListener('click', () => root.close());
  // Click on the backdrop (outside the frame) closes too.
  root.addEventListener('click', (e) => {
    if (e.target === root) root.close();
  });
  return {
    root,
    open: () => {
      if (!root.open) root.showModal();
    },
    close: () => root.close(),
  };
}
