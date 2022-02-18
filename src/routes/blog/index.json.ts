import { readPosts } from '../_posts';

export async function get() {
	const posts = await readPosts()
	const metadata = posts.map((p) => ({
		title: p.metadata.title,
		tldr: Boolean(p.tldr),
		description: p.metadata.description,
		slug: p.metadata.slug,
		date: p.metadata.date,
		tags: p.metadata.tags,
	}));
	const tags = Object.entries<number>(
		posts
			.map((p) => p.metadata.tags)
			.reduce((acc, tag) => [...acc, ...tag], [])
			.reduce((acc, tag) => {
				acc[tag] = (acc[tag] || 0) + 1;
				return acc;
			}, {} as { [tag: string]: number }),
	)
		.sort(([v1, c1], [v2, c2]) => c2 - c1 || v2.localeCompare(v1))
		.slice(0, 15)
		.map(([v]) => v);

	return {
		body: { metadata, tags },
		headers: {
			'Cache-Control': `max-age=300`
		},
	};
}
