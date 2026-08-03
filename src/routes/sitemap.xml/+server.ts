import { ISODate } from '$lib/formatters';
import { variables } from '../../lib/variables';
import { readPosts } from '../blog/_posts';
import { readBits } from '../bits/_bits';
import { execFileSync } from 'node:child_process';

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
	const latestPostDate = latestDate(
		posts.map((post) => post.metadata.modified || post.metadata.date),
	);
	const latestBitDate = latestDate(bits.map((bit) => bit.metadata.date));
	const latestContentDate = latestDate([latestPostDate, latestBitDate]);
	const nodes = [
		{
			loc: `${variables.basePath}`,
			date: latestDate([latestContentDate, gitLastModified('src/routes/+page.svelte')]),
		},
		...posts.map((post) => ({
			loc: `${variables.basePath}/blog/${post.metadata.slug}`,
			date: ISODate(post.metadata.modified || post.metadata.date),
		})),
		...bits.map((bit) => ({
			loc: `${variables.basePath}/bits/${bit.metadata.slug}`,
			date: ISODate(bit.metadata.date),
		})),
		{
			loc: `${variables.basePath}/bits`,
			date: latestBitDate,
		},
		{
			loc: `${variables.basePath}/blog`,
			date: latestPostDate,
		},
	];

	const urlNodes = nodes
		.map((node) => {
			return `
				<url>
					<loc>${node.loc}</loc>
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

function latestDate(dates: (string | null | undefined)[]) {
	return (
		dates
			.filter((date): date is string => Boolean(date))
			.sort()
			.at(-1) || ISODate(new Date())
	);
}

function gitLastModified(filePath: string) {
	try {
		const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', filePath], {
			encoding: 'utf-8',
		}).trim();
		return date ? ISODate(date) : null;
	} catch {
		return null;
	}
}
