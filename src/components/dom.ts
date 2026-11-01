/** Child content accepted by components: nodes, plain text, or nothing. */
export type Child = Node | string | null | undefined | false;

export interface ElementProps {
  className?: string;
  text?: string;
  attrs?: Record<string, string>;
}

/** Small element factory. Text goes through textContent, so data is never parsed as HTML. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  node.append(...children.filter((c): c is Node | string => c !== null && c !== undefined && c !== false));
  return node;
}

/** Join class names, skipping falsy ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}

let nextId = 0;
/** A page-unique id, for wiring labels to controls. */
export function uid(prefix: string): string {
  return `${prefix}-${++nextId}`;
}
