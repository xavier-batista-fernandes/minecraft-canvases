import { el } from '../dom';
import './checkbox.css';

export interface CheckboxProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Checkbox({ label, checked = false, onChange }: CheckboxProps): HTMLLabelElement {
  const input = el('input', { attrs: { type: 'checkbox' } });
  input.checked = checked;
  if (onChange) input.addEventListener('input', () => onChange(input.checked));
  return el('label', { className: 'checkbox' }, [input, label]);
}
