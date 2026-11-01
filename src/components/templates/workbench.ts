import { el } from '../dom';
import './workbench.css';

export interface WorkbenchSlots {
  header: Node;
  picker: Node;
  settings: Node;
  summary: Node;
  chart: Node;
  palette: Node;
  guide: Node;
}

/**
 * A painter's worktable: header and controls on top, the chart as the canvas with the palette
 * beside it (stacked on phones), and the guide at the bottom. Layout only, no behavior.
 */
export function WorkbenchTemplate(slots: WorkbenchSlots): HTMLElement {
  return el('div', { className: 'workbench' }, [
    slots.header,
    el('main', { className: 'workbench__body' }, [
      slots.picker,
      slots.settings,
      slots.summary,
      el('div', { className: 'workbench__split' }, [slots.chart, slots.palette]),
      slots.guide,
    ]),
  ]);
}
