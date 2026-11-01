import { el, type Child } from '../dom';
import './settings-group.css';

/** A titled box of related settings. */
export function SettingsGroup(title: string, children: Child[]): HTMLFieldSetElement {
  return el('fieldset', { className: 'settings-group' }, [el('legend', { className: 'settings-group__legend', text: title }), ...children]);
}
