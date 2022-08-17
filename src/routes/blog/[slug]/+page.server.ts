import { error } from '@sveltejs/kit';
import { readPosts } from '../../_posts';
import type { PageServerLoad } from './$types';
import { execSync } from 'child_process';
import { ISODate } from '../../../lib/formatters';
import { chromium } from 'playwright';

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

	const contributors = await getAuthors(post.metadata.slug);
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

async function getAuthors(slug: string) {
	const buffer = execSync(`git log --follow --format=%an ./blog/${slug}/index.md`);
	if (!buffer) {
		return [];
	}

	const gitAuthors = buffer
		.toString()
		.trim()
		.split('\n')
		.filter((a) => !a.toLowerCase().includes('deschryver'));
	if (gitAuthors.length === 0) {
		return [];
	}

	const browser = await chromium.launch({ headless: false });
	try {
		const page = await browser.newPage();
		await page.goto(
			`https://github.com/timdeschryver/timdeschryver.dev/commits/main/blog/${slug}/index.md`,
			{ waitUntil: 'networkidle' },
		);
		const authorsMap = new Map<string, string>();

		while (await page.locator('text=End of commit history for this file').isHidden()) {
			await page.waitForNavigation({ waitUntil: 'networkidle' });
			const authors = await page.locator('a.commit-author').elementHandles();

			for (const author of authors) {
				try {
					const username = await author.textContent();
					if (
						[
							'timdeschryver',
							'Tim Deschryver',
							'web-flow',
							'dependabot[bot]',
							'imgbot[bot]',
						].includes(username)
					) {
						continue;
					}

					if (authorsMap.has(username)) {
						continue;
					}

					const userPage = await browser.newPage();
					await userPage.goto(`https://github.com/${username}`);

					const name = await userPage.locator('.p-name').innerText();
					authorsMap.set(username, name);
					await userPage.close();
				} catch (err) {
					console.error(err);
				}

				await page.locator('text=/Browse History/i').last().click();
			}
		}

		await browser.close();
		return [...authorsMap.entries()];
	} catch (err) {
		console.error(err);
		await browser.close();
		return [];
	}
}
