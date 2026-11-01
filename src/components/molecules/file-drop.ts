import { el, type Child } from '../dom';
import './file-drop.css';

export interface FileDropProps {
  accept: string;
  label: Child[];
  onFile: (file: File | undefined) => void;
}

/** A click-to-choose file input that also accepts drag-and-drop. */
export function FileDrop({ accept, label, onFile }: FileDropProps): HTMLLabelElement {
  const input = el('input', { className: 'file-drop__input', attrs: { type: 'file', accept } });
  input.addEventListener('change', () => onFile(input.files?.[0]));
  const root = el('label', { className: 'file-drop' }, [input, ...label]);
  for (const type of ['dragenter', 'dragover']) {
    root.addEventListener(type, (e) => {
      e.preventDefault();
      root.classList.add('file-drop--over');
    });
  }
  for (const type of ['dragleave', 'drop']) {
    root.addEventListener(type, (e) => {
      e.preventDefault();
      root.classList.remove('file-drop--over');
    });
  }
  root.addEventListener('drop', (e) => onFile((e as DragEvent).dataTransfer?.files[0]));
  return root;
}
