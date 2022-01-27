import { test, expect } from '@playwright/test';

test('all pages are accessible ', async ({ page, request }) => {
	test.slow();
	const sitemap = await request.get(`/sitemap.xml`);
	expect(sitemap.ok()).toBeTruthy();

	const sitemapXml = await sitemap.text();
	const urls = sitemapXml.matchAll(/<loc>(.+?)<\/loc>/g);
	for (const [_, url] of urls) {
		const response = await page.goto(url.replace('https://timdeschryver.dev', ''));
		expect(response.ok()).toBeTruthy();

		// await injectAxe(page);
		// await checkA11y(page);
	}
});
