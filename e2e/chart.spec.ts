import { expect, paintingCard, paletteRows, summary, test } from './fixtures';

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
});

test('the chart fills the available width', async ({ page }) => {
  const canvas = page.getByRole('img', { name: 'Paint-by-numbers chart' });
  const container = page.getByRole('region', { name: 'Chart' }).locator('.chart-canvas__scroll');
  const [chartWidth, containerWidth] = [(await canvas.boundingBox())!.width, (await container.boundingBox())!.width];
  expect(chartWidth).toBeLessThanOrEqual(containerWidth);
  expect(chartWidth).toBeGreaterThan(containerWidth * 0.85);
});

test('there is no image upload', async ({ page }) => {
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  await expect(page.getByText('Choose a PNG')).toHaveCount(0);
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

test('the paint colors slider runs from 1 to the painting\'s own color count', async ({ page }) => {
  const slider = page.getByRole('slider', { name: /Paint colors/ });
  const value = page.locator('.range-field', { hasText: 'Paint colors' }).locator('output');
  const total = Number((await summary(page).innerText()).match(/simplified from (\d+)/)![1]);
  await expect(slider).toHaveAttribute('min', '1');
  await expect(slider).toHaveAttribute('max', String(total));

  await slider.fill('1');
  await expect(paletteRows(page)).toHaveCount(1);
  await expect(value).toHaveText('1');

  await slider.fill('4');
  await expect(paletteRows(page)).toHaveCount(4);
  await expect(summary(page)).toContainText(`4 paint colors (simplified from ${total})`);

  await slider.fill(String(total));
  await expect(value).toHaveText(`${total} (all)`);
  await expect(paletteRows(page)).toHaveCount(total);
  await expect(summary(page)).not.toContainText('simplified');
});

test('the color range follows the selected painting', async ({ page }) => {
  const slider = page.getByRole('slider', { name: /Paint colors/ });
  await slider.fill(await slider.getAttribute('max') as string); // all colors
  await paintingCard(page, 'Wanderer').click();
  await expect(summary(page)).toContainText('Wanderer');
  const max = await slider.getAttribute('max');
  expect(Number(max)).toBeGreaterThan(24);
  await expect(slider).toHaveValue(max!); // "all" carries over
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
  const settings = page.getByRole('region', { name: 'Chart settings' });
  for (const label of ['Show numbers', 'Show coordinates', 'Grid lines']) await settings.getByLabel(label).uncheck();
  // Sample the middle of the top-left square, in device pixels.
  const cell = parseInt(await page.locator('.range-field', { hasText: 'Cell size' }).locator('output').innerText(), 10);
  const hex = await page.getByRole('img', { name: 'Paint-by-numbers chart' }).evaluate((canvas: HTMLCanvasElement, cell) => {
    const scale = canvas.width / canvas.getBoundingClientRect().width;
    const [r, g, b] = canvas.getContext('2d')!.getImageData(Math.floor((cell / 2) * scale), Math.floor((cell / 2) * scale), 1, 1).data;
    return '#' + [r, g, b].map((v) => v!.toString(16).padStart(2, '0')).join('').toUpperCase();
  }, cell);
  await expect(page.getByRole('list', { name: 'Paint colors' })).toContainText(hex);
});

test('display options change the canvas without changing the palette', async ({ page }) => {
  const canvas = page.getByRole('img', { name: 'Paint-by-numbers chart' });
  const before = (await canvas.boundingBox())!.width;
  await page.getByRole('region', { name: 'Chart settings' }).getByLabel('Show coordinates').uncheck();
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(before);
  await page.getByLabel('Cell size').fill('12');
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeLessThan(16 * 13);
  await expect(paletteRows(page)).toHaveCount(24);
});

test('copy list puts the palette on the clipboard', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy list' }).click();
  await expect(page.getByRole('complementary', { name: 'Palette' }).getByRole('status')).toHaveText('Copied the color list.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text.split('\n')[0]).toBe('Kebab med tre pepperoni (16x16)');
  expect(text.split('\n')).toHaveLength(25);
  expect(text).toMatch(/^1\t#[0-9A-F]{6}\tRGB\(\d+, \d+, \d+\)\t\d+ squares$/m);
});
