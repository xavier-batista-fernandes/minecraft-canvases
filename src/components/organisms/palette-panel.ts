import type { Chart } from '../../lib/quantize';
import { Button, Panel, Status } from '../atoms';
import { el } from '../dom';
import { PaletteRow, SectionHeader } from '../molecules';
import './palette-panel.css';

export interface PalettePanelProps {
  onToggle: (index: number) => void;
  onCopy: () => void;
}

export interface PalettePanelHandle {
  root: HTMLElement;
  update: (chart: Chart | null, highlight: number) => void;
  /** Show a short message (copy result, load errors). */
  notify: (message: string) => void;
}

/** The list of paints with their codes and counts. */
export function PalettePanel({ onToggle, onCopy }: PalettePanelProps): PalettePanelHandle {
  const list = el('div', { className: 'palette-panel__list', attrs: { role: 'list', 'aria-label': 'Paint colors' } });
  const status = Status();
  const root = Panel(
    [SectionHeader('Palette', Button({ label: 'Copy list', onClick: onCopy })), status.root, list],
    { as: 'aside', label: 'Palette' },
  );
  return {
    root,
    update(chart, highlight) {
      list.replaceChildren(
        ...(chart?.palette ?? []).map((entry, i) =>
          el('div', { attrs: { role: 'listitem' } }, [
            PaletteRow({ entry, selected: highlight === i, onToggle: () => onToggle(i) }),
          ]),
        ),
      );
    },
    notify: status.show,
  };
}
