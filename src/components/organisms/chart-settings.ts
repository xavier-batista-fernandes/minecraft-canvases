import { MAX_CELL_SIZE, MIN_CELL_SIZE, type RenderOptions } from '../../lib/render';
import { Button, Panel, Switch, Text } from '../atoms';
import { el } from '../dom';
import { RangeField, SectionHeader, SegmentedControl, SettingsGroup } from '../molecules';
import './chart-settings.css';

export type DisplaySettings = Omit<RenderOptions, 'highlight'>;

export interface AnalysisSettings {
  /** Maximum number of paints. At the painting's own color count, nothing is simplified. */
  maxColors: number;
}

export type PaperSize = 'A4' | 'Letter' | 'A3';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface PrintSettings {
  paper: PaperSize;
  /** "auto" picks landscape for charts wider than they are tall. */
  orientation: Orientation;
  includeTitle: boolean;
  includePalette: boolean;
}

export interface ChartSettingsProps {
  onDisplayChange: (settings: DisplaySettings) => void;
  onAnalysisChange: (settings: AnalysisSettings) => void;
  onPrint: () => void;
}

export interface ChartSettingsHandle {
  root: HTMLElement;
  display: () => DisplaySettings;
  analysis: () => AnalysisSettings;
  print: () => PrintSettings;
  /** Set the cell size without firing a change (used when a new painting loads). */
  setCellSize: (size: number) => void;
  /**
   * Let the paint color slider run from 1 to `count` (the painting's exact colors), keeping the
   * current choice when it still fits. Does not fire a change.
   */
  setColorCount: (count: number) => void;
}

const COLORS_DEFAULT = 24;

export function ChartSettings({ onDisplayChange, onAnalysisChange, onPrint }: ChartSettingsProps): ChartSettingsHandle {
  const display: DisplaySettings = { cellSize: 30, showNumbers: true, showCoordinates: true, showGridLines: true };
  const print: PrintSettings = { paper: 'A4', orientation: 'auto', includeTitle: true, includePalette: true };
  let colors = COLORS_DEFAULT;
  /** Colors in the current painting; the slider's top end. */
  let colorCount = COLORS_DEFAULT;
  let hasColorCount = false;

  const analysis = (): AnalysisSettings => ({ maxColors: colors });
  const setDisplay = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    display[key] = value;
    onDisplayChange({ ...display });
  };

  // The cell size slider is rebuilt when a new painting suggests a size, so keep a slot for it.
  const cellSlot = el('div');
  const renderCellSize = () =>
    cellSlot.replaceChildren(
      RangeField({
        label: 'Cell size',
        min: MIN_CELL_SIZE,
        max: MAX_CELL_SIZE,
        value: display.cellSize,
        format: (v) => `${v} px`,
        onInput: (v) => setDisplay('cellSize', v),
      }),
    );
  renderCellSize();

  // Rebuilt whenever a painting with a different number of colors loads.
  const colorsSlot = el('div');
  const renderColors = () =>
    colorsSlot.replaceChildren(
      RangeField({
        label: 'Paint colors',
        min: 1,
        max: colorCount,
        value: colors,
        format: (v) => (v === colorCount ? `${v} (all)` : String(v)),
        onInput: (v) => {
          colors = v;
          onAnalysisChange(analysis());
        },
      }),
    );
  renderColors();

  const root = Panel(
    [
      SectionHeader('Chart settings', Button({ label: 'Print chart', onClick: onPrint })),
      el('div', { className: 'chart-settings__groups' }, [
        SettingsGroup('Colors', [
          colorsSlot,
          Text('Fewer colors are easier to mix. Paints are numbered from dark to light.', { tone: 'muted', size: 'sm' }),
        ]),
        SettingsGroup('Display', [
          cellSlot,
          Switch({ label: 'Show numbers', checked: display.showNumbers, onChange: (v) => setDisplay('showNumbers', v) }),
          Switch({ label: 'Show coordinates', checked: display.showCoordinates, onChange: (v) => setDisplay('showCoordinates', v) }),
          Switch({ label: 'Grid lines', checked: display.showGridLines, onChange: (v) => setDisplay('showGridLines', v) }),
        ]),
        SettingsGroup('Print', [
          SegmentedControl<PaperSize>({
            label: 'Paper',
            name: 'paper',
            value: print.paper,
            options: [
              { value: 'A4', label: 'A4' },
              { value: 'Letter', label: 'Letter' },
              { value: 'A3', label: 'A3' },
            ],
            onChange: (v) => (print.paper = v),
          }),
          SegmentedControl<Orientation>({
            label: 'Orientation',
            name: 'orientation',
            value: print.orientation,
            options: [
              { value: 'auto', label: 'Auto' },
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ],
            onChange: (v) => (print.orientation = v),
          }),
          Switch({ label: 'Include title', checked: print.includeTitle, onChange: (v) => (print.includeTitle = v) }),
          Switch({ label: 'Include color list', checked: print.includePalette, onChange: (v) => (print.includePalette = v) }),
          Text('The chart prints with the colors and display options above, scaled to fit the page.', { tone: 'muted', size: 'sm' }),
        ]),
      ]),
    ],
    { label: 'Chart settings' },
  );

  return {
    root,
    display: () => ({ ...display }),
    analysis,
    print: () => ({ ...print }),
    setCellSize(size) {
      display.cellSize = size;
      renderCellSize();
    },
    setColorCount(count) {
      const wasAll = hasColorCount && colors === colorCount;
      hasColorCount = true;
      colorCount = Math.max(1, count);
      // "All colors" stays "all colors" on the next painting; anything else is kept, capped.
      colors = wasAll ? colorCount : Math.min(colors, colorCount);
      renderColors();
    },
  };
}
