import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import fm from 'front-matter';
import { standardSite, documentRkey } from './standard-site.js';

// https://atproto.com/specs/tid
const TID = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

describe('standard-site record keys', () => {
	test('publication rkey is a valid TID', () => {
		expect(standardSite.publicationRkey).toMatch(TID);
	});

	test('document rkey is deterministic across date representations of the same day', () => {
		expect(documentRkey('some-post', '2019-10-03T13:00:00.000Z')).toBe(
			documentRkey('some-post', '2019-10-03'),
		);
	});

	test('same-day posts with different slugs get different rkeys', () => {
		expect(documentRkey('post-one', '2019-10-03')).not.toBe(documentRkey('post-two', '2019-10-03'));
	});

	test('every blog post maps to a unique, valid TID', () => {
		const posts = readdirSync('./blog')
			.map((slug) => ({ slug, path: join('./blog', slug, 'index.md') }))
			.filter(({ path }) => existsSync(path))
			.map(({ slug, path }) => {
				const { attributes } = fm<{ date: string }>(readFileSync(path, 'utf-8'));
				return { slug, rkey: documentRkey(slug, attributes.date) };
			});

		expect(posts.length).toBeGreaterThan(200);
		for (const { rkey } of posts) {
			expect(rkey).toMatch(TID);
		}
		expect(new Set(posts.map(({ rkey }) => rkey)).size).toBe(posts.length);
	});
});
