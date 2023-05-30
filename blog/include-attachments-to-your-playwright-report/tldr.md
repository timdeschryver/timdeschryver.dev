## Add a downloaded file to the report

```ts{8-11, 13-18}:download.spec.ts
import { test } from '@playwright/test';

test('adds a downloaded file to report', async ({ page }, testInfo) => {
    // 1. Navigate to the page
    await page.goto('https://owasp.org/www-project-web-security-testing-guide/');
    await page.getByRole('tab', { name: 'Release Versions' }).click();

    // 2. Wait for the download
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download the v4.2 PDF' }).click();
    const download = await downloadPromise;

    // 3. Add the PDF to the report
    const path = await download.path();
    // ^ AppData\Local\Temp\playwright-artifacts-KZfOpF\19df2a33-9f96-465a-acb5-3dc1b9041e71
    await testInfo.attach(download.suggestedFilename(), {
        path: path!,
    });
});
```

## Add an external file to the report

```ts{7-9, 11-12, 14-17}:external.spec.ts
import { test } from '@playwright/test';

test('adds an external file to report', async ({ page, request }, testInfo) => {
    // 1. Navigate to the page
    await page.goto('https://owasp.org/www-project-top-ten/');

    // 2. Grab the PDF link
    const link = await page.getByRole('link', { name: 'OWASP Top 10 2017' });
    const href = await link.getAttribute('href');

    // 3. Download the PDF
    const pdfRequest = await request.get('https://owasp.org' + href);

    // 4. Add the PDF to the report
    await testInfo.attach((await link.textContent())!, {
        body: await pdfRequest.body(),
    });
});
```

## Add a screenshot to the report

```ts{7-8, 10-14}:screenshot.spec.ts
import { test } from '@playwright/test';

test('adds a screenshot to report', async ({ page }, testInfo) => {
    // 1. Navigate to the page
    await page.goto('https://owasp.org/www-project-top-ten/');

    // 2. Take a screenshot
    const screenshot = await page.screenshot();

    // 3. Add the screenshot to the report
    await testInfo.attach('OWASP TOP 10', {
        body: screenshot,
        contentType: 'image/png',
    });
});
```
