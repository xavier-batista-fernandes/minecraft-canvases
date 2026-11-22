import { clampWholeNumber, isWholeNumberInRange } from '../../lib/number';
import { NumberInput } from '../atoms';
import { el, uid } from '../dom';
import './number-field.css';

export interface NumberFieldProps {
  label: string;
  min: number;
  max: number;
  value: number;
  /** Short note next to the box, e.g. `(v) => \`of ${max}\``. */
  hint?: (value: number) => string;
  onChange: (value: number) => void;
}

/**
 * A labelled whole-number box. Valid numbers apply as you type; anything else (empty, out of
 * range, decimals) is clamped into range when you leave the box or press Enter.
 */
export function NumberField({ label, min, max, value, hint, onChange }: NumberFieldProps): HTMLDivElement {
  const id = uid('number');
  let current = value;
  const input = NumberInput({ min, max, value });
  input.id = id;
  const note = hint ? el('span', { className: 'number-field__hint', text: hint(value), attrs: { 'aria-live': 'polite' } }) : null;

  const apply = (v: number) => {
    if (note && hint) note.textContent = hint(v);
    if (v === current) return;
    current = v;
    onChange(v);
  };

  input.addEventListener('input', () => {
    if (isWholeNumberInRange(input.value, min, max)) apply(Number(input.value));
  });
  input.addEventListener('change', () => {
    const v = clampWholeNumber(input.value, min, max, current);
    input.value = String(v);
    apply(v);
  });

  return el('div', { className: 'number-field' }, [
    el('label', { text: label, attrs: { for: id } }),
    el('div', { className: 'number-field__control' }, [input, note]),
  ]);
}
