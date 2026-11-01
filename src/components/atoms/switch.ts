import { el } from '../dom';
import './switch.css';

export interface SwitchProps {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

/** An on/off setting. A real checkbox underneath (role="switch"), so it works with keyboard and forms. */
export function Switch({ label, checked = false, onChange }: SwitchProps): HTMLLabelElement {
  const input = el('input', { className: 'switch__input', attrs: { type: 'checkbox', role: 'switch' } });
  input.checked = checked;
  if (onChange) input.addEventListener('input', () => onChange(input.checked));
  return el('label', { className: 'switch' }, [input, el('span', { text: label })]);
}
