Read the output variable `static_web_app_url` from the `Azure/static-web-apps-deploy` GitHub Action to have access to your preview environment URL.

```yml{17-18, 40, 43}:./github/workflows/azure-static-web-apps-salmon-rock-0fb035b03.yml
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
    outputs:
      swa_url: ${{ steps.builddeploy.outputs.static_web_app_url }}
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
    needs: build_and_deploy
    runs-on: ubuntu-latest
    env:
      PLAYWRIGHT_TEST_BASE_URL: ${{ needs.build_and_deploy.outputs.swa_url }}
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
