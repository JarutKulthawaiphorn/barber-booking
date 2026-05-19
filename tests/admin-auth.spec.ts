import { test, expect } from '@playwright/test';

const USERNAME = process.env.TEST_ADMIN_USERNAME;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD;

test.describe('Authenticated admin', () => {
  test.skip(
    !USERNAME || !PASSWORD,
    'Set TEST_ADMIN_USERNAME and TEST_ADMIN_PASSWORD to run authenticated admin tests',
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('ชื่อผู้ใช้').fill(USERNAME!);
    await page.getByLabel('รหัสผ่าน').fill(PASSWORD!);
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    await expect(page).toHaveURL(/\/admin\/bookings/);
  });

  test('login redirects to bookings dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /วันนี้|ตารางคิว/ })).toBeVisible();
    await expect(page.getByText(USERNAME!)).toBeVisible();
  });

  test('schedule table or empty state renders', async ({ page }) => {
    const hasRows = page.locator('ul li').first();
    const emptyState = page.getByText('ไม่มีการจองในวันนี้');
    await expect(hasRows.or(emptyState).first()).toBeVisible();
  });

  test('add-booking form is present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'เพิ่มการจอง' })).toBeVisible();
  });

  test('settings tab navigates to /admin', async ({ page }) => {
    await page.getByRole('link', { name: 'ตั้งค่าร้าน' }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);

    // Confirm session is gone — protected route should bounce.
    await page.goto('/admin/bookings');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
