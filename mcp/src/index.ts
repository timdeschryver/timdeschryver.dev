import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { z } from 'zod';
import { handleA2ARequest } from './a2a';
import { markdownPath, parseContentIndex, searchContent } from './content';
import { serverCard, serverCardMediaType, serverInfo } from './server-card';
import { fetchText, formatItem } from './site';

interface Env {
	SITE_URL: string;
}

// A stateless, read-only MCP server for the content of the site, routed at /mcp (see wrangler.jsonc)
// The same Worker serves the A2A agent at /a2a (see a2a.ts)
// The content is read from the static site (llms.txt and the Markdown versions of the pages)
export default {
	fetch(request, env, ctx) {
		const { pathname } = new URL(request.url);
		if (pathname === '/mcp/server-card') {
			return serverCardResponse(request, env.SITE_URL);
		}
		if (pathname === '/a2a') {
			return handleA2ARequest(request, env.SITE_URL);
		}

		return createMcpHandler(() => createServer(env.SITE_URL))(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;

function createServer(siteUrl: string) {
	const server = new McpServer(serverInfo, {
		instructions:
			'Use search_content to find blog posts and developer bits by Tim Deschryver about .NET, Angular, testing, and AI-assisted development, then read_content to read one as Markdown. Cite the canonical URL (without the .md suffix).',
	});

	server.registerTool(
		'search_content',
		{
			title: 'Search content',
			description:
				'Searches the blog posts and developer bits by title, topic, and description. Without a query, returns the most recent content.',
			inputSchema: z.object({
				query: z.string().optional().describe('Search terms, e.g. "angular signal forms"'),
				type: z
					.enum(['blog', 'bit'])
					.optional()
					.describe('Only return blog posts (long-form) or bits (short notes)'),
				topic: z
					.string()
					.optional()
					.describe('Only return content with this topic, e.g. "Angular"'),
				limit: z.number().int().min(1).max(50).default(10),
			}),
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async (query) => {
			const items = parseContentIndex(await fetchText(new URL('/llms.txt', siteUrl).href));
			const results = searchContent(items, query);
			const text = results.length ? results.map(formatItem).join('\n') : 'No content found.';
			return { content: [{ type: 'text', text }] };
		},
	);

	server.registerTool(
		'read_content',
		{
			title: 'Read content',
			description: 'Returns a blog post or developer bit as Markdown, including its front matter.',
			inputSchema: z.object({
				url: z
					.string()
					.describe(
						'The URL of the blog post or bit, as returned by search_content, e.g. "https://timdeschryver.dev/blog/your-first-mcp-server-with-aspnet"',
					),
			}),
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		async ({ url }) => {
			const path = markdownPath(url, siteUrl);
			const markdown = path && (await fetchText(new URL(path, siteUrl).href, false));
			if (!markdown) {
				return {
					content: [
						{
							type: 'text',
							text: `No blog post or bit found at ${url}. Use search_content to find the URL.`,
						},
					],
					isError: true,
				};
			}

			return { content: [{ type: 'text', text: markdown }] };
		},
	);

	const indexUrl = new URL('/llms.txt', siteUrl).href;
	server.registerResource(
		'content-index',
		indexUrl,
		{
			title: 'Content index',
			description: 'All blog posts and developer bits with their date, topics, and description',
			mimeType: 'text/plain',
		},
		async (uri) => ({
			contents: [{ uri: uri.href, mimeType: 'text/plain', text: await fetchText(indexUrl) }],
		}),
	);

	return server;
}

function serverCardResponse(request: Request, siteUrl: string) {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET',
		'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
		'Access-Control-Expose-Headers': 'ETag',
	};

	if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return new Response('Method Not Allowed', {
			status: 405,
			headers: { ...headers, Allow: 'GET' },
		});
	}

	return new Response(JSON.stringify(serverCard(siteUrl), null, '\t'), {
		headers: {
			...headers,
			'Content-Type': serverCardMediaType,
			'Cache-Control': 'public, max-age=3600',
		},
	});
}
