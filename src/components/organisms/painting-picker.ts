import { groupPaintings, type Painting } from '../../data/paintings';
import { Heading, Panel, SearchInput, Text } from '../atoms';
import { el } from '../dom';
import { Field, PaintingCard, SectionHeader } from '../molecules';
import './painting-picker.css';

export interface PaintingPickerProps {
  paintings: readonly Painting[];
  onSelect: (painting: Painting) => void;
}

export interface PaintingPickerHandle {
  root: HTMLElement;
  /** Mark a painting as selected (null clears the selection, e.g. after an upload). */
  setSelected: (id: string | null) => void;
}

/** Searchable gallery of paintings, grouped by size in blocks. */
export function PaintingPicker({ paintings, onSelect }: PaintingPickerProps): PaintingPickerHandle {
  let selected: string | null = null;
  let query = '';
  const list = el('div', { className: 'painting-picker__list' });

  function render(): void {
    const groups = groupPaintings(paintings, query);
    if (!groups.length) {
      list.replaceChildren(Text('No painting matches that name.', { tone: 'muted' }));
      return;
    }
    list.replaceChildren(
      ...groups.map((group) =>
        el('div', { className: 'painting-picker__group', attrs: { role: 'group', 'aria-label': `${group.label} blocks` } }, [
          Heading({ level: 3, text: `${group.label} blocks · ${group.width}×${group.height} px` }),
          el(
            'div',
            { className: 'painting-picker__cards' },
            group.paintings.map((painting) =>
              PaintingCard({ painting, selected: painting.id === selected, onSelect }),
            ),
          ),
        ]),
      ),
    );
  }

  const search = SearchInput({
    placeholder: 'e.g. Wanderer',
    onInput: (value) => {
      query = value;
      render();
    },
  });

  const root = Panel(
    [
      SectionHeader('Choose a painting', Field({ label: 'Search', control: search })),
      list,
      Text(
        "Paintings from Minecraft Java Edition 1.21, grouped by size in blocks like on the Minecraft Wiki's Painting page. Artwork © Mojang and Kristoffer Zetterstrand / the original artists.",
        { tone: 'muted', size: 'xs' },
      ),
      Text('NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.', {
        tone: 'muted',
        size: 'xs',
        strong: true,
      }),
    ],
    { label: 'Choose a painting' },
  );

  render();
  return {
    root,
    setSelected(id) {
      selected = id;
      list.querySelectorAll<HTMLElement>('.painting-card').forEach((card) => {
        card.setAttribute('aria-pressed', String(card.dataset.id === id));
      });
    },
  };
}
