import { expect, test } from '@playwright/test';
import sharp from 'sharp';

// A revolution can change 8-bit rounding; scrolling at mobile DPR 2.75 can
// move the screenshot crop by one physical pixel. Permit that registration
// error while still failing for an actually changed view or a blank canvas.
async function sameImage(a: Buffer, b: Buffer) {
  const [left, right] = await Promise.all([a, b].map(buffer => sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  const { width, height, channels } = left.info;
  if (width !== right.info.width || height !== right.info.height) return false;
  // Exclude the CSS rounded frame: its clipping mask stays at the screenshot
  // edge even when the interior canvas crop rounds to an adjacent device pixel.
  const margin = Math.ceil(width * .08);
  const allowed = (width - 2 * margin) * (height - 2 * margin) * channels * .0005;
  for (const dy of [0, -1, 1]) for (const dx of [0, -1, 1]) {
    let changed = 0;
    for (let y = margin; y < height - margin && changed <= allowed; y++) {
      for (let x = margin; x < width - margin; x++) for (let c = 0; c < channels; c++) {
        const first = left.data[(y * width + x) * channels + c];
        const second = right.data[((y + dy) * width + x + dx) * channels + c];
        if (Math.abs(first - second) > 4) changed++;
      }
    }
    if (changed <= allowed) return true;
  }
  return false;
}

test('preview renders independently and supports rotation, bounded zoom and reset', async ({ page, isMobile }, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/api/v1/')) apiRequests.push(request.url()); });
  await page.goto('/preview/bottle');
  // Development tooling floats above the canvas as the page scrolls. Production
  // has no portal; excluding it keeps this a comparison of the actual model.
  await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
  const reset = page.getByRole('button', { name: 'Đặt lại góc nhìn' });
  await expect(reset).toBeEnabled({ timeout: 45_000 });
  const canvas = page.locator('canvas');
  const initial = await canvas.screenshot({ path: testInfo.outputPath('initial.png') });
  await page.screenshot({ path: testInfo.outputPath('preview.png'), fullPage: true });
  await page.getByRole('button', { name: 'Xoay phải' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(false);
  await canvas.screenshot({ path: testInfo.outputPath('rotated.png') });
  // Eight 45-degree steps return to the same orientation after a full revolution.
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Xoay phải' }).click();
  await canvas.screenshot({ path: testInfo.outputPath('full-turn.png') });
  await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(true);
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(false);
  for (let i = 0; i < 12; i++) await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  const nearest = await canvas.screenshot();
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click();
  expect(await sameImage(await canvas.screenshot(), nearest)).toBe(true);
  for (let i = 0; i < 16; i++) await page.getByRole('button', { name: 'Thu nhỏ', exact: true }).click();
  const farthest = await canvas.screenshot();
  expect(await sameImage(farthest, nearest)).toBe(false);
  await page.getByRole('button', { name: 'Thu nhỏ', exact: true }).click();
  expect(await sameImage(await canvas.screenshot(), farthest)).toBe(true);
  await reset.click();
  await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(true);

  const bounds = (await canvas.boundingBox())!;
  const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  if (isMobile) {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + 65, y: start.y - 50 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(false);
    await reset.click();
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start.x - 25, y: start.y }, { x: start.x + 25, y: start.y }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x - 65, y: start.y }, { x: start.x + 65, y: start.y }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else {
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 90, start.y - 150, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(false);
  await canvas.screenshot({ path: testInfo.outputPath('gesture.png') });
  await reset.click();
  await expect.poll(async () => sameImage(await canvas.screenshot(), initial)).toBe(true);
  expect(errors).toEqual([]);
  expect(apiRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('unsupported WebGL displays the rendered still and a retry action', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, ...args: unknown[]) {
        if (String(args[0]).startsWith('webgl')) return null;
        return Reflect.apply(original, this, args);
      },
    });
  });
  await page.goto('/preview/bottle');
  await expect(page.getByText(/Không thể hiển thị 3D/)).toBeVisible();
  const poster = page.locator('img[src="/images/bottle-preview.webp"]');
  await expect(poster).toBeVisible();
  expect(await poster.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Tải lại trang' })).toBeEnabled();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('a failed model chunk keeps the static fallback available', async ({ page }) => {
  let blockedModel = false;
  await page.route('**/_next/static/chunks/**', async route => {
    if (route.request().resourceType() !== 'script') return route.continue();
    const response = await route.fetch();
    if ((await response.text()).includes('golden-oil')) {
      blockedModel = true;
      return route.abort('failed');
    }
    return route.fulfill({ response });
  });
  await page.goto('/preview/bottle');
  await expect(page.getByText(/Không thể hiển thị 3D/)).toBeVisible({ timeout: 30_000 });
  expect(blockedModel).toBe(true);
  await expect(page.locator('img[src="/images/bottle-preview.webp"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tải lại trang' })).toBeEnabled();
});

test('a lost WebGL context falls back and retry creates a working viewer', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/preview/bottle');
  await expect(page.getByRole('button', { name: 'Đặt lại góc nhìn' })).toBeEnabled({ timeout: 45_000 });
  await page.locator('canvas').evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl2');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss extension unavailable');
    extension.loseContext();
  });
  await expect(page.getByText(/Không thể hiển thị 3D/)).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Thử lại 3D' }).click();
  await expect(page.getByRole('button', { name: 'Đặt lại góc nhìn' })).toBeEnabled({ timeout: 45_000 });
  await expect(page.locator('canvas')).toHaveCount(1);
});
