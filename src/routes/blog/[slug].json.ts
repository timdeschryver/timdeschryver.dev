import { readPosts } from '../_posts';
import fetch from 'node-fetch';

export async function GET(req) {
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
		console.error(err);
	}

	const commits = await getCommits(post.metadata.slug);
	return {
		body: {
			post: {
				...post,
				contributors: [
					...new Map(
						commits
							.filter(
								(c) =>
									!['timdeschryver', 'web-flow', 'dependabot[bot]', 'imgbot[bot]'].includes(
										c.login,
									),
							)
							.map((c) => [c.login, c.name]),
					),
				],
			},
		},
		headers: {
			'Cache-Control': `max-age=300`,
		},
	};
}

async function getCommits(slug: string) {
	return fetch(
		`https://api.github.com/repos/timdeschryver/timdeschryver.dev/commits?path=blog/${slug}/index.md`,
		{
			headers: {
				Authorization: `Bearer: ${import.meta.env.VITE_PUBLIC_GITHUB_TOKEN}`,
			},
		},
	)
		.then((res) => {
			return res.json();
		})
		.then((commits: any) => {
			return commits.map((commit) => {
				return {
					login: commit.author?.login ?? (commit.commit.author.login || commit.commit.author.name),
					name: commit.commit.author.name,
				};
			});
		})
		.catch(() => {
			return [];
		});
}
