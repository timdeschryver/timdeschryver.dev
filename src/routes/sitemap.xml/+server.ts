import { ISODate } from '$lib/formatters';
import { variables } from '../../lib/variables';
import { readPosts } from '../blog/_posts';
import { readBits } from '../bits/_bits';

export const prerender = true;

export async function GET() {
	const posts = await readPosts();
	const bits = await readBits();
	return new Response(generate(posts, bits), {
		headers: {
			'Content-Type': 'application/xml',
		},
	});
}

function generate(
	posts: Awaited<ReturnType<typeof readPosts>>,
	bits: Awaited<ReturnType<typeof readBits>>,
) {
	const date = ISODate(new Date());
	const nodes = [
		{
			loc: `${variables.basePath}`,
			priority: '1.0',
			changefreq: 'daily',
			date,
		},
		...posts.map((post) => ({
			loc: `${variables.basePath}/blog/${post.metadata.slug}`,
			priority: '1.0',
			changefreq: 'daily',
			date: ISODate(post.metadata.modified || post.metadata.date),
		})),
		...bits.map((bit) => ({
			loc: `${variables.basePath}/bits/${bit.metadata.slug}`,
			priority: '1.0',
			changefreq: 'daily',
			date: ISODate(bit.metadata.date),
		})),
		{
			loc: `${variables.basePath}/bits`,
			priority: '0.8',
			changefreq: 'daily',
			date,
		},
		{
			loc: `${variables.basePath}/blog`,
			priority: '0.6',
			changefreq: 'daily',
			date,
		},
		{
			loc: `${variables.basePath}/resources/ngrx`,
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
