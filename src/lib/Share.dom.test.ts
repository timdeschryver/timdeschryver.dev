// @vitest-environment jsdom
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Share from './Share.svelte';

describe('Share', () => {
	it('encodes text and URLs as query parameters', () => {
		render(Share, {
			text: 'C# & Svelte',
			url: 'https://example.com/article?a=1&b=2',
			title: 'Share this',
		});

		const bluesky = new URL(
			screen.getByRole('link', { name: 'Bluesky' }).getAttribute('href') ?? '',
		);
		const twitter = new URL(
			screen.getByRole('link', { name: 'Twitter' }).getAttribute('href') ?? '',
		);
		const linkedIn = new URL(
			screen.getByRole('link', { name: 'LinkedIn' }).getAttribute('href') ?? '',
		);

		expect(bluesky.searchParams.get('text')).toBe(
			'C# & Svelte https://example.com/article?a=1&b=2',
		);
		expect(twitter.searchParams.get('text')).toBe('C# & Svelte');
		expect(twitter.searchParams.get('url')).toBe('https://example.com/article?a=1&b=2');
		expect(linkedIn.searchParams.get('url')).toBe('https://example.com/article?a=1&b=2');
	});
});
