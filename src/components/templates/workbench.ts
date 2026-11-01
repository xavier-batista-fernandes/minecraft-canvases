import { el } from '../dom';
import './workbench.css';

export interface WorkbenchSlots {
  header: Node;
  picker: Node;
  settings: Node;
  summary: Node;
  chart: Node;
  palette: Node;
  /** Shown only when printing; everything else is hidden then. */
  print: Node;
  /** Dialogs, opened on demand. */
  overlays: Node[];
}

/**
 * A painter's worktable: header and controls on top, then the chart at full width with the
 * palette under it. Layout only, no behavior.
 */
export function WorkbenchTemplate(slots: WorkbenchSlots): HTMLElement {
  return el('div', { className: 'workbench' }, [
    slots.header,
    el('main', { className: 'workbench__body' }, [slots.picker, slots.settings, slots.summary, slots.chart, slots.palette]),
    el('div', { className: 'workbench__print' }, [slots.print]),
    ...slots.overlays,
  ]);
}
