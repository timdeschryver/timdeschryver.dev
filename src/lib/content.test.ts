import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_NOTE, extractFrontmatter } from './content';

function markdown(frontmatter: string[]) {
	return [
		'---',
		'title: Test',
		'slug: test',
		'date: 2024-01-01',
		...frontmatter,
		'---',
		'',
		'Body',
	].join('\n');
}

describe('AI note in frontmatter', () => {
	it('adds no note when the field is missing', () => {
		const { metadata } = extractFrontmatter(markdown([]));

		expect('ai' in metadata).toBe(false);
	});

	it('uses the default note when the field is true', () => {
		const { metadata } = extractFrontmatter(markdown(['ai: true']));

		expect(metadata.ai).toBe(DEFAULT_AI_NOTE);
	});

	it('uses the given text as the note', () => {
		const { metadata } = extractFrontmatter(
			markdown(['ai: The examples in this post were generated with AI. ']),
		);

		expect(metadata.ai).toBe('The examples in this post were generated with AI.');
	});

	it('adds no note when the field is false or empty', () => {
		expect(extractFrontmatter(markdown(['ai: false'])).metadata.ai).toBeUndefined();
		expect(extractFrontmatter(markdown(["ai: ''"])).metadata.ai).toBeUndefined();
	});
});
