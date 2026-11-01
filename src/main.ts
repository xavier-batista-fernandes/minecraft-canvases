import './styles.css';
import { DEFAULT_PAINTING_ID, PAINTINGS, paintingUrl, type Painting } from './data/paintings';
import { resolveCrop } from './lib/crop';
import { paletteToText } from './lib/export';
import { fileToImageData, loadImageData } from './lib/image';
import { buildChart, type Chart } from './lib/quantize';
import { renderChart, suggestedCellSize } from './lib/render';
import { byId } from './ui/dom';
import { renderMeta } from './ui/meta';
import { renderPalette } from './ui/palette';
import { markSelected, renderPicker } from './ui/picker';

const STORAGE_KEY = 'painting';
/** Images larger than this are probably a sheet of many paintings; suggest cropping. */
const LARGE_IMAGE_PIXELS = 256 * 256;

const ui = {
  search: byId<HTMLInputElement>('q'),
  picker: byId('picker'),
  file: byId<HTMLInputElement>('file'),
  drop: byId('drop'),
  zoom: byId<HTMLInputElement>('zoom'),
  numbers: byId<HTMLInputElement>('nums'),
  coords: byId<HTMLInputElement>('coords'),
  lines: byId<HTMLInputElement>('lines'),
  colors: byId<HTMLInputElement>('k'),
  colorsLabel: byId('kval'),
  cropX: byId<HTMLInputElement>('cx'),
  cropY: byId<HTMLInputElement>('cy'),
  cropW: byId<HTMLInputElement>('cw'),
  cropH: byId<HTMLInputElement>('ch'),
  cropReset: byId<HTMLButtonElement>('cropReset'),
  meta: byId('meta'),
  canvas: byId<HTMLCanvasElement>('grid'),
  palette: byId('palette'),
  copy: byId<HTMLButtonElement>('copy'),
  toast: byId('toast'),
};
const cropInputs = [ui.cropX, ui.cropY, ui.cropW, ui.cropH];

const state: {
  source: ImageData | null;
  title: string;
  currentId: string | null;
  chart: Chart | null;
  highlight: number;
} = { source: null, title: '', currentId: null, chart: null, highlight: -1 };

function toast(message: string): void {
  ui.toast.textContent = message;
}

/** The colors slider's top value means "keep every exact color". */
function maxColors(): number {
  const max = Number(ui.colors.max);
  const value = Number(ui.colors.value);
  return value >= max ? Infinity : value;
}

function analyze(): void {
  const { source } = state;
  if (!source) return;
  const limit = maxColors();
  ui.colorsLabel.textContent = limit === Infinity ? 'All' : String(limit);
  const crop = resolveCrop(source.width, source.height, {
    x: Number(ui.cropX.value),
    y: Number(ui.cropY.value),
    width: Number(ui.cropW.value),
    height: Number(ui.cropH.value),
  });
  state.chart = crop ? buildChart(source, crop, limit) : null;
  if (state.chart) ui.colorsLabel.title = `${state.chart.originalColorCount} exact colors in the original`;
  if (!state.chart || state.highlight >= state.chart.palette.length) state.highlight = -1;
}

function draw(): void {
  if (!state.chart) return;
  const styles = getComputedStyle(document.documentElement);
  renderChart(
    ui.canvas,
    state.chart,
    {
      cellSize: Number(ui.zoom.value),
      showNumbers: ui.numbers.checked,
      showCoordinates: ui.coords.checked,
      showGridLines: ui.lines.checked,
      highlight: state.highlight,
    },
    {
      background: styles.getPropertyValue('--bg').trim(),
      muted: styles.getPropertyValue('--muted').trim(),
      font: '"IBM Plex Mono", monospace',
    },
  );
}

function renderSidebar(): void {
  if (!state.chart) {
    ui.palette.replaceChildren();
    ui.meta.replaceChildren();
    return;
  }
  renderPalette(ui.palette, state.chart, state.highlight, (i) => {
    state.highlight = state.highlight === i ? -1 : i;
    renderSidebar();
    draw();
  });
  renderMeta(ui.meta, state.title, state.chart);
}

function refresh(): void {
  analyze();
  renderSidebar();
  draw();
}

function setSource(source: ImageData, title: string): void {
  state.source = source;
  state.title = title;
  state.highlight = -1;
  ui.zoom.value = String(suggestedCellSize(source.width, source.height));
  refresh();
}

async function selectPainting(painting: Painting): Promise<void> {
  state.currentId = painting.id;
  markSelected(ui.picker, painting.id);
  try {
    localStorage.setItem(STORAGE_KEY, painting.id);
  } catch {
    // Storage can be unavailable (private mode); remembering the choice is optional.
  }
  try {
    const source = await loadImageData(paintingUrl(painting));
    if (state.currentId !== painting.id) return; // the user picked another one meanwhile
    cropInputs.forEach((input) => (input.value = '0'));
    toast('');
    setSource(source, painting.name);
  } catch {
    toast(`Could not load ${painting.name}.`);
  }
}

async function loadFile(file: File | null | undefined): Promise<void> {
  if (!file || !file.type.startsWith('image/')) {
    toast('That file is not an image. Choose a PNG.');
    return;
  }
  try {
    const source = await fileToImageData(file);
    state.currentId = null;
    markSelected(ui.picker, null);
    toast(source.width * source.height > LARGE_IMAGE_PIXELS ? 'Large image. Use “Crop a section” to pick one painting.' : '');
    setSource(source, file.name || 'Pasted image');
  } catch {
    toast('Could not read that image. Try a PNG file.');
  }
}

function showPicker(): void {
  renderPicker(ui.picker, PAINTINGS, ui.search.value, state.currentId, (p) => void selectPainting(p));
}

// --- Events -------------------------------------------------------------------------------

ui.search.addEventListener('input', showPicker);

ui.file.addEventListener('change', () => void loadFile(ui.file.files?.[0]));
for (const type of ['dragenter', 'dragover']) {
  ui.drop.addEventListener(type, (e) => {
    e.preventDefault();
    ui.drop.classList.add('over');
  });
}
for (const type of ['dragleave', 'drop']) {
  ui.drop.addEventListener(type, (e) => {
    e.preventDefault();
    ui.drop.classList.remove('over');
  });
}
ui.drop.addEventListener('drop', (e) => void loadFile((e as DragEvent).dataTransfer?.files[0]));
window.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
  if (item) void loadFile(item.getAsFile());
});

[ui.zoom, ui.numbers, ui.coords, ui.lines].forEach((input) => input.addEventListener('input', draw));
[ui.colors, ...cropInputs].forEach((input) => input.addEventListener('input', refresh));
ui.cropReset.addEventListener('click', () => {
  cropInputs.forEach((input) => (input.value = '0'));
  refresh();
});

ui.copy.addEventListener('click', () => {
  if (!state.chart) return;
  navigator.clipboard
    .writeText(paletteToText(state.title, state.chart))
    .then(() => toast('Copied the color list.'))
    .catch(() => toast('Copy is blocked here. Select the list and copy it by hand.'));
});

// Redraw when the theme changes, since the canvas uses theme colors.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
// Numbers are drawn with a web font; redraw once it has loaded.
void document.fonts?.ready.then(draw);

// --- Start --------------------------------------------------------------------------------

function initialPainting(): Painting {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return (
    PAINTINGS.find((p) => p.id === saved) ??
    PAINTINGS.find((p) => p.id === DEFAULT_PAINTING_ID) ??
    PAINTINGS[0]!
  );
}

const start = initialPainting();
state.currentId = start.id;
showPicker();
void selectPainting(start);
