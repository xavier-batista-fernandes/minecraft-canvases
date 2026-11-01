import { el } from '../dom';
import './search-input.css';

export interface SearchInputProps {
  placeholder?: string;
  onInput?: (query: string) => void;
}

export function SearchInput({ placeholder = '', onInput }: SearchInputProps): HTMLInputElement {
  const input = el('input', { className: 'search-input', attrs: { type: 'search', placeholder } });
  if (onInput) input.addEventListener('input', () => onInput(input.value));
  return input;
}
