import { el } from '../dom';
import './segmented-control.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  /** Unique per page; groups the radio buttons. */
  name: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Pick one of a few options. Radio buttons underneath, styled as a button row. */
export function SegmentedControl<T extends string>({ label, name, options, value, onChange }: SegmentedControlProps<T>): HTMLFieldSetElement {
  return el('fieldset', { className: 'segmented' }, [
    el('legend', { className: 'segmented__legend', text: label }),
    el(
      'div',
      { className: 'segmented__options' },
      options.map((option) => {
        const input = el('input', { attrs: { type: 'radio', name, value: option.value } });
        input.checked = option.value === value;
        input.addEventListener('change', () => input.checked && onChange(option.value));
        return el('label', { className: 'segmented__option' }, [input, el('span', { text: option.label })]);
      }),
    ),
  ]);
}
