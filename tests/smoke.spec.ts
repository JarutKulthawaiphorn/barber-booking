import { test, expect } from '@playwright/test';

test.describe('Public routes', () => {
  test('home page renders brand and CTAs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Barber Booking', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Barber Booking');
    await expect(page.getByRole('link', { name: 'จองคิว' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'ค้นหาการจองของคุณ' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'พนักงาน' })).toBeVisible();
  });

  test('home → booking page navigates and shows form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'จองคิว' }).click();

    await expect(page).toHaveURL(/\/book$/);
    await expect(page.getByRole('heading', { name: 'จองคิว' })).toBeVisible();
  });

  test('lookup page rejects empty phone (HTML required)', async ({ page }) => {
    await page.goto('/lookup');

    await expect(page.getByRole('heading', { name: 'การจองของคุณ' })).toBeVisible();
    await expect(page.getByLabel('เบอร์โทร')).toBeVisible();

    const submit = page.getByRole('button', { name: 'ค้นหา' });
    await submit.click();

    // Browser-level required validation keeps us on /lookup with no ?phone= param.
    await expect(page).toHaveURL(/\/lookup\/?$/);
    const invalid = await page.getByLabel('เบอร์โทร').evaluate(
      (el: HTMLInputElement) => !el.validity.valid,
    );
    expect(invalid).toBe(true);
  });

  test('lookup submits a valid phone without crashing', async ({ page }) => {
    await page.goto('/lookup');
    // Unlikely-to-exist Thai mobile number — pattern still valid.
    await page.getByLabel('เบอร์โทร').fill('0999999999');
    await page.getByRole('button', { name: 'ค้นหา' }).click();

    await expect(page).toHaveURL(/\/lookup\?phone=/);
    // Page must render some results region: empty state OR a results section.
    const anyResult = page
      .getByText('ยังไม่มีการจอง')
      .or(page.getByText('ที่กำลังจะถึง'))
      .or(page.getByText('ผ่านไปแล้ว'));
    await expect(anyResult.first()).toBeVisible();
  });
});

test.describe('Admin login', () => {
  test('login page renders username + password fields', async ({ page }) => {
    await page.goto('/admin/login');

    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบพนักงาน' })).toBeVisible();
    await expect(page.getByLabel('ชื่อผู้ใช้')).toBeVisible();
    await expect(page.getByLabel('รหัสผ่าน')).toBeVisible();
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible();
  });

  test('invalid credentials show error banner', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('ชื่อผู้ใช้').fill('not-a-real-user');
    await page.getByLabel('รหัสผ่าน').fill('definitely-wrong');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('.banner-error')).toContainText(
      'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    );
  });

  test('admin bookings requires auth', async ({ page }) => {
    await page.goto('/admin/bookings');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('404', () => {
  test('unknown route renders not-found page', async ({ page }) => {
    const res = await page.goto('/this-route-does-not-exist');
    expect(res?.status()).toBe(404);
  });
});
