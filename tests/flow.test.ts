import { test, expect } from '@playwright/test';

test('flow test', async ({ page }) => {
	// Go to https://timdeschryver.dev/
	await page.goto('');

	// Click text=Blog
	await page.click('text=Blog');
	await expect(page).toHaveURL(`/blog`);
	// first time - posts need to be generated
	await page.waitForSelector('[placeholder="Search"]');

	// Click text=Angular
	await page.click('text=Angular');
	await expect(page).toHaveURL(`/blog?q=Angular`);

	// Click [placeholder="Search"]
	await page.click('[placeholder="Search"]');

	// Click text=Testing
	await page.click('text=Testing');
	await expect(page).toHaveURL(`/blog?q=Angular+Testing`);

	// Click [placeholder="Search"]
	await page.click('[placeholder="Search"]');

	// Fill [placeholder="Search"]
	await Promise.all([
		page.waitForNavigation(),
		page.fill('[placeholder="Search"]', 'Angular Testing ngrx project'),
	]);

	// Click text=Testing an NgRx project
	await Promise.all([page.waitForNavigation(), page.click('text=Testing an NgRx project')]);

	// Click text=Actions
	await Promise.all([page.waitForNavigation(), page.click('text=Actions')]);
});
