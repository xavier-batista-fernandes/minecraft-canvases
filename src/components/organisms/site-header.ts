import { Heading, Logo, Text } from '../atoms';
import { el } from '../dom';
import './site-header.css';

export function SiteHeader(): HTMLElement {
  return el('header', { className: 'site-header' }, [
    brand(),
    Text(
      'Pick a Minecraft painting and get a paint-by-numbers chart: every pixel numbered, every color listed with its hex and RGB code, and a count of how many squares need it.',
      { tone: 'muted' },
    ),
  ]);
}

function brand(): HTMLHeadingElement {
  const heading = Heading({ level: 1, text: 'Pixel Painting Chart' });
  heading.classList.add('site-header__brand');
  heading.prepend(Logo());
  return heading;
}
