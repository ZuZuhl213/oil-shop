import { test, expect } from '@playwright/test';

test.describe('Real admin session through proxy', () => {
  test.skip(process.env.PLAN10_REAL_BACKEND !== '1', 'Run npm run test:admin:e2e for disposable Spring/PostgreSQL');
  test('rejects bad credentials, uses HttpOnly cookie, survives reload and logs out', async ({ page, context }) => {
    await page.goto('/admin/login?next=//evil.test');
    await page.getByLabel('Email quản trị').fill(process.env.PLAN10_ADMIN_EMAIL!);
    await page.getByLabel('Mật khẩu').fill('wrong-password');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Email hoặc mật khẩu' })).toBeVisible();
    await page.getByLabel('Mật khẩu').fill(process.env.PLAN10_ADMIN_PASSWORD!);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    const cookie = (await context.cookies()).find((entry) => entry.name === 'JSESSIONID');
    expect(cookie).toMatchObject({ httpOnly: true, path: '/api' });
    expect(await page.evaluate(() => document.cookie)).not.toContain('JSESSIONID');
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sản phẩm', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    expect((await context.cookies()).find((entry) => entry.name === 'JSESSIONID')?.value).not.toBe(cookie?.value);
    expect((await page.request.get('/api/v1/admin/auth/me')).status()).toBe(401);
  });
});
