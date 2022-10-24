## Set the `PlaywrightTestConfig`

```ts{18-19}:playwright.config.ts
import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './tests',
    timeout: 30 * 1000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        actionTimeout: 0,
        trace: 'on-first-retry',
        locale: 'nl-BE',
        timezoneId: 'Europe/Brussels',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
            },
        },
    ],
};

export default config
```

## Override where needed in tests

```ts
import { test, expect } from '@playwright/test';

test.describe('when locale is the default locale (Dutch)', () => {
	test('translates the title to the default language', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /Welkom Tim/i })).toBeVisible();
	});

	test('format the numbers in dutch locale', async ({ page }) => {
		await expect(page.getByTestId('date')).toContainText('GMT+0200');
		await expect(page.getByTestId('currency')).toHaveText('€ 16,31');
	});
});

test.describe('when locale is set to English', () => {
	test.use({
		locale: 'en-GB',
		timezoneId: 'Europe/London',
	});

	test('translates the title in English', async ({ page }) => {
		await expect(page.getByRole('heading', { name: /Welcome Tim/i })).toBeVisible();
	});

	test('format the numbers in GB locale', async ({ page }) => {
		await expect(page.getByTestId('date')).toContainText('GMT+0100');
		await expect(page.getByTestId('currency')).toHaveText('€16.31');
	});
});
```
