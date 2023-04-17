---
title: The different retry APIs from Playwright
slug: the-different-retry-apis-from-playwright
description: You probably already know the built-in retry mechanism for locators and matchers, but are you already familiar with the retry and polling APIs? Let's take a look at the different retry APIs that Playwright has to offer, and when to use them.
date: 2023-04-17
tags: Testing, Playwright
---

Wait what? Isn't there a built-in Playwright retry mechanism?
Yes, you're totally right, there are a couple retry functions that automatically retry a condition, but there's also an explicit retry API that can be used in special cases. In this post, let's take a look at the different retry APIs that Playwright has to offer.

## Retry Test Cases

The first retry ability that Playwright has is the global retry ability for test cases.
This means that when a test fails, Playwright automatically retries the test up to the configured times before failing the test.

To set the global retry ability, we can use the `retries` option in the Playwright config file.

```ts{3}:playwright.config.ts
export default defineConfig({
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
});
```

This can be overridden by setting using the `retries` flag.

```bash
npx playwright test --retries=1
```

If needed, this can also be configured per test block:

```ts{2}:example.test.ts
test.describe('Playwright Test', () => {
    test.describe.configure({ retries: 5 });
    test('should work', async ({ page }) => {});
});
```

This is great, because sometimes you want to exclude problems with the infrastructure or backend, and this way we can retry the test and hope that the issues are resolved and the test passes.

You can also detect when a test is retried by using the `testInfo` object that is passed to the test block.

```ts{2-4}:example.test.ts
  test('retrieve test retry info', async ({ page }, testInfo) => {
    if(testInfo.retry > 0){
      console.log(`Test is retried ${testInfo.retry} times`);
    }
  })
```

## Retry Locators and Matchers

As already mentioned, Playwright has a built-in auto-waiting and retry-ability mechanism.
This is used within locators to find elements (e.g. `page.getByRole()`), or when matcher are run (e.g. `toBeVisible()`) to check an expectation.
For these cases, Playwright runs that logic over and over again until the condition is met or until the timeout limit is reached.

This is useful because it helps to reduce or remove the flakiness of a condition.
For example, you don't need to manually specify a wait time before running some code e.g. wait for a second until you think that a request should have responded.

To know the specific timeout limit, see the Playwright [timeout documentation](https://playwright.dev/docs/test-timeouts)

## Wait for Conditions

But, what if we want to wait until a condition is met that is not related to the UI?
For example, we want to verify that an asynchronous process has been completed, or that a value is written to the browser's storage.

This can be solved by using Playwright's [Retrying](https://playwright.dev/docs/test-assertions#retrying) and [Polling](https://playwright.dev/docs/test-assertions#polling) APIs, where we explicitly specify a condition that is awaited until it is met.

If you're familiar with the Testing Library API, you can compare these Playwright functions to the Testing Library `waitFor` method.

The `Retry` API uses a normal `expect` method and uses the `toPass(options)` method to retry the assertion within the `expect` block.
If the assertion fails, the `expect` block is retried until the timeout limit is reached, or until it finally passes.
In the example below the test waits until a value is written to local storage.

```ts:example.test.ts
test('runs toPass() until the condition is met or the timeout is reached',
	async ({ page }) => {
		await expect(async () => {
			const localStorage = await page.evaluate(() =>
				JSON.stringify(window.localStorage.getItem('user')),
			);

			expect(localStorage).toContain('Tim Deschryver');
		}).toPass();
	});
```

The `Poll` API is similar to the `Retry` API, but instead of using a normal `expect` block it uses the `expect.poll` method.
`expect.poll` also returns a result, which is used to invoke the matcher.
In the example below the test waits until the process state is completed.

```ts:example.test.ts
test('runs expect.poll() until the condition is met or the timeout is reached',
	async ({ page }) => {
		await expect
			.poll(async () => {
				const response = await page.request.get('https://my.api.com/process-state');
				const json = await response.json();
				return json.state;
			})
			.toBe('completed');
	});
```

Both APIs can also be configured with a custom timeout and interval durations.

```ts{6-10, 19-23}:example.test.ts
test('runs toPass() until the condition is met or the timeout is reached',
	async ({ page }) => {
		await expect(async () => {
			// ...
		})
		.toPass({
			// Wait x milliseconds between retries
			intervals: [1000, 1500, 2500],
			timeout: 5000
		});
	});

test('runs expect.poll() until the condition is met or the timeout is reached',
	async ({ page }) => {
		await expect
			.poll(async () => {
				// ...
			},
			{
				// Wait x milliseconds between retries
				intervals: [1000, 1500, 2500],
				timeout: 5000
			})
			.toBe('completed');
	});
```

## Conclusion

Playwright has options to make your tests more resilient and less flaky.
The built-in retry mechanism for locators and matchers is useful and covers most of your daily cases.

But, sometimes an assertion needs to wait for an external condition. In these cases, you can use the explicit retry and polling APIs to wait until the condition is met.

You can also use the global retry mechanism for test cases, to remove the inconsistencies that are caused by the conditions that you can't control.
