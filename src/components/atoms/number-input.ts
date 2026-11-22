import { el } from '../dom';
import './number-input.css';

export interface NumberInputProps {
  min: number;
  max: number;
  value: number;
  step?: number;
}

/** A plain whole-number box. Validation and clamping live in the field that uses it. */
export function NumberInput({ min, max, value, step = 1 }: NumberInputProps): HTMLInputElement {
  const input = el('input', {
    className: 'number-input',
    attrs: { type: 'number', inputmode: 'numeric', min: String(min), max: String(max), step: String(step) },
  });
  input.value = String(value);
  return input;
}
