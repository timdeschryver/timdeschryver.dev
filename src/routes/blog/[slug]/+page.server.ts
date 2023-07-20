import { error } from '@sveltejs/kit';
import { readPosts } from '../_posts';
import type { PageServerLoad } from './$types';
import { execSync } from 'child_process';
import { ISODate } from '$lib/formatters';
import * as fs from 'fs';

// const twitterClient = new TwitterClient(variables.twitterBearerToken.replace('Bearer:', '').trim());
export async function load({ params }): Promise<PageServerLoad> {
	const posts = await readPosts();
	const post = posts.find((p) => p.metadata.slug === params.slug);

	if (!post) {
		throw error(404, `Blog ${params.slug} Not found`);
	}

	const html = post.html;
	// try {
	// 	const tweetRegexp = /::https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+(.*)::/g;

	// 	const tweets = (post.html.match(tweetRegexp) || []).map((tweet) => {
	// 		const [tweetId] = tweet.replace(/::/g, '').split('/').reverse();
	// 		return [tweet, tweetId];
	// 	});

	// 	const tweetData = await fetchTweetsInternal(tweets.map(([, tweetId]) => tweetId));

	// 	for (const tweet of tweetData) {
	// 		const tweetHtml = `
	// 			<div class="tweet-preview">
	// 				<div class="header">
	// 					<img class="author-profile" src="${tweet.author.profile}" />
	// 					<div class="author-about">
	// 						<p><a class="tweet-url" href="${tweet.author.link}">${tweet.author.name}</a></p>
	// 						<p class="author-username">@${tweet.author.username}</p>
	// 					</div>
	// 				</div>

	// 				<div class="content">
	// 					<p class="tweet">${tweet.tweet.text}</p>
	// 				</div>

	// 				<div class="footer">
	// 					<p>
	// 					<a href="${
	// 						tweet.tweet.link
	// 					}" class="tweet-url" rel="external" data-with-favicon style="--favicon: url(https://v1.indieweb-avatar.11ty.dev/https%3A%2F%2Ftwitter.com)"><span style="vertical-align: middle;">Open tweet</span></a>
	// 					</p>

	// 					<p class="tweet-date">${humanDateTime(tweet.tweet.date)}</p>
	// 				</div>
	// 			</div>
	//         `;

	// 		const [tweetToReplace] = tweets.find(([t]) => t.includes(tweet.tweet.id));
	// 		html = html.replace(tweetToReplace, tweetHtml);
	// 	}
	// } catch (err) {
	// 	console.error(err);
	// }

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
