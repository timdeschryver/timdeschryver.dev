import { ISODate } from '$lib/formatters';
import { readPosts } from '../_posts';

export async function GET() {
	const posts = await readPosts();
	return new Response(generate(posts), {
		headers: {
			'Content-Type': 'application/xml',
		},
	});
}

function generate(posts: Awaited<ReturnType<typeof readPosts>>) {
	const date = ISODate(new Date());
	const nodes = [
		{
			loc: `${import.meta.env.VITE_PUBLIC_BASE_PATH}`,
			priority: '1.0',
			changefreq: 'daily',
			date,
		},
		...posts.map((post) => ({
			loc: `${import.meta.env.VITE_PUBLIC_BASE_PATH}/blog/${post.metadata.slug}`,
			priority: '1.0',
			changefreq: 'daily',
			date: ISODate(post.metadata.modified),
		})),
		{
			loc: `${import.meta.env.VITE_PUBLIC_BASE_PATH}/blog`,
			priority: '0.6',
			changefreq: 'daily',
			date,
		},
		{
			loc: `${import.meta.env.VITE_PUBLIC_BASE_PATH}/snippets`,
			priority: '0.4',
			changefreq: 'weekly',
			date,
		},
		{
			loc: `${import.meta.env.VITE_PUBLIC_BASE_PATH}/resources/ngrx`,
			priority: '0.2',
			changefreq: 'monthly',
			date,
		},
	];

	const urlNodes = nodes
		.map((node) => {
			return `
				<url>
					<loc>${node.loc}</loc>
					<priority>${node.priority}</priority>
					<changefreq>${node.changefreq}</changefreq>
					<lastmod>${node.date}</lastmod>
				</url>
			`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
		xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
		xmlns:xhtml="http://www.w3.org/1999/xhtml"
		xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
		xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
		xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
		${urlNodes}
		</urlset>`;
	return xml.trim();
}
