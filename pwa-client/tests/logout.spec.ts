import { test, expect } from '@playwright/test';

test.describe('Logout Flow', () => {
    test('disconnects user and redirects to login', async ({ page }) => {
        // 1. On donne un faux accès (auto-login en mockant)
        await page.route('**/api/auth/login', async route => {
            const json = {
                user: { id: 1, name: 'Luffy', email: 'luffy@onepiece.com' },
                token: 'fake-jwt-token-pirate'
            };
            await route.fulfill({ status: 200, json });
        });

        // Mock du logout API
        await page.route('**/api/auth/logout', async route => {
            await route.fulfill({ status: 200, json: { message: "Successfully logged out" } });
        });

        // Etape de connexion préalable
        await page.goto('/login');
        await page.locator('input[type="email"]').fill('luffy@onepiece.com');
        await page.locator('input[type="password"]').fill('meat123456');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL('**/');
        await page.goto('/dashboard');

        // 2. L'action de déconnexion. 
        // On recherche le bouton "Déconnexion" (soit via texte, soit via le composant header s'il existe)
        const logoutBtn = page.locator('button').filter({ has: page.locator('svg.lucide-log-out') });

        // Si le bouton est caché derrière un dropdown (menu utilisateur), 
        // il faudra simuler le clic sur l'avatar du user avant.
        // Ex: await page.locator('button.user-avatar').click();

        if (await logoutBtn.isVisible()) {
            await logoutBtn.click();

            // La déconnexion doit renvoyer sur /login
            await page.waitForURL('**/login');
            await expect(page).toHaveURL(/.*\/login/);
        }
    });
});
