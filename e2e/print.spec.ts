import type { Page } from '@playwright/test';
import { expect, summary, test } from './fixtures';

/** Build the print layout the way the browser does before printing, then switch to print media. */
async function enterPrint(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
}

async function pdfPageCount(page: Page): Promise<number> {
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  return pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(summary(page)).not.toBeEmpty();
});

test('the print button opens the browser print dialog', async ({ page }) => {
  await page.evaluate(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => void (window as unknown as { printed: number }).printed++;
  });
  await page.getByRole('button', { name: 'Print chart' }).click();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
});

test('printing shows only the chart, title and color list', async ({ page }) => {
  await enterPrint(page);
  const sheet = page.getByTestId('print-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('heading', { level: 1 })).toHaveText('Kebab med tre pepperoni');
  await expect(sheet.getByRole('img', { name: 'Printed chart' })).toBeVisible();
  await expect(sheet.locator('tbody tr')).toHaveCount(24);
  await expect(page.getByRole('region', { name: 'Choose a painting' })).toBeHidden();
  await expect(page.getByRole('region', { name: 'Chart settings' })).toBeHidden();
});

test('print settings control paper, orientation, title and color list', async ({ page }) => {
  const print = page.getByRole('group', { name: 'Print' });
  await print.getByRole('radio', { name: 'Letter' }).check();
  await print.getByRole('radio', { name: 'Landscape' }).check();
  await page.getByLabel('Include title').uncheck();
  await page.getByLabel('Include color list').uncheck();
  await enterPrint(page);

  const sheet = page.getByTestId('print-sheet');
  await expect(sheet.getByRole('img', { name: 'Printed chart' })).toBeVisible();
  await expect(sheet.getByRole('heading')).toHaveCount(0);
  await expect(sheet.locator('table')).toHaveCount(0);
  const pageRule = await page.locator('style[data-print-page]').textContent();
  expect(pageRule).toContain('size: Letter landscape');
});

test('auto orientation follows the painting shape', async ({ page }) => {
  await page.getByRole('button', { name: 'The Pool', exact: true }).click();
  await expect(summary(page)).toContainText('32×16 pixels');
  await enterPrint(page);
  expect(await page.locator('style[data-print-page]').textContent()).toContain('size: A4 landscape');
});

test('the printed chart uses the display settings', async ({ page }) => {
  await page.getByLabel('Show coordinates').uncheck();
  await page.getByLabel('Grid lines').uncheck();
  await enterPrint(page);
  // Without coordinates the printed chart is exactly square for a 16×16 painting.
  const ratio = await page
    .getByTestId('print-sheet')
    .getByRole('img', { name: 'Printed chart' })
    .evaluate((c: HTMLCanvasElement) => c.width / c.height);
  expect(ratio).toBeCloseTo(1, 2);
});

test('prints the chart on one page and the color list on the next', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'PDF export is Chromium-only');
  await enterPrint(page);
  expect(await pdfPageCount(page)).toBe(2);

  await page.emulateMedia({ media: 'screen' });
  await page.getByLabel('Include color list').uncheck();
  await enterPrint(page);
  expect(await pdfPageCount(page)).toBe(1);
});
