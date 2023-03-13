---
title: Create and run Playwright test sets using tags and grep
slug: create-and-run-playwright-test-sets-using-tags-and-grep
description: At some point in time you'll want to run a subset of your tests. Organizing your tests with Playwright test tags helps you to do this in a clean way. Using tags allows you to target specific tests in specific scenarios, and can help to scale your pipeline(s).
date: 2023-03-13
tags: Testing, Playwright, CI/CD
---

As your test suite grows, you might want to run a subset of your tests.
Even though Playwright can [run tests in parallel](../using-playwright-test-shards-in-combination-with-a-job-matrix-to-improve-your-ci-speed/index.md), at some point, it might be a good idea to split your tests into smaller groups.

In this blog post, we'll discuss at how we can utilize the `grep` functionality to run a subset of your test cases within Playwright.
The biggest advantage of properly organizing your tests by using tags is that you can specifically target test cases that are required to execute.
Let's take a look at a few examples:

- You can run your whole test suite at night without disturbing your team, and only run a subset of your tests on a pull request to keep your CI pipeline(s) fast and efficient.
- A team (e.g. QA or a feature team) can only run the tests that they are responsible for.
- You can run smoke tests that only perform read actions during a production release.

## The `grep` functionality

For those who are not very familiar with grep (short for global regular expression print), it's a powerful Unix-like command-line utility for searching plain-text data sets for lines that match a regular expression. In other words, it's a tool that allows you to efficiently search for a text using a regex.

So what does this have to do with Playwright?
Well, Playwright allows you to use the [`grep` functionality](https://playwright.dev/docs/api/class-testproject#test-project-grep) to run specific tests using the test description.

To define the grep pattern, you can use the `--grep` (or `-g`) flag via the command line or the `grep` property in the configuration file.
Or you can also use the `--grep-invert` option or the `grepInvert` property to exclude tests that match the pattern.

Personally, I prefer to use the `grep` property via the command line, as it's easier to modify.
You can also define multiple scripts in your `package.json` file with the various grep expressions.

To take a look at how `grep` works, let's create a few test cases and see what happens while using `grep`.

```ts:customer-actions.spec.ts
import { test } from '@playwright/test';

test('customer can create an appointment', async ({ page }) => {
    ...
});

test('customer can see all appointments', async ({ page }) => {
    ...
});

test('customer can create an order', async ({ page }) => {
    ...
});
```

You can target a specific test case by using the following commands:

```bash
# Run tests matching "customer" (all of them)
npx playwright test --grep "customer"

# Run tests matching "appointment" (the first two)
npx playwright test --grep "appointment"

# Run tests matching "order" (the last one)
npx playwright test --grep "order"

# Run tests matching "create" (the first and last ones)
npx playwright test --grep "create"
```

## Using the Playwright test tag

Now that we know how `grep` works, let's take a look at how we can use tags to organize our tests.
Using `grep` without tags works but it can quickly become a mess.

By using the [tag system](https://playwright.dev/docs/test-annotations#tag-tests), you can group your tests into logical sets.
To define a tag, you can use the `@tag` syntax in the test description.
While technically you can use any string as a tag, the documentation encourages the `@tag` syntax so let's stick with that.
Another unwritten rule is to place the tags at the end of the test description.

To give you an idea of how this looks like, a refactored version of the previous example would look like this:

```ts:customer-actions.spec.ts
import { test } from '@playwright/test';

test('customer can create an appointment @feature-appointments', async ({ page }) => {
    ...
});

test('customer can see all appointments @feature-appointments @readonly', async ({ page }) => {
    ...
});

test('customer can create an order @feature-orders', async ({ page }) => {
    ...
});
```

To use `grep` you can use the following commands to target test cases with tags:

```bash
# Run tests with the @feature-appointments tag (the first two)
npx playwright test --grep "@feature-appointments"

# Run tests with the @feature-orders tag (the last one)
npx playwright test --grep "@feature-orders"

# Run tests with the @readonly tag (the second one)
npx playwright test --grep "@readonly"
```

For now, we have only seen test case descriptions, but we can also add tests to a group of tests using using `test.describe`.
This works exactly the same as the `test` function, but it allows you to add a tag to multiple test cases at once.

```ts:customer-actions.spec.ts
import { test } from '@playwright/test';

test.describe('@feature-appointments', () => {
    test('customer can create an appointment', async ({ page }) => {
        ...
    });

    test('customer can see all appointments @readonly', async ({ page }) => {
        ...
    });
});

test.describe('@feature-orders', () => {
    test('customer can create an order', async ({ page }) => {
        ...
    });
});
```

## The flexibility of test tags

Instead of simply using the `--grep` flag to target a specific tag, you can also use test tags to handle more complex scenarios.

Take a look at the following examples:

```bash
# Run tests containing the @feature tag (the tags @feature-appointments or @feature-orders are also a match)
npx playwright test --grep "@feature"

# Run tests containing the @feature-appointments tag AND do not contain the @readonly tag
npx playwright test --grep "@feature-appointments" --grep-invert "@readonly"

# Run tests containing the @feature-appointments tag AND the @readonly tag
# This also works when the describe block contains one of the given tags
npx playwright test --grep "(?=.*@feature-appointments)(?=.*@readonly)"
```

:::info
I haven't found a way to create an OR by using the command line.
You could fallback to the configuration file when needed, with the following syntaxt `"/@feature-appointments|@feature-orders/"`
:::

## Conclusion

We looked into the `grep` functionality in combination with test tags to help you scale your test suite.
In Playwright we can use tags to organize our tests into logical sets, and with the `grep` and `grep-invert` flags we can target specific test set(s) to run.

While we previously have seen that [running tests in parallel](../using-playwright-test-shards-in-combination-with-a-job-matrix-to-improve-your-ci-speed/index.md) is also a good way to improve your pipeline, using these techniques make your pipeline(s) more efficient. A test that isn't executed, is always faster than a test that is executed.
This becomes even more important when you have a large test suite.

To end this post, I want to share a few tags that I use in my test suite:

- `@smoke`: a subset of tests that only perform simple and fast checks (mostly read-only);
- `@flow`: a subset of tests that cover a whole flow (larger tests);
- `@ci`: a subset of tests that are run within the CI pipeline;
- `@feature`: a subset of tests that cover a specific feature;
