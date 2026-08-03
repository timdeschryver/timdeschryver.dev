import { error } from '@sveltejs/kit';
import { readPostBySlug, readPostSummaries } from '../../_posts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () =>
	(await readPostSummaries())
		.filter(({ hasTldr }) => hasTldr)
		.map(({ metadata }) => ({ slug: metadata.slug }));

export const GET: RequestHandler = async ({ params }) => {
	const post = await readPostBySlug(params.slug);
	if (!post?.tldr) {
		error(404, `TLDR for blog ${params.slug} not found`);
	}

	return new Response(post.tldr, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		},
	});
};
