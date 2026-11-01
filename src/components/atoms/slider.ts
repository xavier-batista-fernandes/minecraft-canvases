import { el } from '../dom';
import './slider.css';

export interface SliderProps {
  min: number;
  max: number;
  value: number;
  onInput?: (value: number) => void;
}

export function Slider({ min, max, value, onInput }: SliderProps): HTMLInputElement {
  const input = el('input', { className: 'slider', attrs: { type: 'range', min: String(min), max: String(max) } });
  input.value = String(value);
  if (onInput) input.addEventListener('input', () => onInput(Number(input.value)));
  return input;
}
