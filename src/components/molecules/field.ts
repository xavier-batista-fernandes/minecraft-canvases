import { el } from '../dom';
import './field.css';

export interface FieldProps {
  label: string;
  control: HTMLElement;
}

/** A small caption above a form control. The whole thing is a <label>, so the caption names the control. */
export function Field({ label, control }: FieldProps): HTMLLabelElement {
  const caption = el('span', { className: 'field__label' }, [label]);
  return el('label', { className: 'field' }, [caption, control]);
}
