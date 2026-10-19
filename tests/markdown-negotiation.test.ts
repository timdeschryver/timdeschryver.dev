import { test, expect } from '@playwright/test';

// Cloudflare rewrites a request with the `Accept: text/markdown` header to the Markdown version of the page
const pages = [
	{ path: '/', markdown: '/index.md', heading: "# Hi, I'm Tim" },
	{ path: '/blog', markdown: '/blog.md', heading: '# Notes from building software' },
	{ path: '/bits', markdown: '/bits.md', heading: '# Developer Bits' },
];

for (const { path, markdown, heading } of pages) {
	test(`${path} has a markdown version`, async ({ request }) => {
		const response = await request.get(markdown);
		expect(response.ok()).toBeTruthy();
		expect(response.headers()['content-type']).toContain('text/markdown');

		const content = await response.text();
		expect(content).toMatch(/^---\ntitle: /);
		expect(content).toContain(heading);

		const html = await (await request.get(path)).text();
		expect(html).toMatch(
			new RegExp(`<link rel="alternate" type="text/markdown" href="[^"]*${markdown}"`),
		);
	});
}

test('markdown overviews link to the canonical pages', async ({ request }) => {
	const blog = await (await request.get('/blog.md')).text();
	expect(blog).toContain('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo)');

	const bits = await (await request.get('/bits.md')).text();
	expect(bits).toContain('/bits/http-files)');
});
