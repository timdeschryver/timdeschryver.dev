import { parseContentIndex } from '#mcp/content.js';
import { describe, expect, it } from 'vitest';
import { contentListItem } from './markdown-pages';

describe('contentListItem', () => {
	it('writes llms.txt items the MCP server can read', () => {
		const llmsTxt = [
			'## Blog posts',
			'',
			contentListItem(
				{
					title: 'Escaped [brackets] and \\ slashes',
					description: 'A description\nover multiple lines',
					date: '2026-01-01',
					tags: ['Angular', '.NET'],
				},
				'https://timdeschryver.dev/blog/a-post.md',
			),
			'',
			'## Developer bits',
			'',
			contentListItem(
				{ title: 'A bit', description: 'Short', date: '2025-01-01', tags: [] },
				'https://timdeschryver.dev/bits/a-bit.md',
			),
		].join('\n');

		expect(parseContentIndex(llmsTxt)).toEqual([
			{
				type: 'blog',
				slug: 'a-post',
				title: 'Escaped [brackets] and \\ slashes',
				url: 'https://timdeschryver.dev/blog/a-post',
				markdownUrl: 'https://timdeschryver.dev/blog/a-post.md',
				date: '2026-01-01',
				topics: ['Angular', '.NET'],
				description: 'A description over multiple lines',
			},
			{
				type: 'bit',
				slug: 'a-bit',
				title: 'A bit',
				url: 'https://timdeschryver.dev/bits/a-bit',
				markdownUrl: 'https://timdeschryver.dev/bits/a-bit.md',
				date: '2025-01-01',
				topics: [],
				description: 'Short',
			},
		]);
	});
});
