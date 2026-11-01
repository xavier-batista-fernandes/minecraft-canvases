import { Panel, Text } from '../atoms';
import { el, type Child } from '../dom';
import { SectionHeader } from '../molecules';
import './how-to-guide.css';

const code = (text: string) => el('code', { text });
const steps = (items: Child[][]) => el('ol', {}, items.map((parts) => el('li', {}, parts)));

/** Where to find the painting textures in your own copy of Minecraft. */
export function HowToGuide(): HTMLElement {
  const root = Panel(
    [
      SectionHeader('Getting the painting images'),
      Text(
        'The images come from your own copy of Minecraft. They are tiny (16 pixels per block), so open them here rather than in a photo viewer, which blurs them.',
      ),
      el('div', { className: 'how-to-guide__columns' }, [
        el('div', {}, [
          el('strong', { text: 'Java Edition (PC)' }),
          steps([
            ['Open your ', code('.minecraft'), ' folder. On Windows, press Win+R and type ', code('%appdata%\\.minecraft'), '. On Mac it is ', code('~/Library/Application Support/minecraft'), '.'],
            ['Go to ', code('versions'), ', then the version folder, for example ', code('1.21.4'), '.'],
            ['Copy the ', code('.jar'), ' file somewhere else, rename the copy to end in ', code('.zip'), ', and open it.'],
            ['Go to ', code('assets/minecraft/textures/painting/'), '. Each painting is its own PNG, named after it, like ', code('kebab.png'), ' or ', code('wanderer.png'), '.'],
          ]),
        ]),
        el('div', {}, [
          el('strong', { text: 'Bedrock Edition (phone, console, Windows)' }),
          steps([
            ["Download the official Bedrock sample resource pack from Mojang's GitHub (", code('Mojang/bedrock-samples'), ').'],
            ['Open ', code('resource_pack/textures/painting/kz.png'), '. All paintings share this one sheet.'],
            ["Upload it here, then open “Crop a section” and enter the painting's position and size in pixels."],
          ]),
        ]),
      ]),
    ],
    { label: 'Getting the painting images' },
  );
  root.classList.add('how-to-guide');
  return root;
}
