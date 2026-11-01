import type { Locator, Page } from '@playwright/test';
import { expect, paintingCard, summary, test } from './fixtures';

type PrintCounter = { printed: number };

/** Replace the browser print dialog with a counter, so tests can click "Print". */
async function stubPrint(page: Page) {
  await page.evaluate(() => {
    (window as unknown as PrintCounter).printed = 0;
    window.print = () => void (window as unknown as PrintCounter).printed++;
  });
}
const printCalls = (page: Page) => page.evaluate(() => (window as unknown as PrintCounter).printed);

async function openDialog(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Print chart' }).click();
  const dialog = page.getByRole('dialog', { name: 'Print chart' });
  await expect(dialog).toBeVisible();
  return dialog;
}

/** Confirm the dialog (with print stubbed), then look at the page as a printer would. */
async function confirmAndEnterPrint(page: Page, dialog: Locator) {
  await dialog.getByRole('button', { name: 'Print', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.emulateMedia({ media: 'print' });
}

async function pdfPageCount(page: Page): Promise<number> {
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  return pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
}

/** Color near the corner of the top-left square of a chart canvas (no coordinates), away from its number. */
async function firstSquareColor(canvas: Locator): Promise<string> {
  return canvas.evaluate((c: HTMLCanvasElement) => {
    // The print renderer draws 40px squares; sample 6px in, past the grid line.
    const scale = c.width / parseFloat(c.style.width);
    const [r, g, b] = c.getContext('2d')!.getImageData(Math.floor(6 * scale), Math.floor(6 * scale), 1, 1).data;
    return `${r},${g},${b}`;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(summary(page)).not.toBeEmpty();
  await stubPrint(page);
});

test('print options stay hidden until the user asks to print', async ({ page }) => {
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Paper', { exact: true })).toBeHidden();
  const dialog = await openDialog(page);
  await expect(dialog.getByRole('group', { name: 'Paper' })).toBeVisible();
  await expect(dialog.getByRole('region', { name: 'Print preview' })).toBeVisible();
});

test('the dialog closes with Cancel, the close button and Escape, without printing', async ({ page }) => {
  let dialog = await openDialog(page);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
  dialog = await openDialog(page);
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  dialog = await openDialog(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(await printCalls(page)).toBe(0);
});

test('the preview follows the options', async ({ page }) => {
  const dialog = await openDialog(page);
  const preview = dialog.getByRole('region', { name: 'Print preview' });
  await expect(preview).toContainText('2 pages · A4 portrait');
  await expect(preview.getByRole('figure')).toHaveCount(2);

  await dialog.getByRole('radio', { name: 'Landscape' }).check();
  await dialog.getByRole('radio', { name: 'A3' }).check();
  await dialog.getByLabel('Color list page').uncheck();
  await expect(preview).toContainText('1 page · A3 landscape');
  await expect(preview.getByRole('figure')).toHaveCount(1);
  const box = (await preview.locator('.paper-preview__sheet').boundingBox())!;
  expect(box.width).toBeGreaterThan(box.height);

  await dialog.getByLabel('Title').uncheck();
  await expect(preview.getByRole('heading')).toHaveCount(0);
});

test('blank squares turn the chart into an outline', async ({ page }) => {
  const dialog = await openDialog(page);
  await dialog.getByLabel('Coordinates').uncheck();
  const canvas = dialog.getByRole('img', { name: 'Chart preview' });
  expect(await firstSquareColor(canvas)).not.toBe('255,255,255');
  await dialog.getByRole('radio', { name: 'Blank' }).check();
  expect(await firstSquareColor(canvas)).toBe('255,255,255');
});

test('printing uses the dialog options, not the screen settings', async ({ page }) => {
  const dialog = await openDialog(page);
  await dialog.getByRole('radio', { name: 'Blank' }).check();
  await dialog.getByLabel('Coordinates').uncheck();
  await dialog.getByLabel('Title').uncheck();
  await dialog.getByLabel('Color list page').uncheck();
  await dialog.getByRole('radio', { name: 'Letter' }).check();
  await dialog.getByRole('radio', { name: 'Landscape' }).check();
  await confirmAndEnterPrint(page, dialog);
  expect(await printCalls(page)).toBe(1);

  const sheet = page.getByTestId('print-sheet');
  const printed = sheet.getByRole('img', { name: 'Printed chart' });
  await expect(printed).toBeVisible();
  await expect(sheet.getByRole('heading')).toHaveCount(0);
  await expect(sheet.locator('table')).toHaveCount(0);
  expect(await firstSquareColor(printed)).toBe('255,255,255');
  expect(await page.locator('style[data-print-page]').textContent()).toContain('size: Letter landscape');
  // The screen chart keeps its own settings.
  await page.emulateMedia({ media: 'screen' });
  await expect(page.getByRole('switch', { name: 'Show coordinates' })).toBeChecked();
});

test('printing shows only the chart, title and color list', async ({ page }) => {
  await confirmAndEnterPrint(page, await openDialog(page));
  const sheet = page.getByTestId('print-sheet');
  await expect(sheet.getByRole('heading', { level: 1 })).toHaveText('Kebab med tre pepperoni');
  await expect(sheet.locator('tbody tr')).toHaveCount(24);
  await expect(page.getByRole('region', { name: 'Choose a painting' })).toBeHidden();
  await expect(page.getByRole('region', { name: 'Chart settings' })).toBeHidden();
});

test('auto orientation follows the painting shape', async ({ page }) => {
  await paintingCard(page, 'The Pool').click();
  await expect(summary(page)).toContainText('32×16 pixels');
  const dialog = await openDialog(page);
  await expect(dialog.getByRole('region', { name: 'Print preview' })).toContainText('A4 landscape');
  await confirmAndEnterPrint(page, dialog);
  expect(await page.locator('style[data-print-page]').textContent()).toContain('size: A4 landscape');
});

test('Ctrl/Cmd+P uses the options last chosen in the dialog', async ({ page }) => {
  const dialog = await openDialog(page);
  await dialog.getByLabel('Color list page').uncheck();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByTestId('print-sheet').locator('table')).toHaveCount(0);
});

test('prints the chart on one page and the color list on the next', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'PDF export is Chromium-only');
  await confirmAndEnterPrint(page, await openDialog(page));
  expect(await pdfPageCount(page)).toBe(2);

  await page.emulateMedia({ media: 'screen' });
  const dialog = await openDialog(page);
  await dialog.getByLabel('Color list page').uncheck();
  await confirmAndEnterPrint(page, dialog);
  expect(await pdfPageCount(page)).toBe(1);
});
