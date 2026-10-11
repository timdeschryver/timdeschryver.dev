import { describe, expect, it } from 'vitest';
import { absolutizeMarkdownLinks } from './markdown-links';

const fileUrl = 'https://timdeschryver.dev/blog/current-post/index.md';

describe('absolutizeMarkdownLinks', () => {
	it('points images to their published WebP version in the folder of the post', () => {
		const markdown = ['![A screenshot](./images/1.png "Title")', '![A recording](./images/2.gif)'];

		expect(absolutizeMarkdownLinks(markdown.join('\n'), fileUrl)).toBe(
			[
				'![A screenshot](https://timdeschryver.dev/blog/current-post/images/1.webp "Title")',
				'![A recording](https://timdeschryver.dev/blog/current-post/images/2.gif)',
			].join('\n'),
		);
	});

	it('points links to other posts and bits to their canonical page', () => {
		const markdown = [
			'[a](../other-post/index.md)',
			'[b](../other-post/index.md#a-heading)',
			'[c](../other-post/)',
			'[d](../other-post)',
			'[e](../../bits/a-bit/index.md)',
			'[f](/blog/root-relative/index.md)',
			'[g](/)',
		].join('\n');

		expect(absolutizeMarkdownLinks(markdown, fileUrl)).toBe(
			[
				'[a](https://timdeschryver.dev/blog/other-post)',
				'[b](https://timdeschryver.dev/blog/other-post#a-heading)',
				'[c](https://timdeschryver.dev/blog/other-post)',
				'[d](https://timdeschryver.dev/blog/other-post)',
				'[e](https://timdeschryver.dev/bits/a-bit)',
				'[f](https://timdeschryver.dev/blog/root-relative)',
				'[g](https://timdeschryver.dev/)',
			].join('\n'),
		);
	});

	it('leaves external links, anchors, and code blocks untouched', () => {
		const markdown = [
			'[external](https://example.com/page)',
			'[anchor](#a-heading)',
			'```ts',
			"router.navigate(['/'])[0](./not-a-link);",
			'```',
		].join('\n');

		expect(absolutizeMarkdownLinks(markdown, fileUrl)).toBe(markdown);
	});
});
