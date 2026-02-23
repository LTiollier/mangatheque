import { test, expect } from '@playwright/test';

test.describe('Collection navigation and multiple volume addition', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication state via localStorage
        await page.goto('/login');
        await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test-token');
        });

        // Mock the user endpoint
        await page.route('/api/user', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    data: {
                        id: 1,
                        name: 'Test User',
                        email: 'test@example.com'
                    }
                }
            });
        });
    });

    test('should navigate from Collection -> Series -> Edition and add multiple missing volumes', async ({ page }) => {
        // Mock the initial collection fetch with 1 manga that has a series and an edition
        await page.route('/api/mangas', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    data: [
                        {
                            id: 101,
                            api_id: "api_v1",
                            number: "1",
                            title: "Naruto Vol. 1",
                            authors: ["Masashi Kishimoto"],
                            cover_url: null,
                            series: {
                                id: 50,
                                title: "Naruto",
                                authors: ["Masashi Kishimoto"],
                                total_volumes: 72,
                                cover_url: null,
                                status: "Finished"
                            },
                            edition: {
                                id: 20,
                                name: "Standard",
                                publisher: "Kana",
                                language: "fr",
                                total_volumes: 72
                            }
                        }
                    ]
                }
            });
        });

        // Go to collection page
        await page.goto('/collection');

        // Ensure the series shows up
        await expect(page.locator('text=Naruto')).toBeVisible();
        await expect(page.locator('text=1 Tome')).toBeVisible();

        // Click on the series
        await page.click('text=Naruto');
        await page.waitForURL('/collection/series/50');

        // Ensure edition is visible
        await expect(page.locator('text=Standard')).toBeVisible();
        await expect(page.locator('text=Kana')).toBeVisible();
        await expect(page.locator('text=1 tomes possédés')).toBeVisible();

        // Click on the edition
        await page.click('text=Voir les tomes');
        await page.waitForURL('/collection/series/50/edition/20');

        // Ensure we see Volume 1 and placeholders up to 72
        await expect(page.locator('text=Tome 1')).toBeVisible();
        await expect(page.locator('text=1 / 72 tomes possédés')).toBeVisible();

        // Intercept bulk add API
        let bulkAddData = null;
        await page.route('/api/mangas/bulk', async (route) => {
            bulkAddData = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                json: {
                    data: [] // mock returning created volumes
                }
            });
        });

        // Click button to 'Sélectionner tous les manquants'
        await page.click('text=Sélectionner tous les manquants');

        // Verify selection text shows 71 items selected
        await expect(page.locator('text=71 tome(s) sélectionné(s)')).toBeVisible();

        // Click "Ajouter les tomes"
        await page.click('text=Ajouter les tomes');

        // Verify the API call was made correctly
        expect(bulkAddData).not.toBeNull();
        if (bulkAddData) {
            const data = bulkAddData as { edition_id: number; numbers: number[] };
            expect(data.edition_id).toBe(20);
            expect(data.numbers.length).toBe(71);
            expect(data.numbers).not.toContain(1); // Volume 1 was already possessed
            expect(data.numbers).toContain(2);
            expect(data.numbers).toContain(72);
        }
    });
});
