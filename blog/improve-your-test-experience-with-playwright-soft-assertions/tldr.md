```ts{8-10}:form.spec.ts
import { test, expect } from '@playwright/test';

test('form is prefilled with person data', async ({ page }) => {
    const firstname = page.getByRole('textbox', { name: /firstname/i });
    const lastname = page.getByRole('textbox', { name: /lastname/i });
    const email = page.getByRole('textbox', { name: /email/i });

    await expect.soft(firstname).toHaveValue('Tim');
    await expect.soft(lastname).toHaveValue('Deschryver');
    await expect.soft(email).toHaveValue('tim@deschryver.be');

    // optionally, you can check if all assertions passed to stop the test execution
    expect(test.info().errors).toHaveLength(0);

    // more test steps
});
```
