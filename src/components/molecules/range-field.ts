import { Slider } from '../atoms';
import { el, uid } from '../dom';
import './range-field.css';

export interface RangeFieldProps {
  label: string;
  min: number;
  max: number;
  value: number;
  /** How to show the current value, e.g. `(v) => \`${v} px\``. */
  format?: (value: number) => string;
  onInput: (value: number) => void;
}

/** A labelled slider that shows its current value. */
export function RangeField({ label, min, max, value, format = String, onInput }: RangeFieldProps): HTMLDivElement {
  const id = uid('range');
  const output = el('output', { className: 'range-field__value', text: format(value), attrs: { for: id } });
  const slider = Slider({
    min,
    max,
    value,
    onInput: (v) => {
      output.textContent = format(v);
      onInput(v);
    },
  });
  slider.id = id;
  // The <output> sits outside the <label>: a label wrapping it would name the output, not the slider.
  return el('div', { className: 'range-field' }, [
    el('div', { className: 'range-field__top' }, [el('label', { text: label, attrs: { for: id } }), output]),
    slider,
  ]);
}
