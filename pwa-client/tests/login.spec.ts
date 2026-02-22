import { test, expect } from '@playwright/test';

test('login page has title and login form', async ({ page }) => {
  await page.goto('/login');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Mangathèque/);

  // Expect the form to be visible
  await expect(page.locator('form')).toBeVisible();
  
  // Expect email and password inputs
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  
  // Expect submit button
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});
