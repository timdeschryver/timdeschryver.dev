---
title: Testing localization with Playwright
slug: testing-localization-with-playwright
description: Testing your translation logic and localization with Playwright
date: 2022-10-24
tags: Playwright, testing
---

If your application uses some kind of localization, it might be good to create a test for it that acts as a smoke test.
These tests can cover the translation logic, and how certain fields are formatted, for example, dates, currency, decimals, and so on.

There might already be a unit test that covers this behavior, but thanks to Playwright it's just a tiny effort to write a simple end-to-end test.
In my opinion, testing all the translations is an overkill and a time waster (this might not be true for your use case), but testing the basics provides a lot of value.
With it, we become confident that our localization strategy works.

## The Default Behavior

By default, Playwright uses the locale and time zone of the host machine.
This is not always desirable.
When your locale and/or time zone is different from the one that is used on the server, or when your team is working in different time zones, this can be the cause of some conflicts.

To resolve this issue, we can set the default locale and time zone that is used by Playwright across your test suite(s).
You can do this by setting the `locale` and `timezoneId` options in the shared settings (`use`) within the playwright config.

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

With the current setup, the locale that is used in the tests is `nl-BE`, and the time zone that's used is `Europe/Brussels`.

## Overriding the Default Behavior

This is already a good start, but we can do even better.

As mentioned earlier, we want to test the localization of the application.
But with the current setup, we've set the locale to a fixed value and are thus we're only testing for one language.

Luckily, Playwright provides an easy way to set the locale per test block.
To do this, override the `locale` and `timezoneId` options with the `use` method.

When you do this, all other tests within the same test block use the same locale and time zone.

```ts
import { test } from '@playwright/test';

test.use({
	locale: 'en-GB',
	timezoneId: 'Europe/London',
});
```

## Example

When we put this all together, we can write a simple test that verifies if:

- the logic to implement the translation works
- the dates, decimals, and whatnot are formatted as expected

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
