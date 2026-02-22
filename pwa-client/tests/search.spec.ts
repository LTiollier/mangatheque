import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Mock session to stay authenticated
        await page.addInitScript(() => {
            window.localStorage.setItem('auth_token', 'fake-token');
            window.localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test User', email: 'test@example.com' }));
        });
    });

    test('search page is accessible and has search bar', async ({ page }) => {
        await page.goto('/search');
        await expect(page).toHaveTitle(/Mangathèque/);
        await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    });

    test('can search and display results', async ({ page }) => {
        // Mock search API
        await page.route('**/api/mangas/search?query=Naruto', async route => {
            const json = {
                data: [
                    {
                        api_id: '1',
                        title: 'Naruto Vol. 1',
                        authors: ['Masashi Kishimoto'],
                        description: 'A young ninja...',
                        published_date: '2000-01-01',
                        page_count: 200,
                        cover_url: 'https://example.com/cover1.jpg',
                        isbn: '1234567890'
                    }
                ]
            };
            await route.fulfill({ status: 200, json });
        });

        await page.goto('/search');

        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('Naruto');
        await page.locator('button:text-is("Search")').click();

        // Check if results are displayed
        await expect(page.locator('text=Naruto Vol. 1')).toBeVisible();
        await expect(page.locator('text=Masashi Kishimoto')).toBeVisible();
        await expect(page.locator('button:has-text("Add to collection")')).toBeVisible();
    });

    test('displays "No mangas found" when API returns empty array', async ({ page }) => {
        await page.route('**/api/mangas/search?query=NonExistentManga', async route => {
            await route.fulfill({ status: 200, json: { data: [] } });
        });

        await page.goto('/search');
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.fill('NonExistentManga');
        await page.locator('button:text-is("Search")').click();

        await expect(page.locator('text=No mangas found')).toBeVisible();
        await expect(page.locator('text=Try searching for something else')).toBeVisible();
    });

    test('navigate to search from dashboard', async ({ page }) => {
        await page.goto('/dashboard');

        // Navigation should be visible (Shell)
        const searchLink = page.locator('nav a:has-text("Recherche")');
        await expect(searchLink).toBeVisible();

        await searchLink.click();
        await expect(page).toHaveURL(/\/search$/);
    });
});
