import { error } from '@sveltejs/kit';
import { TAG_COLORS, readPostBySlug } from '../_posts';
import * as fs from 'fs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const post = await readPostBySlug(params.slug);
	if (!post) {
		error(404, `Blog ${params.slug} Not found`);
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
	return {
		post: {
			html,
			hasTldr: Boolean(post.tldr),
			metadata: {
				...post.metadata,
				toc: post.metadata.toc.filter(({ level }) => level < 4),
				color: post.metadata.tags
					.map((t) => TAG_COLORS[t.toLowerCase()])
					.find(Boolean)
					?.toLowerCase(),
				logos: post.metadata.tags
					.map((tag) => {
						switch (tag.toLowerCase()) {
							case 'dotnet':
							case '.net':
								return { src: 'dotnet.svg', alt: 'The .NET logo' };
							case 'angular':
								return { src: 'angular.png', alt: 'The Angular logo' };
							case 'playwright':
								return { src: 'playwright.svg', alt: 'The Playwright logo' };
							case 'ngrx':
								return { src: 'ngrx.svg', alt: 'The NgRx logo' };
							case 'azure':
								return { src: 'azure.svg', alt: 'The Azure logo' };
							case 'zod':
								return { src: 'zod.svg', alt: 'The zod logo' };
							case 'angular testing library':
								return { src: 'atl.svg', alt: 'The Angular Testing Library logo' };
							default:
								return null;
						}
					})
					.filter((logo): logo is { src: string; alt: string } => logo !== null),
				edit: `https://github.com/timdeschryver/timdeschryver.dev/tree/main/blog/${post.metadata.slug}/index.md`,
			},
			contributors,
		},
	};
};

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
