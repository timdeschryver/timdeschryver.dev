import { error } from '@sveltejs/kit';
import * as fs from 'node:fs';
import { readPostSummaries } from '../_posts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
	const posts = await readPostSummaries();
	return posts.map((post) => ({ slug: post.metadata.slug }));
};

export const GET: RequestHandler = ({ params }) => {
	const filePath = `blog/${params.slug}/index.md`;
	if (!/^[\w-]+$/.test(params.slug) || !fs.existsSync(filePath)) {
		error(404, `Blog ${params.slug} Not found`);
	}

	return new Response(fs.readFileSync(filePath, 'utf-8'), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
};
