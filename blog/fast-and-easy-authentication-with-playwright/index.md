---
title: Fast and easy authentication with Playwright
slug: fast-and-easy-authentication-with-playwright
description: Using the global setup feature from Playwright to authenticate a test user and reuse its authentication state throughout your test suite.
author: Tim Deschryver
date: 2022-03-14
tags: Playwright, testing
---

I've [already said](/blog?q=playwright) that Playwright offers a smooth experience to write end-to-end tests. In this post, we're taking a look at how we can authenticate a test user and reuse its authentication state.

:::info
Hi there! 👋
If you're using Playwright v1.31+, you can take a look at a better implementation of this technique in my [Revamped: Authentication with Playwright](/blog/revamped-authentication-with-playwright/index.md) post.
:::

With Playwright, the authentication process can become a part of the test flow because a Playwright runs on different domains during a single test case. It doesn't feel abnormal because the authentication code looks the same as the rest of the test. Yet, including the authentication process within the test flow has a major drawback.

The caveat is that the test suite exponentially slows down when more test cases are added. For every test case that's added, you would need to authenticate the user over and over again.

Of course, Playwright provides a solution for this issue, otherwise, I wouldn't be so exciting about Playwright and I wouldn't be writing this blog post. With the [global setup and teardown](https://playwright.dev/docs/test-advanced#global-setup-and-teardown) functionality it's possible to set up your test environment and to tear it down afterward. We're particularly interested in the global setup, which we use to authenticate a test user and reuse the authentication state in every test case.
In other words, we only want to go through the authentication process once.

## Authenticate the user

To step through the authentication flow before the test suite is run, create a new file in which a default function is exported.
In the next step, we're going to configure Playwright to invoke this method, but let's first focus on the content of this method.

You can choose where to add and name this file but I like to have it close to my end-to-end tests, that's why I add mine directly in the end-to-end test directory.

The idea behind this setup file is that we can authenticate a user once, keep the authentication state aside (persist), and reuse (rehydrate) this state when the test cases are executed.

Inside of the setup method, we:

1. pluck the environment options from the config to make the authentication flow environment-specific;
2. instantiate a new browser page by using the Playwright API;
3. navigate to the login page;
4. fill in the user's credentials;
5. sign the user in;
6. persist the state at the storage state location (more about this in the next step);
7. close the browser;

I've also included some logs just to see where we're at during the process.

```ts:e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
    // (1) read the config
    const { baseURL, storageState, headless } = config.projects[0].use;

    // (2) instantiate
    const browser = await chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`\x1b[2m\tSign in started against '${baseURL}'\x1b[0m`);

    // (3) navigate to the login page
    await page.goto(baseURL);

    console.log(`\x1b[2m\tSign in as 'username'\x1b[0m`);

    // (4-5) fill in credentials and sign in
    await page.fill('input[name="Username"]', 'username');
    await page.fill('input[name="Password"]', 'password');
    await page.click('button >> text=Login');

    console.log(`\x1b[2m\tSign in processed\x1b[0m`);
    // (6) persist the authentication state (local storage and cookies)
    await page.context().storageState({ path: storageState as string });

    // (7) close the browser
    await browser.close();
}
```

To further enhance this basic setup, I also like to:

- introduce [dotenv](https://www.npmjs.com/package/dotenv) to configure the credentials and keep it out of git
- skip the authentication process when the token is "fresh" by adding a check to verify when the token is created, this makes it even faster to re-run tests locally as a part of the development process
- add some extra information to the persisted state, for example, the preferred language of the user

```ts{5-7,16-22,43-45}:e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({
    path: './e2e/.env',
});

export default async function globalSetup(config: FullConfig) {
    if (process.env.username === '**TODO**') {
        throw new Error('Env file is not correct');
    }

    const { baseURL, storageState, ignoreHTTPSErrors, headless } = config.projects[0].use;

    const stats = fs.existsSync(storageState!.toString())
        ? fs.statSync(storageState!.toString())
        : null;
    if (stats && stats.mtimeMs > new Date().getTime() - 600000) {
        console.log(`\x1b[2m\tSign in skipped because token is fresh\x1b[0m`);
        return;
    }

    const browser = await chromium.launch({ headless });
    const context = await browser.newContext({ ignoreHTTPSErrors });
    const page = await context.newPage();

    console.log(`\x1b[2m\tSign in started against '${baseURL}'\x1b[0m`);

    await page.goto(baseURL!);

    console.log(`\x1b[2m\tSign in as '${process.env.username}'\x1b[0m`);

    await page.fill('input[name="Username"]', process.env.username as string);
    await page.fill('input[name="Password"]', process.env.password as string);

    console.log(`\x1b[2m\tSign in processing\x1b[0m`);

    await page.click('button >> text=Login');

    console.log(`\x1b[2m\tSign in processed\x1b[0m`);

    await page.evaluate(() => {
        window.localStorage.setItem('__language', 'en');
    });

    await page.context().storageState({ path: storageState as string });
    await browser.close();
}
```

## Configure Playwright

To enable the global setup, add the `globalSetup` option to the Playwright configuration.
The value of this option is the file location of the global setup file that we've just created in the previous step.

To load the persisted state when the test cases are run, you also need to set the `storageState` option, which points to the persisted authentication state that's created in the previous step. This storage file includes a dump of the local storage and the cookies of the page. Don't forget to exclude the storage file from git by adding it to your `.gitignore` configuration.

```ts{5,17}:playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: 'e2e',
    globalSetup: 'e2e/global-setup',
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
        storageState: 'e2e/storageState.json',
        trace: 'on-first-retry',
        ignoreHTTPSErrors: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
    ],
};
export default config;
```

## Usage with code generation

In [Writing your first Playwright test](../writing-your-first-playwright-test/index.md) we've seen how we can leverage the Playwright code generation command to write the test cases for us while we simply interact with the application.

To use the persisted storage state while using the `codegen` command, refer to the persisted storage file by using the `--load-storage` flag.

```bash
npx playwright codegen http://localhost:4200 --load-storage=e2e/storageState.json
```

## Conlusion

Yet again, Playwright provides a useful method to a common task.
We could write this logic ourselves or use a plugin for it, but it's nice to know that the Playwright team thinks about us and have this feature built into Playwright.

When we extract the authentication flow from the test cases into a global setup, we gain two big benefits.

The test cases don't need to worry about the authentication process and this removes extra fluff from the test cases, the test code only contains the important path.

The test suite runs a lot faster because the test user only needs to be authenticated once, and not for every test case.

Happy testing!
