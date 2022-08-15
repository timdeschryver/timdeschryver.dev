You can use the [`page.setInputFiles`](https://playwright.dev/docs/api/class-page#page-set-input-files) method to easily upload one or more files.

```ts{12}:tests/test-1.spec.ts
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

    // Go to http://127.0.0.1:8080/
    await page.goto('http://127.0.0.1:8080/');

    // Click input[name="file-upload"]
    await page.locator('input[name="file-upload"]').click();

    // Upload fixture.pdf
    await page.locator('input[name="file-upload"]').setInputFiles('./tests/fixtures/fixture.pdf');

    // Click text=fixture.pdf
    await page.locator('text=fixture.pdf').click();

});
```
