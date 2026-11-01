import { fileURLToPath } from 'node:url';
import { expect, paintingCard, paletteRows, summary, test } from './fixtures';

const fixture = (name: string) => fileURLToPath(new URL(`../public/paintings/${name}`, import.meta.url));

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(summary(page)).not.toBeEmpty();
});

test('opens on the default painting with a full chart and palette', async ({ page }) => {
  await expect(page).toHaveTitle('Pixel Painting Chart');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pixel Painting Chart');
  const logo = page.getByRole('heading', { level: 1 }).locator('img');
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await expect(summary(page)).toContainText('Kebab med tre pepperoni');
  await expect(summary(page)).toContainText('16×16 pixels · 1×1 blocks');
  await expect(summary(page)).toContainText('256 squares');
  await expect(paintingCard(page, 'Kebab med tre pepperoni')).toHaveAttribute('aria-pressed', 'true');
  await expect(paletteRows(page)).toHaveCount(24);
  const canvas = page.getByRole('img', { name: 'Paint-by-numbers chart' });
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(16 * 30);
});

test('lists every painting, grouped by size', async ({ page }) => {
  const picker = page.getByRole('region', { name: 'Choose a painting' });
  await expect(picker.locator('.painting-card')).toHaveCount(50);
  await expect(picker.getByRole('group', { name: '1×1 blocks' }).getByRole('button')).toHaveCount(8);
  await expect(picker.getByRole('group', { name: '4×4 blocks' }).getByRole('button')).toHaveCount(5);
});

test('search filters the picker and shows an empty state', async ({ page }) => {
  const picker = page.getByRole('region', { name: 'Choose a painting' });
  const search = picker.getByLabel('Search');
  await search.fill('wander');
  await expect(picker.locator('.painting-card')).toHaveCount(1);
  await expect(paintingCard(page, 'Wanderer')).toBeVisible();
  await search.fill('no such painting');
  await expect(picker.getByText('No painting matches that name.')).toBeVisible();
  await search.fill('');
  await expect(picker.locator('.painting-card')).toHaveCount(50);
});

test('selecting a painting updates the chart and is remembered after reload', async ({ page }) => {
  await paintingCard(page, 'Wanderer').click();
  await expect(summary(page)).toContainText('Wanderer');
  await expect(summary(page)).toContainText('16×32 pixels · 1×2 blocks');
  await expect(paintingCard(page, 'Wanderer')).toHaveAttribute('aria-pressed', 'true');
  await expect(paintingCard(page, 'Kebab med tre pepperoni')).toHaveAttribute('aria-pressed', 'false');

  await page.reload();
  await expect(summary(page)).toContainText('Wanderer');
  await expect(paintingCard(page, 'Wanderer')).toHaveAttribute('aria-pressed', 'true');
});

test('the paint colors slider simplifies the palette', async ({ page }) => {
  const slider = page.getByRole('slider', { name: /Paint colors/ });
  await slider.fill('4');
  await expect(paletteRows(page)).toHaveCount(4);
  await expect(summary(page)).toContainText(/4 paint colors \(simplified from \d+\)/);

  await slider.fill('65');
  await expect(page.getByText('Paint colors: All')).toBeVisible();
  await expect(summary(page)).not.toContainText('simplified');
});

test('clicking a paint highlights it, clicking again clears it', async ({ page }) => {
  const row = paletteRows(page).first().getByRole('button');
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'false');
});

test('the chart is drawn in the palette colors', async ({ page }) => {
  for (const label of ['Show numbers', 'Show coordinates', 'Grid lines']) await page.getByLabel(label).uncheck();
  // Sample the middle of the top-left square, in device pixels.
  const hex = await page.getByRole('img', { name: 'Paint-by-numbers chart' }).evaluate((canvas: HTMLCanvasElement) => {
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    const cell = 40; // suggested cell size for a 16×16 painting
    const [r, g, b] = canvas.getContext('2d')!.getImageData(Math.floor((cell / 2) * scale), Math.floor((cell / 2) * scale), 1, 1).data;
    return '#' + [r, g, b].map((v) => v!.toString(16).padStart(2, '0')).join('').toUpperCase();
  });
  await expect(page.getByRole('list', { name: 'Paint colors' })).toContainText(hex);
});

test('display options change the canvas without changing the palette', async ({ page }) => {
  const canvas = page.getByRole('img', { name: 'Paint-by-numbers chart' });
  const before = (await canvas.boundingBox())!.width;
  await page.getByLabel('Show coordinates').uncheck();
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(before);
  await page.getByLabel('Cell size').fill('12');
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(16 * 13);
  await expect(paletteRows(page)).toHaveCount(24);
});

test('copy list puts the palette on the clipboard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy list' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied the color list.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.split('\n')[0]).toBe('Kebab med tre pepperoni (16x16)');
  expect(text.split('\n')).toHaveLength(25);
  expect(text).toMatch(/^1\t#[0-9A-F]{6}\tRGB\(\d+, \d+, \d+\)\t\d+ squares$/m);
});

test('uploading a PNG charts it and clears the picker selection', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles(fixture('pool.png'));
  await expect(summary(page)).toContainText('pool.png');
  await expect(summary(page)).toContainText('32×16 pixels · 2×1 blocks');
  await expect(page.locator('.painting-card[aria-pressed="true"]')).toHaveCount(0);
});

test('rejects a file that is not an image', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hi') });
  await expect(page.getByRole('status')).toHaveText('That file is not an image. Choose a PNG.');
  await expect(summary(page)).toContainText('Kebab med tre pepperoni');
});

test('crop picks a section of the image and can be reset', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles(fixture('pointer.png'));
  await expect(summary(page)).toContainText('64×64 pixels');
  await page.getByText(/^Crop a section/).click();
  await page.getByLabel('X', { exact: true }).fill('16');
  await page.getByLabel('Width', { exact: true }).fill('32');
  await page.getByLabel('Height', { exact: true }).fill('16');
  await expect(summary(page)).toContainText('32×16 pixels · 2×1 blocks');
  await page.getByRole('button', { name: 'Use whole image' }).click();
  await expect(summary(page)).toContainText('64×64 pixels');
  await expect(page.getByLabel('Width', { exact: true })).toHaveValue('0');
});
