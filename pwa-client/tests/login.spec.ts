import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('page has title and form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Mangathèque/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();

    // Attend que les messages d'erreur Zod s'affichent
    await expect(page.locator('text=Veuillez entrer une adresse email valide.').first()).toBeVisible();
    await expect(page.locator('text=Le mot de passe est requis.').first()).toBeVisible();
  });

  test('successful login redirects to requested path or dashboard', async ({ page }) => {
    // Mock de la réponse de l'API pour isoler les tests UI du backend
    await page.route('**/api/auth/login', async route => {
      const json = {
        user: { id: 1, name: 'San Goku', email: 'goku@capsule.com' },
        token: 'fake-jwt-token-123'
      };
      await route.fulfill({ status: 200, json });
    });

    await page.goto('/login');

    // Remplissage du formulaire
    await page.locator('input[type="email"]').fill('goku@capsule.com');
    await page.locator('input[type="password"]').fill('kamehameha123');

    // Soumission
    await page.locator('button[type="submit"]').click();

    // Vérification de la redirection vers le dashboard (ou la racine le cas échéant)
    await page.waitForURL('**/');
    await expect(page).toHaveURL(/.*\//);
  });
});
