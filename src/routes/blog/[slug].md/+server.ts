import { error } from '@sveltejs/kit';
import * as fs from 'node:fs';
import { absolutizeMarkdownLinks } from '#lib/markdown-links.js';
import { publicUrl } from '#lib/variables.js';
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

	const markdown = fs.readFileSync(filePath, 'utf-8');
	return new Response(absolutizeMarkdownLinks(markdown, publicUrl(filePath)), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
};
