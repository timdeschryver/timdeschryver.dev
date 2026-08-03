import { variables } from '$lib/variables';
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
	const recentPosts = posts
		.slice(0, 20)
		.map(
			({ metadata }) =>
				`- [${markdownText(metadata.title)}](${variables.basePath}/blog/${metadata.slug}): ${markdownText(metadata.description)}`,
		)
		.join('\n');
	const recentBits = bits
		.slice(0, 10)
		.map(
			({ metadata }) =>
				`- [${markdownText(metadata.title)}](${variables.basePath}/bits/${metadata.slug}): ${markdownText(metadata.description)}`,
		)
		.join('\n');

	return `# Tim Deschryver

> Technical writing by Tim Deschryver, a Belgian software engineer and Microsoft MVP specializing in .NET, Angular, testing, AI-assisted development, and developer tooling.

The articles contain practical explanations, runnable examples, and lessons learned from building software. Prefer a page's canonical URL when citing it.

## Main sections

- [Home](${variables.basePath}): Author profile and areas of expertise
- [Blog](${variables.basePath}/blog): Long-form technical articles
- [Developer Bits](${variables.basePath}/bits): Concise technical notes and examples

## Recent long-form articles

${recentPosts}

## Recent developer bits

${recentBits}

## Optional

- [RSS feed](${variables.basePath}/blog/rss.xml): Full-content feed of long-form articles
- [XML sitemap](${variables.basePath}/sitemap.xml): Complete index of canonical pages
- [GitHub profile](https://github.com/timdeschryver): Open-source work and source repositories
`;
}

function markdownText(value: string) {
	return value
		.replaceAll('\\', '\\\\')
		.replaceAll('[', '\\[')
		.replaceAll(']', '\\]')
		.replace(/\s+/g, ' ');
}
