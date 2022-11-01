```yaml:.azure-pipeline/playwright.yml
name: Playwright Tests

trigger:
  - main
  - master

jobs:
  - job: test
    timeoutInMinutes: 60
    pool:
      vmImage: "ubuntu-latest"

    steps:
      - task: NodeTool@0
        inputs:
          versionSpec: "16.x"
        displayName: "Install Node.js"

      - script: |
          npm ci
        displayName: "Install dependencies"

      - script: |
          npx playwright install --with-deps
        displayName: "Install Playwright Browsers"

      - script: |
          npx playwright test
        displayName: "Run Playwright tests"

      - publish: $(System.DefaultWorkingDirectory)/playwright-report
        artifact: playwright-report
        # always create the artifact, this is useful for debugging failed tests
        condition: always()
```
