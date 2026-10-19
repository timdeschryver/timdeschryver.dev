import { contentListItem, markdownPage, markdownResponse } from '#lib/markdown-pages.js';
import { publicUrl } from '#lib/variables.js';
import { readPostSummaries } from '../blog/_posts';

export const prerender = true;

// The Markdown version of the blog overview (src/routes/blog/+page.svelte)
export async function GET() {
	const posts = await readPostSummaries();
	const page = {
		title: 'Blog - Tim Deschryver',
		description: `${posts.length} articles about .NET, Angular, testing, and developer tooling.`,
		canonical: publicUrl('/blog'),
	};

	return markdownResponse(
		markdownPage(
			page,
			`
# Notes from building software

Practical ideas, experiments, and lessons learned while working with .NET, Angular, and the tools around them.

## Articles

${posts.map(({ metadata }) => contentListItem(metadata, publicUrl(`/blog/${metadata.slug}`))).join('\n')}
`,
		),
	);
}
