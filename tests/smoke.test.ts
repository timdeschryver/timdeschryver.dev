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
	expect(llms).toContain('## Blog posts');
	expect(llms).toContain('## Developer bits');
	expect(llms).not.toContain('/resources/');
	expect(llms).toContain('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo.md');
	// the index is complete, not a recent-only window
	expect(llms).toContain('/blog/a-cheat-sheet-to-migrate-from-moq-to-nsubstitute.md');
});

test('articles are available as plain markdown', async ({ request }) => {
	const response = await request.get(
		'/blog/testing-ai-prompts-and-comparing-models-with-promptfoo.md',
	);
	expect(response.ok()).toBeTruthy();
	expect(response.headers()['content-type']).toContain('text/markdown');

	const markdown = await response.text();
	expect(markdown).toContain('title: ');
	expect(markdown).toContain('## ');

	const bitResponse = await request.get('/bits/http-files.md');
	expect(bitResponse.ok()).toBeTruthy();
	expect(bitResponse.headers()['content-type']).toContain('text/markdown');
});

test('api catalog links to the openapi description', async ({ request }) => {
	const response = await request.get('/.well-known/api-catalog');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('application/linkset+json');

	const { linkset } = await response.json();
	expect(linkset).toHaveLength(1);
	const [api] = linkset;
	expect(api.anchor).toMatch(/^https?:\/\//);
	expect(api['service-doc'][0].href).toMatch(/\/llms\.txt$/);

	const openapi = await request.get(new URL(api['service-desc'][0].href).pathname);
	expect(openapi.ok()).toBeTruthy();
	const description = await openapi.json();
	expect(description.openapi).toBe('3.1.0');
	expect(Object.keys(description.paths)).toContain('/blog/{slug}.md');

	const head = await request.head('/.well-known/api-catalog');
	expect(head.ok()).toBeTruthy();
	expect(head.headers()['link']).toContain('rel="api-catalog"');
});

test('rss feed is served as rss', async ({ request }) => {
	const response = await request.get('/blog/rss.xml');
	expect(response.ok()).toBeTruthy();
	expect(response.headers()['content-type']).toContain('application/rss+xml');
	expect(await response.text()).toContain('<rss ');
});

test('security.txt points to github and has not expired', async ({ request }) => {
	const response = await request.get('/.well-known/security.txt');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('text/plain');

	const security = await response.text();
	expect(security).toContain(
		'Contact: https://github.com/timdeschryver/timdeschryver.dev/security/advisories/new',
	);
	expect(security).toMatch(/^Canonical: https?:\/\/.+\/\.well-known\/security\.txt$/m);

	const expires = new Date(security.match(/^Expires: (.+)$/m)?.[1] ?? '');
	const oneYearFromNow = new Date();
	oneYearFromNow.setUTCFullYear(oneYearFromNow.getUTCFullYear() + 1);
	expect(expires.getTime()).toBeGreaterThan(Date.now());
	expect(expires.getTime()).toBeLessThan(oneYearFromNow.getTime());
});

test('robots explicitly permits AI search crawlers', async ({ request }) => {
	const response = await request.get('/robots.txt');
	expect(response.ok()).toBeTruthy();

	const robots = await response.text();
	for (const crawler of [
		'OAI-SearchBot',
		'ChatGPT-User',
		'GPTBot',
		'Claude-SearchBot',
		'Claude-User',
		'ClaudeBot',
		'PerplexityBot',
		'Perplexity-User',
		'Google-Extended',
		'Applebot-Extended',
		'Meta-ExternalAgent',
	]) {
		// An optional Content-Signal line may sit between the User-agent and Allow directives.
		expect(robots).toMatch(
			new RegExp(`^User-agent: ${crawler}\\n(?:Content-Signal: [^\\n]+\\n)?Allow: /$`, 'm'),
		);
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
	const breadcrumb = graph.find((entity) => entity['@type'] === 'BreadcrumbList');

	expect(person?.sameAs).toContain('https://github.com/timdeschryver');
	expect(person?.sameAs).toContain('https://twitter.com/tim_deschryver');
	expect(person?.award).toContain('Microsoft Most Valuable Professional');
	expect(person?.knowsAbout).toEqual(expect.arrayContaining(['Agentic AI', 'Sociocracy 3.0']));
	expect(website?.publisher).toEqual({ '@id': person?.['@id'] });
	expect(article?.author).toEqual({ '@id': person?.['@id'] });
	expect(article?.isPartOf).toEqual({ '@id': website?.['@id'] });
	expect(article?.articleSection).toEqual(expect.arrayContaining(['AI']));
	expect(breadcrumb?.itemListElement).toHaveLength(3);
	await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveAttribute(
		'href',
		/\/blog\/testing-ai-prompts-and-comparing-models-with-promptfoo\.md$/,
	);
	await expect(page.locator('.article-summary')).toContainText('promptfoo');
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

test('bits index exposes summaries instead of duplicate full articles', async ({ page }) => {
	await page.goto('/bits');
	await expect(page.locator('main article')).not.toHaveCount(0);
	await expect(page.locator('main pre')).toHaveCount(0);
	const json = await page.locator('script[type="application/ld+json"]').textContent();
	const graph = JSON.parse(json || '{}')['@graph'] as Record<string, unknown>[];
	expect(graph.some((entity) => entity['@type'] === 'CollectionPage')).toBeTruthy();
	expect(graph.some((entity) => entity['@type'] === 'ItemList')).toBeTruthy();
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
