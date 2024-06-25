---
title: Playwright v1.45 makes you a Time Wizard
slug: playwright-v145-makes-you-a-time-wizard
date: 2024-06-25
tags: Playwright, testing
---

# Playwright v1.45 makes you a Time Wizard

The latest release of Playwright, version 1.45, introduces a new feature called `Clock`. This feature allows you to manipulate the time in your tests, making it easier to test time-sensitive scenarios.

```ts
import { test, expect } from '@playwright/test';

test('🧙‍♂️ Time wizard plays with time 🪄', async ({ page }) => {
	// Initialize clock and let the page load naturally.
	await page.clock.install({ time: new Date('2024-06-25, 08:00') });
	await page.goto('http://localhost:4200');

	await expect(page.getByTestId('current-time')).toHaveText('25/06/2024, 08:00');

	// Set a fixed time (Date.now and new Date() return fixed fake time at all times)
	await page.clock.setSystemTime('2024-06-25T09:45:00');
	await expect(page.getByTestId('current-time')).toHaveText('25/06/2024, 09:45');

	// Pretend that the user closed the laptop lid and opened it again at 10am,
	// Pause the time once reached that point.
	await page.clock.pauseAt(new Date('2024-06-25T10:00:00'));
	await expect(page.getByTestId('current-time')).toHaveText('25/06/2024, 10:00');

	// Close the laptop lid again and open it at 10:30am.
	await page.clock.fastForward('30:00');
	await expect(page.getByTestId('current-time')).toHaveText('25/06/2024, 10:30');

	// Resume the time to normal flow
	await page.clock.resume();

	// Fake Date value while keeping the timers going
	await page.clock.setFixedTime('2024-06-25T16:00:00');
	await expect(page.getByTestId('current-time')).toHaveText('25/06/2024, 16:00');
});
```

## Additional Resources

- [`Clock` Documentation](https://playwright.dev/docs/clock)
- [v1.45.0 Release Notes](https://github.com/microsoft/playwright/releases/tag/v1.45.0)
