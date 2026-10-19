import { contentListItem } from '#lib/markdown-pages.js';
import { publicUrl } from '#lib/variables.js';
import { readBits } from '../bits/_bits';
import { readPostSummaries } from '../blog/_posts';

export const prerender = true;

export async function GET() {
	const [posts, bits] = await Promise.all([readPostSummaries(), readBits()]);
	const content = generate(posts, bits);

	return new Response(content, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}

function generate(
	posts: Awaited<ReturnType<typeof readPostSummaries>>,
	bits: Awaited<ReturnType<typeof readBits>>,
) {
	const allPosts = posts
		.map(({ metadata }) => contentListItem(metadata, publicUrl(`/blog/${metadata.slug}.md`)))
		.join('\n');
	const allBits = bits
		.map(({ metadata }) => contentListItem(metadata, publicUrl(`/bits/${metadata.slug}.md`)))
		.join('\n');

	return `# Tim Deschryver

> Technical writing by Tim Deschryver, a Belgian software engineer and Microsoft MVP specializing in .NET, Angular, testing, AI-assisted development, and developer tooling.

The articles contain practical explanations, runnable examples, and lessons learned from building software. Every page is available as plain Markdown by requesting it with the \`Accept: text/markdown\` header, and every article also by appending \`.md\` to its URL; the links below point to the Markdown versions. Prefer a page's canonical URL (the same link without the \`.md\` suffix) when citing it.

## Main sections

- [Home](${publicUrl()}): Author profile, credentials, and areas of expertise
- [Blog](${publicUrl('/blog')}): Long-form technical articles
- [Developer Bits](${publicUrl('/bits')}): Concise technical notes and examples

## Blog posts

${allPosts}

## Developer bits

${allBits}

## Optional

- [RSS feed](${publicUrl('/blog/rss.xml')}): Full-content feed of long-form articles
- [XML sitemap](${publicUrl('/sitemap.xml')}): Complete index of canonical pages
- [GitHub profile](https://github.com/timdeschryver): Open-source work and source repositories
`;
}
