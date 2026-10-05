import { test, expect } from '@playwright/test';
import { product, categories } from '../src/test/catalog-fixtures';

const urls = [1, 2, 3].map((i) => `https://gallery.example.test/${i}.svg`);

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = { ...product, thumbnailUrl: urls[0], images: urls.map((url, i) => ({ id: String(i), url, sortOrder: i })) };
    if (path.endsWith('/products/' + product.slug)) return route.fulfill({ json: data });
    if (path.endsWith('/categories')) return route.fulfill({ json: categories });
    if (path.endsWith('/products')) return route.fulfill({ json: { content: [data], page: 0, size: 12, totalElements: 1, totalPages: 1 } });
    return route.fulfill({ json: {} });
  });
  await page.route('https://gallery.example.test/**', (route) => route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="600" height="450" fill="#f4e8c8"/><rect x="240" y="80" width="120" height="280" rx="25" fill="#a46b2e"/><text x="300" y="225" text-anchor="middle" fill="white" font-size="28">${new URL(route.request().url()).pathname}</text></svg>` }));
});

test('manual controls and swipe preserve the gallery and vertical scrolling', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/products/' + product.slug);
  const gallery = page.getByRole('region', { name: `Ảnh sản phẩm ${product.name}` });
  await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[0]);
  await gallery.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
  await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[1]);
  await gallery.getByRole('button', { name: 'Xem ảnh 1' }).click();
  const image = page.getByTestId('gallery-swipe');
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = (await image.boundingBox())!;
  const x = box.x + box.width * 0.7;
  const y = Math.min(box.y + box.height * 0.3, page.viewportSize()!.height * 0.5);
  if (isMobile) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 90, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[1]);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y + 50 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 80 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[1]);
    await page.evaluate(() => window.scrollTo(0, 0));
  } else {
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x - 90, y, { steps: 8 }); await page.mouse.up();
    await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[1]);
    await gallery.getByRole('button', { name: 'Ảnh trước', exact: true }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[0]);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('gallery-controls.png'), fullPage: true });
});

test('autoplay waits five seconds and pauses after manual navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/products/' + product.slug);
  await page.mouse.move(0, 0);
  const gallery = page.getByRole('region', { name: `Ảnh sản phẩm ${product.name}` });
  await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[0]);
  await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[1], { timeout: 7000 });
  await gallery.getByRole('button', { name: 'Ảnh tiếp theo' }).click();
  await expect(gallery.getByRole('img')).toHaveAttribute('src', urls[2]);
  await expect(gallery.getByRole('button', { name: 'Phát tự động' })).toBeVisible();
});
