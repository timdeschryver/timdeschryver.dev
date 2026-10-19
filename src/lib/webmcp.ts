import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { publicUrl } from '#lib/variables.js';

// Exposes the site's actions as tools to AI agents in the browser, see https://webmachinelearning.github.io/webmcp/
// The API moved from navigator.modelContext to document.modelContext, browsers can expose either one

interface ModelContextTool {
	name: string;
	title?: string;
	description: string;
	inputSchema?: object;
	annotations?: { readOnlyHint?: boolean };
	execute: (input: ToolInput, options?: { signal?: AbortSignal }) => Promise<unknown>;
}

interface ModelContext {
	registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): Promise<void> | void;
}

type ToolInput = Record<string, unknown> | undefined;
type ContentType = 'blog' | 'bit';
type ContentSummary = {
	title: string;
	slug: string;
	description: string;
	date: string;
	tags: string[];
};

const slugPattern = /^[\w-]+$/;
let contentIndex: Promise<{ posts: ContentSummary[]; bits: ContentSummary[] }> | undefined;

const tools: ModelContextTool[] = [
	{
		name: 'search_content',
		title: 'Search articles',
		description:
			"Search Tim Deschryver's blog posts and developer bits (short technical notes) about .NET, Angular, testing, AI-assisted development, and developer tooling. Every keyword must match a tag, or be part of the title or description. Returns the matches, newest first.",
		inputSchema: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description:
						'Space-separated keywords, e.g. "angular testing". Leave it empty to list everything.',
				},
				type: {
					type: 'string',
					enum: ['all', 'blog', 'bit'],
					description: 'The kind of content to search, defaults to all',
				},
				from: {
					type: 'string',
					format: 'date',
					description: 'Only include content published on or after this date (YYYY-MM-DD)',
				},
				to: {
					type: 'string',
					format: 'date',
					description: 'Only include content published on or before this date (YYYY-MM-DD)',
				},
				limit: {
					type: 'integer',
					minimum: 1,
					maximum: 100,
					description: 'The maximum number of results, defaults to 10',
				},
			},
			additionalProperties: false,
		},
		annotations: { readOnlyHint: true },
		execute: async (input) => searchContent(input ?? {}),
	},
	{
		name: 'get_content',
		title: 'Read an article',
		description:
			'Get the full Markdown (including its front matter) of a blog post or developer bit. Omit the type and slug to read the blog post or bit that is currently open.',
		inputSchema: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
					enum: ['blog', 'bit'],
					description: 'The kind of content',
				},
				slug: {
					type: 'string',
					pattern: slugPattern.source,
					description: 'The slug of the blog post or bit, as returned by search_content',
				},
			},
			additionalProperties: false,
		},
		annotations: { readOnlyHint: true },
		execute: async (input, options) => getContent(input ?? {}, options?.signal),
	},
	{
		name: 'navigate',
		title: 'Open a page',
		description:
			'Open a page of timdeschryver.dev in the browser: the home page (author profile), the blog overview (optionally filtered with a search query), the developer bits overview, or a specific blog post or bit.',
		inputSchema: {
			type: 'object',
			properties: {
				page: {
					type: 'string',
					enum: ['home', 'blog', 'bits', 'blog-post', 'bit'],
					description: 'The page to open',
				},
				slug: {
					type: 'string',
					pattern: slugPattern.source,
					description:
						'The slug of the blog post or bit to open, required for the "blog-post" and "bit" pages',
				},
				query: {
					type: 'string',
					description: 'Keywords to filter the blog overview with, only used for the "blog" page',
				},
			},
			required: ['page'],
			additionalProperties: false,
		},
		execute: async (input) => navigate(input ?? {}),
	},
];

export function registerWebMcpTools(signal: AbortSignal) {
	const modelContext =
		(document as Document & { modelContext?: ModelContext }).modelContext ??
		(navigator as Navigator & { modelContext?: ModelContext }).modelContext;
	if (!modelContext) return;

	for (const tool of tools) {
		void registerTool(modelContext, tool, signal);
	}
}

async function registerTool(
	modelContext: ModelContext,
	tool: ModelContextTool,
	signal: AbortSignal,
) {
	try {
		await modelContext.registerTool(tool, { signal });
	} catch (error) {
		console.error(`Failed to register the WebMCP tool "${tool.name}".`, error);
	}
}

