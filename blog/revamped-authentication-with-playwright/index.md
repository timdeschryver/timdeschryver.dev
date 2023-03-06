---
title: 'Revamped: Authentication with Playwright'
slug: revamped-authentication-with-playwright
description: Playwright (v1.31) introduces a new feature to make the authentication process easier. This approach unifies the authentication flow with the rest of the test cases, and more importantly makes it possible to test  with different user roles.
date: 2023-03-06
tags: Playwright, testing
---

As of [Playwright version 1.31](https://playwright.dev/docs/release-notes#version-131), there is a new feature that makes it much easier to authenticate users for your tests. In this post, we revamp a previous blog post, [Fast and Easy Authentication with Playwright](/blog/fast-and-easy-authentication-with-playwright/index.md), and discuss how this resolves a few issues that I had with it.

The old approach used the global setup feature to authenticate a test user and reuse its authentication state throughout your test suite.
Although it worked, it's not the most elegant solution because it has two major drawbacks:

- the authentication state is reused for every test case, making it harder to test different user roles
- we have to manually instantiate a new browser page using the Playwright API

The main benefit that we gain after migrating to the new API is that we're able to sign in with multiple users (and roles).
Even if that's not a requirement for your project, you still have the possibility for it in the future.
Additionally, the updated version creates a cleaner codebase, aligned with the rest of the test suite.

To refactor our previous solution we need to update the configuration and the setup file.

## Configuration Update

Let's modify the configuration file first to use the new API.
The configuration changes are as follows:

We create a new project in `projects` called `setup`, and we move the `globalSetup` property to the `projects` config.
Within the created `setup` project add the `testMatch` property to define which file to be execute when it's run.

Next, we add the `storageState` path to each project that needs to be authenticated.
The value of this property (`e2e/.auth/storageState.json`) is that same as the previous global `storageState` property, which means that we can also remove the `use.storageState` property.
Because the Playwright team encourages to store this file in the `.auth` directory (to make it easy to git ignore), we'll also make this change to our setup.
This value defines the file that includes the stored authentication state for the user, the setup project will write its state to this file (which we'll see in a minute).

Lastly, we need to add a dependency to the `setup` project in each Playwright project.

```diff:playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'e2e',
-   globalSetup: 'e2e/global-setup',
    outputDir: 'playwright-report',
    reporter: 'html',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    webServer: {
        command: 'npm run start',
        port: 4200,
        reuseExistingServer: !process.env.CI,
    },
    use: {
        baseURL: 'https://localhost:4200/',
-       storageState: 'e2e/.auth/storageState.json',
        trace: 'on-first-retry',
        ignoreHTTPSErrors: true,
        locale: 'nl-BE',
        timezoneId: 'Europe/Brussels',
    },
    projects: [
+       {
+           name: 'setup',
+           testMatch: 'e2e/auth-setup.ts',
+       },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
+               storageState: 'e2e/.auth/storageState.json'
            },
+           dependencies: ['setup'],
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
+               storageState: 'e2e/.auth/storageState.json'
            },
+           dependencies: ['setup'],
        },
    ],
};
export default config;
```

## Refactored Setup File

With the configuration in place, we can now update the setup file.
And the changes are minimal;
Instead of writing a Playwright script, we refactor the code into a Playwright test.
It's essential to name the test file the same as used in the `testMatch` property within the configuration file. In this case, it's `e2e/auth-setup.ts`.

The most important part of this test is the last line, `page.context().storageState()`, which writes the authentication state to the `storageState.json` file, including our users' information

```ts{}:e2e/auth-setup.ts
import { test } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// we don't want to store credentials in the repository
dotenv.config({
    path: './e2e/.env.local',
});

const storageState = 'e2e/.auth/storageState.json';

test('authenticate user', async ({ page, context, contextOptions, playwright }) => {
    if (process.env.username === '**REMOVED**') {
        throw new Error('Env file is not correct');
    }

    const stats = fs.existsSync(storageState!.toString()) ? fs.statSync(storageState!.toString()) : null;
    if (stats && stats.mtimeMs > new Date().getTime() - 600000) {
        console.log(`\x1b[2m\tSign in skipped because token is fresh\x1b[0m`);
        return;
    }

    console.log(`\x1b[2m\tSign in started'\x1b[0m`);

    // when we're not authenticated, the app redirects to the login page
    await page.goto('');

    console.log(`\x1b[2m\tSign in as '${process.env.username}'\x1b[0m`);

    await page.getByRole('textbox', { name: /username/i }).fill(process.env.username as string);
    await page.getByLabel('Password').fill(process.env.password as string);

    console.log(`\x1b[2m\tSign in processing\x1b[0m`);

    await page.getByRole('button', { name: /submit/i }).click();

    console.log(`\x1b[2m\tSign in processed\x1b[0m`);

    await page.context().storageState({ path: storageState });
});
```

## Conclusion

When we compare the new structure to the previous solution, we can see that we're not required to have knowledge about the low-level Playwright API.
The setup becomes a lot cleaner and easier to read because the authentication flow is now part of a test case.
For example, instead of manually creating (and closing) a new browser page, we can use the `page` object that's provided by the Playwright test runner.

We're also able to sign in with multiple users (and roles), which is a nice bonus.
While this is not covered in this post, I can point you to the Playwright documentation.
With this new feature, the documentation also gained a new corresponding [guide on authentication](https://playwright.dev/docs/auth) that includes great examples.
