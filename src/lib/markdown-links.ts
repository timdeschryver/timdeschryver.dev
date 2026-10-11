const codeFence = /^\s*(```|~~~)/;
const localLink = /\]\((\.{1,2}\/[^\s)]*|\/[^\s)]*)/g;

/**
 * Rewrites local links and images to absolute URLs, so they keep working when the Markdown file
 * is served on its own (e.g. `/blog/<slug>.md`) instead of from its own folder.
 */
export function absolutizeMarkdownLinks(markdown: string, fileUrl: string): string {
	let inCodeBlock = false;

	return markdown
		.split('\n')
		.map((line) => {
			if (codeFence.test(line)) {
				inCodeBlock = !inCodeBlock;
				return line;
			}

			return inCodeBlock
				? line
				: line.replace(localLink, (_, target: string) => `](${resolveLink(target, fileUrl)}`);
		})
		.join('\n');
}

function resolveLink(target: string, fileUrl: string) {
	const url = new URL(target, fileUrl);
	url.pathname = url.pathname
		.replace(/\/index\.md$/, '')
		.replace(/(.)\/$/, '$1')
		// Images are published as WebP, the same as in the rendered HTML
		.replace(/\.(png|jpg|jpeg)$/, '.webp');
	return url.toString();
}
