import { readPosts } from '../_posts';
import fetch from 'node-fetch';

export async function get(req) {
	const posts = await readPosts();
	const post = posts.find((p) => p.metadata.slug === req.params.slug);

	if (!post) {
		return {
			status: 404,
		};
	}

	try {
		const tweetRegexp = /::https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+::/g;
		for (const tweet of post.html.match(tweetRegexp) || []) {
			const resp = await fetch(
				`https://publish.twitter.com/oembed?url=${tweet.replace(/::/g, '')}&align=center`,
			);
			const json = (await resp.json()) as { html: string };
			post.html = post.html.replace(tweet, json.html);
		}
	} catch (err) {
		console.log(err);
	}

	console.log(await getContributors(post.metadata.slug));
	return {
		body: {
			post: {
				...post,
				contributors: await getContributors(post.metadata.slug),
			},
		},
		headers: {
			'Cache-Control': `max-age=300`,
		},
	};
}

async function getContributors(slug: string) {
	return fetch(
		`https://api.github.com/repos/timdeschryver/timdeschryver.dev/commits?path=content/blog/${slug}/`,
		{
			headers: {
				Authorization: `Bearer: ${import.meta.env.VITE_GITHUB_TOKEN}`,
			},
		},
	)
		.then((res) => res.json())
		.then((commits: any) => {
			return [
				...new Map(
					commits
						.filter(
							(commit) =>
								!['timdeschryver', 'web-flow', 'dependabot[bot]'].includes(commit.author.login),
						)
						.map((commit) => {
							return [commit.author.login, commit.commit.author.name];
						}),
				),
			];
		})
		.catch(() => {
			return [];
		});
}
