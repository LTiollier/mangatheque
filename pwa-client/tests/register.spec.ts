import { test, expect } from '@playwright/test';

test('register page has title and register form', async ({ page }) => {
  await page.goto('/register');

  await expect(page).toHaveTitle(/Mangathèque/);

  await expect(page.locator('form')).toBeVisible();
  
  await expect(page.locator('input[type="text"]').first()).toBeVisible(); // Name
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(2); // Password and confirm password
  
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});
