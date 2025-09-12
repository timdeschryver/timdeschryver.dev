import { TAG_COLORS, orderTags, readPostsMetadata } from './_posts';

export async function load() {
	const postsMetadata = await readPostsMetadata();
	const metadata = postsMetadata.map((p) => ({
		title: p.metadata.title,
		tldr: p.tldr,
		description: p.metadata.description,
		slug: p.metadata.slug,
		date: p.metadata.date,
		tags: p.metadata.tags,
		color: p.metadata.tags
			.map((t) => TAG_COLORS[t.toLowerCase()])
			.find(Boolean)
			?.toLowerCase(),
		series: p.metadata.series
			? {
					name: p.metadata.series.name,
					order: p.metadata.seriesPosts?.find((sp) => sp.current)?.order || 1,
					total: p.metadata.seriesPosts?.length || 1,
				}
			: undefined,
	}));
	const tags = orderTags(postsMetadata.flatMap((m) => m.metadata.tags));
	return { posts: metadata, tags };
}
