## Grant Playwright permission to use Geolocation

```ts{4-5}:playwright.config.ts
const config: PlaywrightTestConfig = {
	testDir: './tests',
	use: {
		permissions: ['geolocation'],
		geolocation: { latitude: 50.8551729, longitude: 4.340312 },
	},
};
```

## Overwrite the location in a test suite

```ts{3-9, 12-18, 21-22}:tests/coords.test.ts
import { test, expect } from '@playwright/test';

// set the location for all tests within the describe block
test.use({
	geolocation: {
		latitude: 51.2601293,
		longitude: 4.0707061,
	},
});

test.describe("User's location", () => {
	// set the location for all tests within the describe block
	test.use({
		geolocation: {
			latitude: 50.8841204,
			longitude: 4.635328,
		},
	});

	test("the user's location is shown", async ({ page, context }) => {
		// set the location for this specific test
		context.setGeolocation({ latitude: 50.9245541, longitude: 5.2435062 });

		await page.goto('http://localhost:4200');

		await expect(page.locator('p')).toHaveText(
			`Your current position is: 50.9245541, 5.2435062`
		);
	});
});
```
