import { DEFAULT_PAINTING_ID, PAINTINGS, paintingUrl, type Painting } from '../../data/paintings';
import { resolveCrop } from '../../lib/crop';
import { paletteToText } from '../../lib/export';
import { fileToImageData, loadImageData } from '../../lib/image';
import { buildChart, type Chart } from '../../lib/quantize';
import { suggestedCellSize } from '../../lib/render';
import { ChartSummary } from '../molecules';
import { ChartCanvas, ChartSettings, HowToGuide, PaintingPicker, PalettePanel, SiteHeader } from '../organisms';
import { WorkbenchTemplate } from '../templates';

const STORAGE_KEY = 'painting';
/** Images larger than this are probably a sheet of many paintings; suggest cropping. */
const LARGE_IMAGE_PIXELS = 256 * 256;

function savedPaintingId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage can be unavailable (private mode)
  }
}

function savePaintingId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // remembering the choice is optional
  }
}

/**
 * The app's only page. Owns the state (source image, chart, highlighted paint) and wires the
 * organisms together; the organisms themselves know nothing about each other.
 */
export function ChartPage(): HTMLElement {
  const state: {
    source: ImageData | null;
    title: string;
    currentId: string | null;
    chart: Chart | null;
    highlight: number;
  } = { source: null, title: '', currentId: null, chart: null, highlight: -1 };

  const summary = ChartSummary();
  const canvas = ChartCanvas();
  const palette = PalettePanel({
    onToggle: (i) => {
      state.highlight = state.highlight === i ? -1 : i;
      palette.update(state.chart, state.highlight);
      draw();
    },
    onCopy: () => {
      if (!state.chart) return;
      navigator.clipboard
        .writeText(paletteToText(state.title, state.chart))
        .then(() => palette.notify('Copied the color list.'))
        .catch(() => palette.notify('Copy is blocked here. Select the list and copy it by hand.'));
    },
  });
  const settings = ChartSettings({
    onDisplayChange: () => draw(),
    onAnalysisChange: () => refresh(),
    onFile: (file) => void loadFile(file),
  });
  const picker = PaintingPicker({ paintings: PAINTINGS, onSelect: (p) => void selectPainting(p) });

  function analyze(): void {
    const { source } = state;
    if (!source) return;
    const { maxColors, crop } = settings.analysis();
    const area = resolveCrop(source.width, source.height, crop);
    state.chart = area ? buildChart(source, area, maxColors) : null;
    if (state.chart) settings.setOriginalColorCount(state.chart.originalColorCount);
    if (!state.chart || state.highlight >= state.chart.palette.length) state.highlight = -1;
  }

  function draw(): void {
    canvas.render(state.chart, { ...settings.display(), highlight: state.highlight });
  }

  function refresh(): void {
    analyze();
    summary.update(state.title, state.chart);
    palette.update(state.chart, state.highlight);
    draw();
  }

  function setSource(source: ImageData, title: string): void {
    state.source = source;
    state.title = title;
    state.highlight = -1;
    settings.setCellSize(suggestedCellSize(source.width, source.height));
    refresh();
  }

  async function selectPainting(painting: Painting): Promise<void> {
    state.currentId = painting.id;
    picker.setSelected(painting.id);
    savePaintingId(painting.id);
    try {
      const source = await loadImageData(paintingUrl(painting));
      if (state.currentId !== painting.id) return; // another painting was picked meanwhile
      settings.resetCrop();
      palette.notify('');
      setSource(source, painting.name);
    } catch {
      palette.notify(`Could not load ${painting.name}.`);
    }
  }

  async function loadFile(file: File | null | undefined): Promise<void> {
    if (!file || !file.type.startsWith('image/')) {
      palette.notify('That file is not an image. Choose a PNG.');
      return;
    }
    try {
      const source = await fileToImageData(file);
      state.currentId = null;
      picker.setSelected(null);
      settings.resetCrop();
      palette.notify(
        source.width * source.height > LARGE_IMAGE_PIXELS ? 'Large image. Use “Crop a section” to pick one painting.' : '',
      );
      setSource(source, file.name || 'Pasted image');
    } catch {
      palette.notify('Could not read that image. Try a PNG file.');
    }
  }

  // Paste an image anywhere on the page.
  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
    if (item) void loadFile(item.getAsFile());
  });
  // The canvas uses theme colors and a web font, so redraw when either changes.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  void document.fonts?.ready.then(draw);

  const start =
    PAINTINGS.find((p) => p.id === savedPaintingId()) ??
    PAINTINGS.find((p) => p.id === DEFAULT_PAINTING_ID) ??
    PAINTINGS[0]!;
  void selectPainting(start);

  return WorkbenchTemplate({
    header: SiteHeader(),
    picker: picker.root,
    settings: settings.root,
    summary: summary.root,
    chart: canvas.root,
    palette: palette.root,
    guide: HowToGuide(),
  });
}
