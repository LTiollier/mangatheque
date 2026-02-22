import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
  test('successful registration redirects to home/dashboard', async ({ page }) => {
    // Mock de la réponse de création de compte
    await page.route('**/api/auth/register', async route => {
      const json = {
        user: { id: 2, name: 'Vegeta', email: 'prince@saiyan.com' },
        token: 'fake-jwt-token-456'
      };
      await route.fulfill({ status: 201, json });
    });

    await page.goto('/register');

    // Remplissage du formulaire
    await page.locator('input[name="name"]').fill('Vegeta');
    await page.locator('input[type="email"]').fill('prince@saiyan.com');

    const passInputs = page.locator('input[type="password"]');
    await passInputs.nth(0).fill('finalflash123');
    await passInputs.nth(1).fill('finalflash123');

    // Soumission
    await page.locator('button[type="submit"]').click();

    // L'UX de notre app redirige vers / après un signup (cf. register/page.tsx)
    await page.waitForURL('**/');
    // On s'assure qu'on n'est plus sur la page register
    expect(page.url()).not.toContain('/register');
  });

  test('prevents submission with mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.locator('input[name="name"]').fill('Vegeta');
    await page.locator('input[type="email"]').fill('prince@saiyan.com');

    const passInputs = page.locator('input[type="password"]');
    await passInputs.nth(0).fill('password123');
    await passInputs.nth(1).fill('password456'); // Ne correspond pas

    await page.locator('button[type="submit"]').click();

    // Validation Zod : "Les mots de passe ne correspondent pas."
    await expect(page.locator('text=Les mots de passe ne correspondent pas.')).toBeVisible();
  });
});