async function searchContent(input: Record<string, unknown>) {
	const { posts, bits } = await loadContentIndex();
	const type = input.type === 'blog' || input.type === 'bit' ? input.type : 'all';
	const keywords = text(input.query).toLowerCase().split(/\s+/).filter(Boolean);
	const from = Date.parse(text(input.from));
	const to = Date.parse(text(input.to));
	const limit =
		typeof input.limit === 'number' ? Math.min(Math.max(Math.trunc(input.limit), 1), 100) : 10;

	const content = [
		...(type === 'bit' ? [] : posts.map((post) => ({ type: 'blog' as const, ...post }))),
		...(type === 'blog' ? [] : bits.map((bit) => ({ type: 'bit' as const, ...bit }))),
	];
	const matches = content
		.filter((item) => {
			const date = Date.parse(item.date);
			return (
				matchesKeywords(item, keywords) &&
				(Number.isNaN(from) || date >= from) &&
				(Number.isNaN(to) || date <= to)
			);
		})
		.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

	return {
		total: matches.length,
		results: matches.slice(0, limit).map((item) => ({
			...item,
			url: publicUrl(contentPath(item.type, item.slug)),
			markdownUrl: publicUrl(markdownPath(item.type, item.slug)),
		})),
	};
}

async function getContent(input: Record<string, unknown>, signal?: AbortSignal) {
	const { type, slug } = input.type || input.slug ? contentInput(input) : currentContent();
	const response = await fetch(markdownPath(type, slug), { signal });
	if (!response.ok) {
		throw new Error(
			response.status === 404
				? `There is no ${type === 'blog' ? 'blog post' : 'bit'} with the slug "${slug}".`
				: `Failed to load "${slug}" (${response.status}).`,
		);
	}

	return {
		type,
		slug,
		url: publicUrl(contentPath(type, slug)),
		markdown: await response.text(),
	};
}

async function navigate(input: Record<string, unknown>) {
	const query = text(input.query);
	switch (input.page) {
		case 'home':
			await goto(resolve('/'));
			break;
		case 'blog':
			await goto(resolve(query ? `/blog?q=${encodeURIComponent(query)}` : '/blog'));
			break;
		case 'bits':
			await goto(resolve('/bits'));
			break;
		case 'blog-post':
			await goto(resolve('/blog/[slug]', { slug: slugInput(input.slug) }));
			break;
		case 'bit':
			await goto(resolve('/bits/[slug]', { slug: slugInput(input.slug) }));
			break;
		default:
			throw new Error('The page must be one of "home", "blog", "bits", "blog-post", or "bit".');
	}

	return { url: location.href, title: document.title };
}

function loadContentIndex() {
	contentIndex ??= fetch(resolve('/content.json'))
		.then((response) => {
			if (!response.ok) {
				throw new Error(`Failed to load the content index (${response.status}).`);
			}
			return response.json();
		})
		.catch((error) => {
			// retry on the next call
			contentIndex = undefined;
			throw error;
		});
	return contentIndex;
}

function matchesKeywords({ title, description, tags }: ContentSummary, keywords: string[]) {
	const lowerTitle = title.toLowerCase();
	const lowerDescription = description.toLowerCase();
	const lowerTags = tags.map((tag) => tag.toLowerCase());

	return keywords.every(
		(keyword) =>
			lowerTags.includes(keyword) ||
			lowerTitle.includes(keyword) ||
			lowerDescription.includes(keyword),
	);
}

function contentInput(input: Record<string, unknown>): { type: ContentType; slug: string } {
	if (input.type !== 'blog' && input.type !== 'bit') {
		throw new Error('The type must be "blog" or "bit".');
	}
	return { type: input.type, slug: slugInput(input.slug) };
}

function slugInput(value: unknown) {
	const slug = text(value);
	if (!slugPattern.test(slug)) {
		throw new Error('A valid slug is required, use search_content to find it.');
	}
	return slug;
}

function currentContent(): { type: ContentType; slug: string } {
	const [, section, slug] = location.pathname.match(/^\/(blog|bits)\/([\w-]+)\/?$/) ?? [];
	if (!section || !slug) {
		throw new Error('No blog post or bit is open, pass the type and slug of the content to read.');
	}
	return { type: section === 'blog' ? 'blog' : 'bit', slug };
}

function contentPath(type: ContentType, slug: string) {
	return type === 'blog' ? resolve('/blog/[slug]', { slug }) : resolve('/bits/[slug]', { slug });
}

function markdownPath(type: ContentType, slug: string) {
	return type === 'blog'
		? resolve('/blog/[slug].md', { slug })
		: resolve('/bits/[slug].md', { slug });
}

function text(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}
