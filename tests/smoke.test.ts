import { test, expect } from '@playwright/test';

test('sitemap works and can navigate to random pages', async ({ page, request }) => {
	const sitemap = await request.get(`/sitemap.xml`);
	expect(sitemap.ok()).toBeTruthy();

	const sitemapXml = await sitemap.text();
	const urls = [...sitemapXml.matchAll(/<loc>(.+?)<\/loc>/g)];
	for (const [_, url] of urls.sort(() => 0.5 - Math.random()).slice(0, 10)) {
		const response = await page.goto(url.replace('https://timdeschryver.dev', ''));
		expect(response.ok()).toBeTruthy();

		// await injectAxe(page);
		// await checkA11y(page);
	}
});

test('rss feed works ', async ({ page }) => {
	const response = await page.goto('/blog/rss.xml');
	expect(response.ok()).toBeTruthy();
});

test('homepage works ', async ({ page }) => {
	const response = await page.goto('/');
	expect(response.ok()).toBeTruthy();
});

test('blog works ', async ({ page }) => {
	const response = await page.goto('/blog');
	expect(response.ok()).toBeTruthy();
});

test('snippets works ', async ({ page }) => {
	const response = await page.goto('/snippets');
	expect(response.ok()).toBeTruthy();
});

test('resources works ', async ({ page }) => {
	let response = await page.goto('/resources/ngrx');
	expect(response.ok()).toBeTruthy();
	response = await page.goto('/resources/sql');
	expect(response.ok()).toBeTruthy();
});
