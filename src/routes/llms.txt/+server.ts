import { publicUrl } from '$lib/variables';
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
		.map(
			({ metadata }) =>
				`- [${markdownText(metadata.title)}](${publicUrl(`/blog/${metadata.slug}.md`)}) (${metadata.date}; ${formatTags(metadata.tags)}): ${markdownText(metadata.description)}`,
		)
		.join('\n');
	const allBits = bits
		.map(
			({ metadata }) =>
				`- [${markdownText(metadata.title)}](${publicUrl(`/bits/${metadata.slug}.md`)}) (${metadata.date}; ${formatTags(metadata.tags)}): ${markdownText(metadata.description)}`,
		)
		.join('\n');

	return `# Tim Deschryver

> Technical writing by Tim Deschryver, a Belgian software engineer and Microsoft MVP specializing in .NET, Angular, testing, AI-assisted development, and developer tooling.

The articles contain practical explanations, runnable examples, and lessons learned from building software. Every article is available as plain Markdown by appending \`.md\` to its URL; the links below point to the Markdown versions. Prefer a page's canonical URL (the same link without the \`.md\` suffix) when citing it.

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

function markdownText(value: string) {
	return value
		.replaceAll('\\', '\\\\')
		.replaceAll('[', '\\[')
		.replaceAll(']', '\\]')
		.replace(/\s+/g, ' ');
}

function formatTags(tags: string[]) {
	return tags.length ? `topics: ${tags.map(markdownText).join(', ')}` : 'technical note';
}
