import { expect, test as base, type Page } from '@playwright/test';

/**
 * Shared setup for every test:
 * - answers third-party requests (web fonts) with an empty stylesheet, so tests are hermetic;
 * - fails the test if the page logs an error or throws.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page, baseURL }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const origin = new URL(baseURL!).origin;
    await page.route('**/*', (route) =>
      route.request().url().startsWith(origin)
        ? route.continue()
        : route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
    );
    await use(page);
    expect(errors, 'console errors').toEqual([]);
  },
});

export { expect };

export const summary = (page: Page) => page.getByTestId('chart-summary');
export const paletteRows = (page: Page) => page.getByRole('list', { name: 'Paint colors' }).getByRole('listitem');
export const paintingCard = (page: Page, name: string) =>
  page.getByRole('region', { name: 'Choose a painting' }).getByRole('button', { name, exact: true });
