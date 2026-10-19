import { contentListItem, markdownPage, markdownResponse } from '#lib/markdown-pages.js';
import { publicUrl } from '#lib/variables.js';
import { readBits } from '../bits/_bits';

export const prerender = true;

// The Markdown version of the bits overview (src/routes/bits/+page.svelte)
export async function GET() {
	const bits = await readBits();
	const page = {
		title: 'Developer Bits - Tim Deschryver',
		description:
			"Short notes about developer tools, new .NET and Angular features, and other topics that I'm excited about.",
		canonical: publicUrl('/bits'),
	};

	return markdownResponse(
		markdownPage(
			page,
			`
# Developer Bits

Tools || (new) features || blog posts in a bit format on topics that I'm excited about.

## Bits

${bits.map(({ metadata }) => contentListItem(metadata, publicUrl(`/bits/${metadata.slug}`))).join('\n')}
`,
		),
	);
}
