import { publicUrl } from '#lib/variables.js';

export const prerender = true;

// The OpenAPI description of the (static) content endpoints, linked from /.well-known/api-catalog
export function GET() {
	return new Response(JSON.stringify(generate(), null, '\t'), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

function generate() {
	const notFound = { description: 'The content does not exist' };

	return {
		openapi: '3.1.0',
		info: {
			title: 'Tim Deschryver content',
			version: '1.0.0',
			description:
				'Read-only access to the blog posts and developer bits on timdeschryver.dev. Every endpoint is a static file, no authentication is required. Use `/llms.txt` to find the slugs of all content.',
			contact: {
				name: 'Tim Deschryver',
				url: publicUrl(),
			},
		},
		servers: [{ url: publicUrl() }],
		security: [],
		externalDocs: {
			description: 'Index of all content (llms.txt)',
			url: publicUrl('/llms.txt'),
		},
		paths: {
			'/llms.txt': {
				get: {
					operationId: 'getContentIndex',
					summary: 'Index of all blog posts and developer bits',
					description:
						'Lists every blog post and developer bit with its title, date, tags, description, and a link to its Markdown version.',
					responses: {
						'200': {
							description: 'The content index in the llms.txt format',
							content: { 'text/plain': { schema: { type: 'string' } } },
						},
					},
				},
			},
			'/blog/{slug}.md': {
				get: {
					operationId: 'getBlogPostMarkdown',
					summary: 'A blog post as Markdown',
					description:
						'Returns the full blog post, including its front matter. The canonical (HTML) page is the same URL without the `.md` suffix.',
					parameters: [{ $ref: '#/components/parameters/slug' }],
					responses: {
						'200': {
							description: 'The blog post',
							content: { 'text/markdown': { schema: { type: 'string' } } },
						},
						'404': notFound,
					},
				},
			},
			'/bits/{slug}.md': {
				get: {
					operationId: 'getBitMarkdown',
					summary: 'A developer bit as Markdown',
					description:
						'Returns the full developer bit, including its front matter. The canonical (HTML) page is the same URL without the `.md` suffix.',
					parameters: [{ $ref: '#/components/parameters/slug' }],
					responses: {
						'200': {
							description: 'The developer bit',
							content: { 'text/markdown': { schema: { type: 'string' } } },
						},
						'404': notFound,
					},
				},
			},
			'/blog/rss.xml': {
				get: {
					operationId: 'getBlogFeed',
					summary: 'RSS feed of the blog posts',
					responses: {
						'200': {
							description: 'The RSS feed, including the full content of the blog posts',
							content: { 'application/rss+xml': { schema: { type: 'string' } } },
						},
					},
				},
			},
			'/sitemap.xml': {
				get: {
					operationId: 'getSitemap',
					summary: 'XML sitemap of all canonical pages',
					responses: {
						'200': {
							description: 'The sitemap',
							content: { 'application/xml': { schema: { type: 'string' } } },
						},
					},
				},
			},
		},
		components: {
			parameters: {
				slug: {
					name: 'slug',
					in: 'path',
					required: true,
					description: 'The slug of the content, as listed in `/llms.txt`',
					schema: { type: 'string', pattern: '^[\\w-]+$' },
				},
			},
		},
	};
}
