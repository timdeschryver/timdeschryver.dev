---
title: Get access to the deployed Azure Static Webb App URL within your GitHub Workflow
slug: get-access-to-the-deployed-azure-static-web-app-url-within-your-github-workflow
description: How to run your Playwright tests against your Azure Static Web App preview environment, which is build and deployed with the Azure/static-web-apps-deploy GitHub Action.
author: Tim Deschryver
date: 2022-07-27
tags: Azure Static Web App, Azure, Playwright, GitHub Actions
---

Hey you.
If you're here it probably means four things:

- You're using an Azure Static Web App (SWA)
- You're using GitHub Actions
- You're deploying the SWA with the `Azure/static-web-apps-deploy` GitHub Action
- You're looking into running your test suite (maybe with [🎭 Playwright](/blog?q=playwright)) against a preview environment while a Pull Request is open

If this is you, you don't have to look any further because I got you covered!

When you create an Azure Static Web App within the Azure Portal and configure it to use GitHub with GitHub Actions, it automatically generates a GitHub workflow for you. The workflow file is also added to your GitHub repository, and it defines some pre-configured steps to build and deploy your SWA.

When I migrated my blog to be a SWA, the workflow that was generated looked like this:

```yml:./github/workflows/azure-static-web-apps-salmon-rock-0fb035b03.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_ROCK_0FB035B03 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
          action: "upload"
          ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: "/" # App source code path
          api_location: "" # Api source code path - optional
          output_location: "build" # Built app content directory - optional
          ###### End of Repository/Build Configurations ######

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_ROCK_0FB035B03 }}
          action: "close"
```

The workflow uses `Azure/static-web-apps-deploy` GitHub Action to build the application, and deploy it to your Azure resource.
The workflow is triggered when a pull request is opened, or when a push is made against the `main` branch.

What I was missing here is a way to make sure I don't break my blog when I make changes.
Believe me when I say that the timing is always bad when something is broken.
This happened to me numerous times in the past, especially because my blog is written with [SvelteKit](https://kit.svelte.dev), which is undergoing changes regularly toward a stable v1 release.

I don't want to manually verify my blog I make changes because this can be time-consuming, and I always forgot something.
That's why I wanted to add a safety check within the workflow.
Automated tests to check if everything is working as expected.
Of course, I immediately grabbed to [Playwright](https://playwright.dev) for this task.

Just like the GitHub workflow that was generated, Playwright is also able to create a workflow for you.
Just install Playwright with the `init` script, and work your way through the step wizard.

```bash
npm init playwright
```

When you've completed the wizard, you'll end up with a new GitHub workflow file.
In my case, this looked like the following file.

```yml:.github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '14.x'
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - uses: actions/upload-artifact@v2
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

The workflow installs Playwright and executes the test suite when a push is made against the `main` branch, or when a Pull Request is opened.

To run these tests within my Azure workflow, I simply copy-pasted its content into the SWA workflow file, which gives the following result:

```yml{35-61}:./github/workflows/azure-static-web-apps-salmon-rock-0fb035b03.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_ROCK_0FB035B03 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
          action: "upload"
          ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: "/" # App source code path
          api_location: "" # Api source code path - optional
          output_location: "build" # Built app content directory - optional
          ###### End of Repository/Build Configurations ######

  smoke_test_job:
    name: ☁️ Smoke test ${{ github.event.deployment_status.target_url }}
    runs-on: ubuntu-latest
    steps:
      - name: 🛎️ Checkout
        uses: actions/checkout@v3

      - name: 🔢 Use Node.js 16
        uses: actions/setup-node@v3
        with:
          node-version: 16

      - name: 🔎 Install dependencies
        run: npm install

      - name: 🎭 Install Playwright
        run: npx playwright install --with-deps

      - name: 🧪 Run Playwright Tests
        run: npm run test

      - name: 📦 Upload Test Results Artifact
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-test-results
          path: playwright-report

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_ROCK_0FB035B03 }}
          action: "close"
```

To get the most value out of these tests at this stage, you have to run them against the deployed environment.

Therefore, we need to know the deployed URL.
The [docs](https://docs.microsoft.com/en-us/azure/static-web-apps/review-publish-pull-requests#review-changes) mention there's a convention to build the preview URL, which looks like `https://<SUBDOMAIN-PULL_REQUEST_ID>.<AZURE_REGION>.azurestaticapps.net`. But this also doesn't take into account that we also have our live environment when we push to `main`. Ideally, we also want to verify
that this continues to work.

But there has to be a better way.
Luckily, there's the output variable `static_web_app_url` that's defined on the `Azure/static-web-apps-deploy` GitHub Action.

With this knowledge, all we have to do is include the `static_web_app_url` variable to the output variables of the build job. This way, we can access the variable within the test job to configure Playwright.
To run the Playwright tests against the preview environment, assign the output variable to the `PLAYWRIGHT_TEST_BASE_URL` environment variable within the test job.

```diff:./github/workflows/azure-static-web-apps-salmon-rock-0fb035b03.yml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
+    outputs:
+      swa_url: ${{ steps.builddeploy.outputs.static_web_app_url }}
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_ROCK_0FB035B03 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
          action: 'upload'
          ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: '/' # App source code path
          api_location: '' # Api source code path - optional
          output_location: 'build' # Built app content directory - optional
          production_branch: 'main'
          ###### End of Repository/Build Configurations ######

  smoke_test_job:
    name: ☁️ Smoke test ${{ github.event.deployment_status.target_url }}
+    needs: build_and_deploy
    runs-on: ubuntu-latest
    env:
+      PLAYWRIGHT_TEST_BASE_URL: ${{ needs.build_and_deploy.outputs.swa_url }}
    steps:
      - name: 🛎️ Checkout
        uses: actions/checkout@v3

      - name: 🔢 Use Node.js 16
        uses: actions/setup-node@v3
        with:
          node-version: 16

      - name: 🔎 Install dependencies
        run: npm install

      - name: 🎭 Install Playwright
        run: npx playwright install --with-deps

      - name: 🧪 Run Playwright Tests
        run: npm run test

      - name: 📦 Upload Test Results Artifact
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-test-results
          path: playwright-report

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_SALMON_ROCK_0FB035B03 }}
          action: 'close'
```

Now, with this change, no more faux-passes reach the live environment of my blog 🤞.
And if they do, I'm notified about it.
