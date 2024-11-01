import { TAG_COLORS, orderTags, readPosts } from './_posts';

export async function load() {
	const posts = await readPosts();
	const metadata = posts.map((p) => ({
		title: p.metadata.title,
		tldr: Boolean(p.tldr),
		description: p.metadata.description,
		slug: p.metadata.slug,
		date: p.metadata.date,
		tags: p.metadata.tags,
		color: p.metadata.tags
			.map((t) => TAG_COLORS[t.toLowerCase()])
			.find(Boolean)
			?.toLowerCase(),
	}));
	const tags = orderTags(posts.flatMap((m) => m.metadata.tags));
	return { posts: metadata, tags };
}
