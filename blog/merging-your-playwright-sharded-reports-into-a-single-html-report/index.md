---
title: Merging your Playwright sharded reports into a single HTML report
slug: merging-your-playwright-sharded-reports-into-a-single-html-report
description: Playwright v1.37 introduces a new `merge-reports` command. In this blog post we'll see how leverage this command to create a single test report from different sharded test reports. The result is one page containing all of your test results.
date: 2023-09-18
tags: Playwright, Testing, CI/CD
---

In a previous blog post, "[Using Playwright test shards in combination with a job matrix to improve your CI speed](../using-playwright-test-shards-in-combination-with-a-job-matrix-to-improve-your-ci-speed/index.md)" we've seen how to split our Playwright test suite into multiple shards to speed-up the build pipeline.

The setup presented in that blog post created multiple test reports, one for each shard.
The only downside with this, is that we didn't have an overview of all the tests, which made it a little bit harder to find a test report that you were looking for. For example, when a test failed you first needed to know the shard to open the corresponding test report.

[Playwright v1.37.0](https://github.com/microsoft/playwright/releases/tag/v1.37.0) changes that by providing the ability to merge the different test reports into one.

The result is a beatiful looking pipeline, with one single test report as result thanks to the new `merge-reports` command.

![The GitHub Workflow visualization of the pipeline has an additional job to merge the individual test reports for each test shard.](./images/pipeline.png)

## Upgrade Playwright to >= v1.37

The first step is upgrading Playwright to at least v1.37.0.

```bash
npm install --save-dev @playwright/test@1.37.0
```

## Changing the test reporter

Next, the reporter needs to be changed.
The reporter currently outputs the test results into an HTML file, but these cannot be combined into a single report.
Instead of exporting the test results into an HTML report, we want it to be a file format that can later be processed and merged.

To update the reporter, modify the reporter within the playwright config to create a `blob` instead of an `html` file.
With this change the output directory containing the test result files is also different, and is changed from `playwright-report` to `blob-report`.

This results in a zip file containing a JSON file with the test output.

:::code-group

```ts{4}:playwright.config.ts [title=Playwright Config]
import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  reporter: process.env.CI ? 'blob' : 'html',
}
```

```diff:playwright.config.ts [title=Diff]
import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
-  reporter: 'html',
+  reporter: process.env.CI ? 'blob' : 'html',
}
```

:::

The change above only makes use of the blob format in a continuous integration environment (using the environment variable `process.env.CI`), in other words within your build pipeline.
You can also enable this for your local environment if that's desired, e.g. when you're also making use of test sharding when running your test suite locally.

## Creating a test report from the blob files

To create a HTML test report the last step is to merge the different blob files.
Luckily we don't need to do this manually, but we can use the new [`merge-reports`](https://playwright.dev/docs/test-sharding#merge-reports-cli) command.

Pass it the location where your blob files are located.

```bash
npx playwright merge-reports --reporter html ./blob-reports
```

## Updating the CI pipeline (GitHub Actions)

Now that we got that working, it's time to update our pipeline and make the above changes to it.

Beause the output of the test results is changed to `blob-report`, we need to update the artifact upload step.
A side note: while updating the step, you can also lower the retention time because these files will be replaced by the single output file that will be created next.

:::code-group

```yml:playwright.yml [title=Upload]c
- name: Upload temp reports
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: all-blob-reports
    path: blob-report
    retention-days: 1
```

```diff:playwright.yml [title=Diff]
- - name: Upload reports
+ - name: Upload temp reports
    uses: actions/upload-artifact@v3
    if: always()
    with:
-     name: playwright-report-${{ matrix.shard }}_${{ strategy.job-total }}
+     name: all-blob-reports
-     path: playwright-report
+     path: blob-report
-     retention-days: 30
+     retention-days: 1
```

:::

This change still results in multiple output files.
To merge the files we use the `merge-reports` command in an additional job.
This job downloads all the blob reports created by the sharded jobs, which all upload their individual reports as an artifact.
This needs to be an extra job because the test shards are run in parallel, each in its own isolated environment.

```yml:playwright.yml
  create-report:
    name: 📔 Create test report
    if: always()
    # import to wait until all the test jobs have finished
    needs: [test]

    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3

    - name: Install dependencies
      run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v3
      with:
        name: all-blob-reports
        path: all-blob-reports

    - name: Merge into HTML Report
      run: npx playwright merge-reports --reporter html ./all-blob-reports

    - name: Upload HTML report
      uses: actions/upload-artifact@v3
      with:
        name: html-report--attempt-${{ github.run_attempt }}
        path: playwright-report
        retention-days: 7
```

The last step within the `create-report` job above uploads the bundled report as a pipeline artifact.

## Result

These changes result in the [following pipeline](https://github.com/timdeschryver/playwright-sharding/actions/runs/6207850014):

![The GitHub Workflow visualization of the pipeline has an additional job to merge the individual test reports for each test shard.](./images/pipeline.png)

The complete GitHub workflow file looks as follows:

```yaml{72-78,80-107}:playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  install:
    timeout-minutes: 60
    name: 🔍 Install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Cache node_modules
        uses: actions/cache@v3
        id: cache-node-modules
        with:
          path: |
            node_modules
          key: modules-${{ hashFiles('package-lock.json') }}

      - name: Cache Playwright binaries
        uses: actions/cache@v3
        id: cache-playwright
        with:
          path: |
            ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        if: steps.cache-node-modules.outputs.cache-hit != 'true'
        run: npm ci

      - name: Install Playwright Browsers
        if: steps.cache-playwright.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps

  test:
    name: 🧪 Test (${{ matrix.shard }}/${{ strategy.job-total }})
    needs: install
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Cache node_modules
        uses: actions/cache@v3
        with:
          path: |
            node_modules
          key: modules-${{ hashFiles('package-lock.json') }}

      - name: Cache Playwright
        uses: actions/cache@v3
        with:
          path: |
            ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}

      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shard }}/${{ strategy.job-total }}

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: all-blob-reports
          path: blob-report
          retention-days: 1

  create-report:
    name: 📔 Create test report
    if: always()
    needs: [test]

    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3

    - name: Install dependencies
      run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v3
      with:
        name: all-blob-reports
        path: all-blob-reports

    - name: Merge into HTML Report
      run: npx playwright merge-reports --reporter html ./all-blob-reports

    - name: Upload HTML report
      uses: actions/upload-artifact@v3
      with:
        name: html-report--attempt-${{ github.run_attempt }}
        path: playwright-report
        retention-days: 7
```

You can also take a look at [this commit](https://github.com/timdeschryver/playwright-sharding/commit/9f004f534d9eaf8b1183b66e967af527c09c9d13) for the changes that we've covered in this blog post.
