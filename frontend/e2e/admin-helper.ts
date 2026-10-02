import { expect, type Page } from '@playwright/test';
export async function signIn(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email quản trị').fill(process.env.PLAN10_ADMIN_EMAIL!);
  await page.getByLabel('Mật khẩu').fill(process.env.PLAN10_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
}
