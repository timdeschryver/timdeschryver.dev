// Helpers to create the Markdown versions of the pages.
// Cloudflare serves these instead of the HTML page when an agent requests a page with `Accept: text/markdown`.
// This is done with URL Rewrite Rules (Rules > Transform Rules) that rewrite `/` to `/index.md`,
// and `/blog`, `/bits`, `/blog/{slug}`, `/bits/{slug}` to `{path}.md`, keep these in sync when adding Markdown pages.
// A Response Header Transform Rule adds `Vary: Accept` to the same pages.

type Page = { title: string; description: string; canonical: string };
type Content = { title: string; description: string; date: string; tags: string[] };

export function markdownResponse(markdown: string) {
	return new Response(markdown, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
}

export function markdownPage({ title, description, canonical }: Page, body: string) {
	// JSON strings are valid YAML strings, this escapes quotes and colons
	return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
canonical: ${canonical}
---

${body.trim()}
`;
}

export function contentListItem({ title, description, date, tags }: Content, url: string) {
	return `- [${markdownText(title)}](${url}) (${date}; ${formatTags(tags)}): ${markdownText(description)}`;
}

export function markdownText(value: string) {
	return value
		.replaceAll('\\', '\\\\')
		.replaceAll('[', '\\[')
		.replaceAll(']', '\\]')
		.replace(/\s+/g, ' ');
}

function formatTags(tags: string[]) {
	return tags.length ? `topics: ${tags.map(markdownText).join(', ')}` : 'technical note';
}
