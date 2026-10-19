// Reads the content index from the site's llms.txt
// Keep this module free of dependencies, the site's unit tests import it to verify the llms.txt format

export type ContentType = 'blog' | 'bit';

export type ContentItem = {
	type: ContentType;
	slug: string;
	title: string;
	url: string;
	markdownUrl: string;
	date: string;
	topics: string[];
	description: string;
};

export type ContentQuery = {
	query?: string;
	type?: ContentType;
	topic?: string;
	limit?: number;
};

const sections: Record<string, ContentType> = {
	'Blog posts': 'blog',
	'Developer bits': 'bit',
};

// Matches the list items written by contentListItem (src/lib/markdown-pages.ts)
const itemPattern =
	/^- \[(?<title>(?:\\.|[^\\\]])+)\]\((?<markdownUrl>[^)\s]+\.md)\) \((?<date>\d{4}-\d{2}-\d{2}); (?:topics: (?<topics>[^)]*)|technical note)\): (?<description>.*)$/;

const contentPathPattern = /^\/(?<section>blog|bits)\/(?<slug>[\w-]+?)(?:\.md)?\/?$/;

export function parseContentIndex(llmsTxt: string): ContentItem[] {
	const items: ContentItem[] = [];
	let type: ContentType | undefined;

	for (const line of llmsTxt.split('\n')) {
		if (line.startsWith('## ')) {
			type = sections[line.slice(3).trim()];
			continue;
		}

		const groups = type && itemPattern.exec(line)?.groups;
		const path = groups && contentPath(groups.markdownUrl);
		if (!type || !groups || !path) continue;

		items.push({
			type,
			slug: path.slug,
			title: unescape(groups.title),
			url: groups.markdownUrl.replace(/\.md$/, ''),
			markdownUrl: groups.markdownUrl,
			date: groups.date,
			topics: groups.topics ? groups.topics.split(', ').map(unescape) : [],
			description: unescape(groups.description),
		});
	}

	return items;
}

export function searchContent(
	items: ContentItem[],
	{ query, type, topic, limit = 10 }: ContentQuery,
) {
	const terms = query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

	return items
		.filter((item) => !type || item.type === type)
		.filter((item) => !topic || item.topics.some((t) => t.toLowerCase() === topic.toLowerCase()))
		.map((item) => ({ item, score: score(item, terms) }))
		.filter(({ score }) => terms.length === 0 || score > 0)
		.sort((a, b) => b.score - a.score || b.item.date.localeCompare(a.item.date))
		.slice(0, limit)
		.map(({ item }) => item);
}

// Resolves a canonical or Markdown URL (or path) of a blog post or bit to the path of its Markdown version
// Returns undefined for other URLs, so only the site's content is fetched
export function markdownPath(urlOrPath: string, siteUrl: string) {
	let url: URL;
	try {
		url = new URL(urlOrPath, siteUrl);
	} catch {
		return undefined;
	}

	if (url.host !== new URL(siteUrl).host) return undefined;
	const path = contentPath(url.href);
	return path && `/${path.section}/${path.slug}.md`;
}

function contentPath(url: string) {
	const groups = contentPathPattern.exec(new URL(url).pathname)?.groups;
	return groups && { section: groups.section, slug: groups.slug };
}

// Title matches weigh more than topic matches, which weigh more than description matches
function score(item: ContentItem, terms: string[]) {
	const title = item.title.toLowerCase();
	const topics = item.topics.map((t) => t.toLowerCase());
	const description = item.description.toLowerCase();

	return terms.reduce(
		(total, term) =>
			total +
			(title.includes(term) ? 3 : 0) +
			(topics.some((t) => t.includes(term)) ? 2 : 0) +
			(description.includes(term) ? 1 : 0),
		0,
	);
}

// Reverts the escaping of markdownText (src/lib/markdown-pages.ts)
function unescape(value: string) {
	return value.replace(/\\(.)/g, '$1');
}
