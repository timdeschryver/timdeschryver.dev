import type { ContentItem } from './content';

// Shared by the MCP server and the A2A agent, which both read the content from the static site

export function formatItem(item: ContentItem) {
	const topics = item.topics.length ? `; topics: ${item.topics.join(', ')}` : '';
	return `- [${item.title}](${item.url}) (${item.type}, ${item.date}${topics}): ${item.description}`;
}

export async function fetchText(url: string): Promise<string>;
export async function fetchText(url: string, required: false): Promise<string | undefined>;
export async function fetchText(url: string, required = true) {
	// The site is static and redeployed (and purged from the cache) with every change
	const response = await fetch(url, { cf: { cacheEverything: true, cacheTtl: 3600 } });
	if (response.ok) return response.text();
	if (response.status === 404 && !required) return undefined;
	throw new Error(`Fetching ${url} failed with ${response.status}`);
}
