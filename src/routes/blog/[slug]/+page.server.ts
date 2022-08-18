import { error } from '@sveltejs/kit';
import { readPosts } from '../../_posts';
import type { PageServerLoad } from './$types';
import { execSync } from 'child_process';
import { ISODate } from '../../../lib/formatters';
import fs from 'fs';

export async function load({ params }): Promise<PageServerLoad> {
	const posts = await readPosts();
	const post = posts.find((p) => p.metadata.slug === params.slug);

	if (!post) {
		throw error(404, `Blog ${params.slug} Not found`);
	}

	let html = post.html;
	try {
		const tweetRegexp = /::https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+(.*)::/g;

		for (const tweet of post.html.match(tweetRegexp) || []) {
			const resp = await fetch(
				`https://publish.twitter.com/oembed?url=${tweet.replace(/::/g, '')}&align=center`,
			);
			const json = (await resp.json()) as { html: string };
			html = html.replace(tweet, json.html);
		}
	} catch (err) {
		console.error(err);
	}

	const contributors = getContributors(post.metadata.slug);
	const modifiedDate = getLastModifiedDate(post.metadata.slug);

	return {
		post: {
			...post,
			html,
			metadata: {
				...post.metadata,
				modified: ISODate(modifiedDate),
			},
			contributors,
		},
	};
}

function getLastModifiedDate(slug: string) {
	const buffer = execSync(`git log -1 --format=%ci ./blog/${slug}/index.md`);
	if (!buffer) {
		return null;
	}

	return buffer.toString().trim();
}

function getContributors(slug: string) {
	const contributors = `./blog/${slug}/contributors.json`;

	try {
		if (fs.existsSync(contributors)) {
			const content = fs.readFileSync(contributors, 'utf8');
			return JSON.parse(content);
		}
	} catch (err) {
		console.error(err);
	}

	return [];
}
