import { error } from '@sveltejs/kit';
import { readPosts } from '../../_posts';
import type { PageServerLoad } from './$types';
import { execSync } from 'child_process';
import { humanDateTime, ISODate } from '$lib/formatters';
import * as fs from 'fs';
import { Client as TwitterClient } from 'twitter-api-sdk';
import { variables } from '../../../lib/variables';

const twitterClient = new TwitterClient(variables.twitterBearerToken.replace('Bearer:', '').trim());

export async function load({ params }): Promise<PageServerLoad> {
	const posts = await readPosts();
	const post = posts.find((p) => p.metadata.slug === params.slug);

	if (!post) {
		throw error(404, `Blog ${params.slug} Not found`);
	}

	let html = post.html;
	try {
		const tweetRegexp = /::https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+(.*)::/g;

		const tweets = (post.html.match(tweetRegexp) || []).map((tweet) => {
			const [tweetId] = tweet.replace(/::/g, '').split('/').reverse();
			return [tweet, tweetId];
		});

		const tweetData = await fetchTweetsInternal(tweets.map(([, tweetId]) => tweetId));

		for (const tweet of tweetData) {
			const tweetHtml = `
                <div class="tweet-preview">
                    <div class="header">
                        <img class="author-profile" src="${tweet.author.profile}" />
                        <div class="author-about">
                            <p><a class="tweet-url" href="${tweet.author.link}">${
				tweet.author.name
			}</a></p>
                            <p class="author-username">@${tweet.author.username}</p>
                        </div>
                    </div>

                    <div class="content">
                        <p class="tweet">${tweet.tweet.text}</p>
                    </div>

                    <div class="footer">
                        <p>
						<a href="${
							tweet.tweet.link
						}" class="tweet-url" rel="external" data-with-favicon style="--favicon: url(https://v1.indieweb-avatar.11ty.dev/https%3A%2F%2Ftwitter.com)"><span style="vertical-align: middle;">Open tweet</span></a>
						</p>
						
                        <p class="tweet-date">${humanDateTime(tweet.tweet.date)}</p>
                    </div>
                </div>
            `;

			const [tweetToReplace] = tweets.find(([t]) => t.includes(tweet.tweet.id));
			html = html.replace(tweetToReplace, tweetHtml);
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

async function fetchTweetsInternal(tweetIds: string[]) {
	if (!tweetIds.length) {
		return [];
	}

	const tweets = await twitterClient.tweets.findTweetsById({
		ids: tweetIds,
		'tweet.fields': ['public_metrics', 'created_at', 'author_id', 'attachments', 'entities'],
		expansions: ['attachments.media_keys'],
		'media.fields': [
			'media_key',
			'preview_image_url',
			'type',
			'url',
			'alt_text',
			'duration_ms',
			'variants',
		],
	});
	const authors = await twitterClient.users.findUsersById({
		ids: tweets.data.map((t) => t.author_id),
		'user.fields': ['name', 'username', 'url', 'profile_image_url'],
	});

	return tweets.data.map((tweet) => {
		const author = authors.data.find((author) => tweet.author_id === author.id);
		let text = tweet.text.replace(/(?:\r\n|\r|\n)/g, '<br>');

		for (const url of tweet.entities?.urls || []) {
			if (url.media_key) {
				const media = tweets.includes.media.find((m) => m.media_key === url.media_key) as any;
				if (media?.type === 'animated_gif' || media?.type === 'video') {
					text = text.replace(
						url.url,
						`
                       <video poster="${media.preview_image_url}" controls>
                            <source src="${media.variants[0].url}" type="video/mp4">
                            <object data="${media.variants[0].url}"></object>
                        </video>
                    `,
					);
				}
			} else if (url.images) {
				text = text.replace(
					url.url,
					`<a class="tweet-url" href="${url.expanded_url}">${url.display_url}</a>`,
				);
				text += `<a href="${url.expanded_url}" class="tweet-card">
                    <figure>
                        <img src="${url.images[0].url}"></img>
                        <figcaption>
                            <div>${url.title}</div> 
                            <small>${url.description}</small>
                        </figcaption>
                    </figure>
                </a>`;
			} else if (url.unwound_url) {
				text = text.replace(url.url, url.expanded_url);
			}
		}

		text = text.replace(/@[a-z0-9_]+/g, (matcher) => {
			return `<a class="tweet-url" href="https://twitter.com/${matcher.substring(
				1,
			)}" rel="nofollow">${matcher}</a>`;
		});

		text = text.replace(/#[a-z0-9_]+/g, (matcher) => {
			return `<a class="tweet-url" href="https://twitter.com/search?q=${matcher.substring(
				1,
			)}" rel="nofollow">${matcher}</a>`;
		});

		return {
			tweet: {
				text,
				id: tweet.id,
				likes: tweet.public_metrics.like_count,
				retweets: tweet.public_metrics.like_count,
				quotes: tweet.public_metrics.quote_count,
				replies: tweet.public_metrics.reply_count,
				date: tweet.created_at,
				link: `https://twitter.com/${author.username}/status/${tweet.id}`,
			},
			author: {
				name: author.name,
				username: author.username,
				profile: author.profile_image_url,
				link: `https://twitter.com/${author.username}`,
			},
		};
	});
}
