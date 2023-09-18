import { orderTags, readPosts } from './_posts';

/** @type {import('./$types').PageLoad} */
export async function load() {
	const posts = await readPosts();
	const metadata = posts.map((p) => ({
		title: p.metadata.title,
		tldr: Boolean(p.tldr),
		description: p.metadata.description,
		slug: p.metadata.slug,
		date: p.metadata.date,
		tags: p.metadata.tags,
	}));
	const tags = orderTags(posts.flatMap((m) => m.metadata.tags));
	return { metadata, tags };
}
