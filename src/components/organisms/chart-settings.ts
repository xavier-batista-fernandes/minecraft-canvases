import type { CropRect } from '../../lib/crop';
import type { RenderOptions } from '../../lib/render';
import { Button, Checkbox, NumberInput, Panel, Slider, Text } from '../atoms';
import { el } from '../dom';
import { Field, FieldValue, FileDrop, SectionHeader } from '../molecules';
import './chart-settings.css';

export type DisplaySettings = Omit<RenderOptions, 'highlight'>;

export interface AnalysisSettings {
  /** Maximum number of paints; Infinity keeps every exact color. */
  maxColors: number;
  crop: CropRect;
}

export interface ChartSettingsProps {
  onDisplayChange: (settings: DisplaySettings) => void;
  onAnalysisChange: (settings: AnalysisSettings) => void;
  onFile: (file: File | undefined) => void;
}

export interface ChartSettingsHandle {
  root: HTMLElement;
  display: () => DisplaySettings;
  analysis: () => AnalysisSettings;
  /** Set the cell size without firing a change (used when a new image loads). */
  setCellSize: (size: number) => void;
  /** Back to "whole image" without firing a change. */
  resetCrop: () => void;
  /** Tooltip on the paint count telling how many exact colors the original has. */
  setOriginalColorCount: (count: number) => void;
}

const COLORS_MIN = 2;
/** The slider's top value means "keep every exact color". */
const COLORS_ALL = 65;
const COLORS_DEFAULT = 24;

export function ChartSettings({ onDisplayChange, onAnalysisChange, onFile }: ChartSettingsProps): ChartSettingsHandle {
  const display: DisplaySettings = { cellSize: 30, showNumbers: true, showCoordinates: true, showGridLines: true };
  let colors = COLORS_DEFAULT;
  const crop: CropRect = { x: 0, y: 0, width: 0, height: 0 };

  const analysis = (): AnalysisSettings => ({ maxColors: colors >= COLORS_ALL ? Infinity : colors, crop: { ...crop } });
  const displayChanged = () => onDisplayChange({ ...display });
  const analysisChanged = () => onAnalysisChange(analysis());

  const cellSize = Slider({ min: 12, max: 48, value: display.cellSize, onInput: (v) => ((display.cellSize = v), displayChanged()) });
  const colorsValue = FieldValue(String(colors));
  const colorsSlider = Slider({
    min: COLORS_MIN,
    max: COLORS_ALL,
    value: colors,
    onInput: (v) => {
      colors = v;
      colorsValue.textContent = v >= COLORS_ALL ? 'All' : String(v);
      analysisChanged();
    },
  });

  const cropInputs = (['x', 'y', 'width', 'height'] as const).map((key) => ({
    key,
    input: NumberInput({ value: 0, onInput: (v) => ((crop[key] = v), analysisChanged()) }),
  }));
  const resetCrop = () => {
    cropInputs.forEach(({ key, input }) => {
      crop[key] = 0;
      input.value = '0';
    });
  };
  const cropLabels = { x: 'X', y: 'Y', width: 'Width', height: 'Height' };

  const root = Panel(
    [
      SectionHeader('Chart settings'),
      FileDrop({
        accept: 'image/png,image/*',
        onFile,
        label: [
          "Want a painting that isn't listed, or one from a resource pack? ",
          el('strong', { text: 'Choose a PNG' }),
          ', drag it here, or paste it.',
        ],
      }),
      el('div', { className: 'chart-settings__controls' }, [
        Field({ label: 'Cell size', control: cellSize }),
        Checkbox({ label: 'Show numbers', checked: display.showNumbers, onChange: (v) => ((display.showNumbers = v), displayChanged()) }),
        Checkbox({ label: 'Show coordinates', checked: display.showCoordinates, onChange: (v) => ((display.showCoordinates = v), displayChanged()) }),
        Checkbox({ label: 'Grid lines', checked: display.showGridLines, onChange: (v) => ((display.showGridLines = v), displayChanged()) }),
        Field({ label: 'Paint colors', value: colorsValue, control: colorsSlider }),
      ]),
      el('details', { className: 'chart-settings__crop' }, [
        el('summary', { text: "Crop a section (for a sheet with many paintings, like Bedrock's)" }),
        el('div', { className: 'chart-settings__controls' }, [
          ...cropInputs.map(({ key, input }) => Field({ label: cropLabels[key], control: input })),
          Button({ label: 'Use whole image', variant: 'ghost', onClick: () => (resetCrop(), analysisChanged()) }),
        ]),
        Text(
          'Width and height of 0 mean the whole image. Minecraft paintings are 16 pixels per block, so a 2×1 painting is 32×16.',
          { tone: 'muted', size: 'sm' },
        ),
      ]),
    ],
    { label: 'Chart settings' },
  );

  return {
    root,
    display: () => ({ ...display }),
    analysis,
    setCellSize(size) {
      display.cellSize = size;
      cellSize.value = String(size);
    },
    resetCrop,
    setOriginalColorCount(count) {
      colorsValue.title = `${count} exact colors in the original`;
    },
  };
}
