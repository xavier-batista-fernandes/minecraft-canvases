import { el } from '../dom';
import './number-input.css';

export interface NumberInputProps {
  value: number;
  min?: number;
  onInput?: (value: number) => void;
}

export function NumberInput({ value, min = 0, onInput }: NumberInputProps): HTMLInputElement {
  const input = el('input', { className: 'number-input', attrs: { type: 'number', min: String(min) } });
  input.value = String(value);
  if (onInput) input.addEventListener('input', () => onInput(Number(input.value) || 0));
  return input;
}
