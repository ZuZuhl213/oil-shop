import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

// Run against a running frontend. --poster also refreshes the shipped fallback.
const origin = process.env.BOTTLE_PREVIEW_ORIGIN ?? 'http://127.0.0.1:3000';
const output = 'test-results/bottle-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, reducedMotion: 'reduce' });
  await page.goto(new URL('/preview/bottle', origin).href);
  await page.addStyleTag({ content: 'nextjs-portal { display: none; }' });
  await page.getByRole('button', { name: 'Đặt lại góc nhìn' }).waitFor();
  await page.waitForSelector('[data-ready="true"]', { timeout: 60_000 });
  const canvas = page.locator('canvas');
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  const front = await canvas.screenshot({ path: `${output}/front.png` });
  if (process.argv.includes('--poster')) {
    await mkdir('public/images', { recursive: true });
    await sharp(front).resize({ height: 900 }).webp({ quality: 92 }).toFile('public/images/bottle-preview.webp');
  }
  await page.getByRole('button', { name: 'Xoay phải' }).click();
  await canvas.screenshot({ path: `${output}/quarter.png` });
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Nhìn từ trên' }).click();
  await canvas.screenshot({ path: `${output}/top.png` });
  await page.getByRole('button', { name: 'Đặt lại góc nhìn' }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Nhìn từ dưới' }).click();
  await canvas.screenshot({ path: `${output}/base.png` });
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.getByRole('button', { name: 'Đặt lại góc nhìn' }).click();
  await page.screenshot({ path: `${output}/tablet.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Đặt lại góc nhìn' }).click();
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  console.log(`Screenshots: ${output}${process.argv.includes('--poster') ? '; fallback refreshed' : ''}`);
} finally {
  await browser.close();
}
