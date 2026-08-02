import { test, expect } from '@playwright/test';

test('sitemap works and can navigate to random pages', async ({ page, request }) => {
	const sitemapUrls = await test.step('get sitemap and parse urls', async () => {
		const sitemap = await request.get(`/sitemap.xml`);
		expect(sitemap.ok()).toBeTruthy();

		const sitemapXml = await sitemap.text();
		const urls = [...sitemapXml.matchAll(/<loc>(.+?)<\/loc>/g)];
		expect(urls.length).toBeGreaterThan(50);
		expect(sitemapXml).not.toContain('<changefreq>');
		expect(sitemapXml).not.toContain('<priority>');
		const paths = urls.map(([_, url]) => new URL(url).pathname);
		expect(paths.some((path) => path.startsWith('/resources/'))).toBeFalsy();
		return paths.filter((url) => url.startsWith('/blog/'));
	});

	const randomPosts = sitemapUrls.sort(() => 0.5 - Math.random()).slice(0, 10);
	expect(randomPosts).toHaveLength(10);
	for (const post of randomPosts) {
		await test.step(`${post} loads`, async () => {
			const response = await page.goto(post);
			expect(response?.ok()).toBeTruthy();

			const banner = await page.goto(`${post}/images/banner.webp`);
			expect(banner?.ok()).toBeTruthy();

			// await injectAxe(page);
			// await checkA11y(page);
		});
	}
});

test('llms index exposes curated content', async ({ request }) => {
	const response = await request.get('/llms.txt');
	expect(response.ok()).toBeTruthy();
	expect(response.headers()['content-type']).toContain('text/plain');

	const llms = await response.text();
	expect(llms).toContain('# Tim Deschryver');
	expect(llms).toContain('## Recent long-form articles');
	expect(llms).not.toContain('/resources/');
	expect(llms).toContain('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo');
});

test('robots explicitly permits AI search crawlers', async ({ request }) => {
	const response = await request.get('/robots.txt');
	expect(response.ok()).toBeTruthy();

	const robots = await response.text();
	for (const crawler of [
		'OAI-SearchBot',
		'ChatGPT-User',
		'Claude-SearchBot',
		'Claude-User',
		'PerplexityBot',
		'Perplexity-User',
	]) {
		expect(robots).toContain(`User-agent: ${crawler}\nAllow: /`);
	}
});

test('articles connect author and website structured data', async ({ page }) => {
	await page.goto('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo');
	const headerMargin = await page
		.locator('main > header')
		.evaluate((header) => Number.parseFloat(getComputedStyle(header).marginBottom));
	expect(headerMargin).toBeGreaterThanOrEqual(32);
	const json = await page.locator('script[type="application/ld+json"]').textContent();
	const structuredData = JSON.parse(json || '{}');
	const graph = structuredData['@graph'] as Record<string, unknown>[];
	const person = graph.find((entity) => entity['@id'] === 'https://timdeschryver.dev/#person');
	const website = graph.find((entity) => entity['@id'] === 'https://timdeschryver.dev/#website');
	const article = graph.find((entity) => entity['@type'] === 'BlogPosting');

	expect(person?.sameAs).toContain('https://github.com/timdeschryver');
	expect(person?.sameAs).toContain('https://twitter.com/tim_deschryver');
	expect(person?.award).toContain('Microsoft Most Valuable Professional');
	expect(person?.knowsAbout).toEqual(expect.arrayContaining(['Agentic AI', 'Sociocracy 3.0']));
	expect(website?.publisher).toEqual({ '@id': person?.['@id'] });
	expect(article?.author).toEqual({ '@id': person?.['@id'] });
	expect(article?.isPartOf).toEqual({ '@id': website?.['@id'] });
});

test('homepage works ', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.ok()).toBeTruthy();
	await expect(page.getByRole('heading', { name: 'Currently exploring' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Agentic AI' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Sociocracy 3.0' })).toBeVisible();
	const socialProfiles = page.getByRole('navigation', { name: 'Social profiles' });
	await expect(socialProfiles.getByRole('link')).toHaveCount(4);
});

test('blog works ', async ({ page }) => {
	const response = await page.goto('/blog');
	expect(response?.ok()).toBeTruthy();
});

test('blog list shows subtle sequential post numbers', async ({ page }) => {
	await page.goto('/blog');
	const postNumbers = page.locator('.post-order');
	await expect(postNumbers.nth(0)).toHaveText('01');
	await expect(postNumbers.nth(1)).toHaveText('02');
});

test('translations works ', async ({ page }) => {
	await page.goto('/blog/single-component-angular-modules-and-component-tests-go-hand-in-hand');
	await expect(
		page.getByText('Thanks to the ❤️ community you can also read this post in:'),
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'Español' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Dany Paredes' })).toBeVisible();
});
