import { el } from '../dom';
import './field.css';

export interface FieldProps {
  label: string;
  control: HTMLElement;
  /** Optional live value shown after the label, e.g. "Paint colors: 24". */
  value?: HTMLElement;
}

/** A small caption above a form control. The whole thing is a <label>, so the caption names the control. */
export function Field({ label, control, value }: FieldProps): HTMLLabelElement {
  const caption = el('span', { className: 'field__label' }, [value ? `${label}: ` : label, value]);
  return el('label', { className: 'field' }, [caption, control]);
}

export function FieldValue(text: string): HTMLElement {
  return el('b', { className: 'field__value', text });
}
