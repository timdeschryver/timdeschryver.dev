import { describe, expect, it } from 'vitest';
import { markdownPath, parseContentIndex, searchContent } from './content';

const siteUrl = 'https://timdeschryver.dev';

const llmsTxt = `# Tim Deschryver

## Main sections

- [Blog](https://timdeschryver.dev/blog): Long-form technical articles

## Blog posts

- [Testing Signals with Angular Testing Library](https://timdeschryver.dev/blog/testing-signals-with-angular-testing-library.md) (2024-04-11; topics: Angular Testing Library, Angular, Testing): TLDR: Angular Testing Library handles Signal properties.
- [Your first MCP server with ASP.NET](https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet.md) (2026-06-25; topics: .NET, AI, MCP): Query your application's data using natural language.
- [Escaped \\[brackets\\] and \\\\ slashes](https://timdeschryver.dev/blog/escaped.md) (2023-01-01; technical note): A description with \\[brackets\\]

## Developer bits

- [Inferred Type Predicates](https://timdeschryver.dev/bits/inferred-type-predicates.md) (2024-06-18; topics: typescript): Type predicates are inferred.

## Optional

- [RSS feed](https://timdeschryver.dev/blog/rss.xml): Full-content feed of long-form articles
`;

describe('parseContentIndex', () => {
	const items = parseContentIndex(llmsTxt);

	it('reads the blog posts and bits', () => {
		expect(items.map((item) => [item.type, item.slug])).toEqual([
			['blog', 'testing-signals-with-angular-testing-library'],
			['blog', 'your-first-mcp-server-with-aspnet'],
			['blog', 'escaped'],
			['bit', 'inferred-type-predicates'],
		]);
	});

	it('reads the details of an item', () => {
		expect(items[1]).toEqual({
			type: 'blog',
			slug: 'your-first-mcp-server-with-aspnet',
			title: 'Your first MCP server with ASP.NET',
			url: 'https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet',
			markdownUrl: 'https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet.md',
			date: '2026-06-25',
			topics: ['.NET', 'AI', 'MCP'],
			description: "Query your application's data using natural language.",
		});
	});

	it('unescapes markdown text and allows content without topics', () => {
		expect(items[2]).toMatchObject({
			title: 'Escaped [brackets] and \\ slashes',
			topics: [],
			description: 'A description with [brackets]',
		});
	});
});

describe('searchContent', () => {
	const items = parseContentIndex(llmsTxt);

	it('returns the most recent content without a query', () => {
		expect(searchContent(items, { limit: 2 }).map((item) => item.slug)).toEqual([
			'your-first-mcp-server-with-aspnet',
			'inferred-type-predicates',
		]);
	});

	it('ranks title matches above description matches', () => {
		expect(searchContent(items, { query: 'Signal' }).map((item) => item.slug)).toEqual([
			'testing-signals-with-angular-testing-library',
		]);
		expect(searchContent(items, { query: 'mcp natural' }).map((item) => item.slug)).toEqual([
			'your-first-mcp-server-with-aspnet',
		]);
	});

	it('filters by type and topic', () => {
		expect(searchContent(items, { type: 'bit' }).map((item) => item.slug)).toEqual([
			'inferred-type-predicates',
		]);
		expect(searchContent(items, { topic: 'angular' }).map((item) => item.slug)).toEqual([
			'testing-signals-with-angular-testing-library',
		]);
	});
});

describe('markdownPath', () => {
	it.each([
		['https://timdeschryver.dev/blog/a-post', '/blog/a-post.md'],
		['https://timdeschryver.dev/blog/a-post.md', '/blog/a-post.md'],
		['https://timdeschryver.dev/blog/a-post/', '/blog/a-post.md'],
		['/bits/a-bit', '/bits/a-bit.md'],
	])('resolves %s to %s', (url, path) => {
		expect(markdownPath(url, siteUrl)).toBe(path);
	});

	it.each([
		'https://example.com/blog/a-post',
		'https://timdeschryver.dev/blog',
		'https://timdeschryver.dev/blog/a-post/images/banner.webp',
		'/blog/../llms.txt',
		'https://[invalid',
	])('rejects %s', (url) => {
		expect(markdownPath(url, siteUrl)).toBeUndefined();
	});
});
