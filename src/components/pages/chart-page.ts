import { DEFAULT_PAINTING_ID, PAINTINGS, paintingUrl, type Painting } from '../../data/paintings';
import { resolveCrop } from '../../lib/crop';
import { paletteToText } from '../../lib/export';
import { loadImageData } from '../../lib/image';
import { buildChart, type Chart } from '../../lib/quantize';
import { fitCellSize } from '../../lib/render';
import { ChartSummary } from '../molecules';
import { ChartCanvas, ChartSettings, PaintingPicker, PalettePanel, PrintSheet, SiteHeader } from '../organisms';
import { WorkbenchTemplate } from '../templates';

const STORAGE_KEY = 'painting';

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
  const printSheet = PrintSheet();
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
    onPrint: () => window.print(),
  });
  const picker = PaintingPicker({ paintings: PAINTINGS, onSelect: (p) => void selectPainting(p) });

  function analyze(): void {
    const { source } = state;
    if (!source) return;
    const area = resolveCrop(source.width, source.height);
    state.chart = area ? buildChart(source, area, settings.analysis().maxColors) : null;
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

  function preparePrint(): void {
    if (!state.chart) return;
    printSheet.prepare({
      title: state.title,
      summary: [...summary.root.children].map((c) => c.textContent).join(' · '),
      chart: state.chart,
      options: { ...settings.display(), highlight: state.highlight },
      settings: settings.print(),
    });
  }

  async function selectPainting(painting: Painting): Promise<void> {
    state.currentId = painting.id;
    picker.setSelected(painting.id);
    savePaintingId(painting.id);
    try {
      const source = await loadImageData(paintingUrl(painting));
      if (state.currentId !== painting.id) return; // another painting was picked meanwhile
      palette.notify('');
      state.source = source;
      state.title = painting.name;
      state.highlight = -1;
      settings.setCellSize(fitCellSize(source.width, canvas.availableWidth()));
      refresh();
    } catch {
      palette.notify(`Could not load ${painting.name}.`);
    }
  }

  // Build the printed pages from the current settings, whether printing starts from the
  // button or from the browser (Ctrl/Cmd+P).
  window.addEventListener('beforeprint', preparePrint);
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
    print: printSheet.root,
  });
}
