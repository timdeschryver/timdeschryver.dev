import { test, expect } from '@playwright/test';

test('flow test', async ({ page }) => {
	await page.goto('');
	await page.getByRole('link', { name: 'BLOG', exact: true }).click();

	await expect(page).toHaveURL(`/blog`);

	await page.getByRole('button', { name: 'Angular', exact: true }).click();
	await expect(page).toHaveURL(`/blog?q=Angular`);

	await page.getByRole('button', { name: 'Testing', exact: true }).click();
	await expect(page).toHaveURL(`/blog?q=Angular+Testing`);

	await page.getByPlaceholder('Search').fill('Angular Testing ngrx project');
	await page.getByRole('link', { name: /Testing an NgRx project/i }).click();

	await expect(page.getByRole('heading', { name: 'Actions' })).toBeDefined();
});
