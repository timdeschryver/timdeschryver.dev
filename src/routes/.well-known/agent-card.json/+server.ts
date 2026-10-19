import { publicUrl } from '#lib/variables.js';

export const prerender = true;

// The A2A Agent Card (https://a2a-protocol.org/latest/specification/), served at /.well-known/agent-card.json
// The site is static, the skills describe the read-only content that's also exposed via /llms.txt and /openapi.json
// The agent at /a2a is the Worker in mcp/src/a2a.ts, keep the skills in sync with how it answers
export function GET() {
	return new Response(JSON.stringify(generate(), null, '\t'), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

function generate() {
	return {
		name: 'Tim Deschryver',
		description:
			'Finds and reads the technical articles by Tim Deschryver, a Belgian software engineer and Microsoft MVP, about .NET, Angular, testing, AI-assisted development, and developer tooling.',
		version: '1.0.0',
		supportedInterfaces: [
			{
				url: publicUrl('/a2a'),
				protocolBinding: 'JSONRPC',
				protocolVersion: '1.0',
			},
		],
		provider: {
			organization: 'Tim Deschryver',
			url: publicUrl(),
		},
		documentationUrl: publicUrl('/llms.txt'),
		iconUrl: publicUrl('/favicons/apple-touch-icon.png'),
		capabilities: {
			streaming: false,
			pushNotifications: false,
			extendedAgentCard: false,
		},
		defaultInputModes: ['text/plain'],
		defaultOutputModes: ['text/plain', 'text/markdown'],
		skills: [
			{
				id: 'find-articles',
				name: 'Find articles',
				description:
					'Finds the blog posts and developer bits about a topic, and returns their title, publication date, summary, and link.',
				tags: ['search', 'blog', '.NET', 'Angular', 'testing', 'AI-assisted development'],
				examples: [
					'Which articles explain how to test Angular components?',
					'Find posts about .NET Aspire',
				],
			},
			{
				id: 'read-article',
				name: 'Read an article',
				description:
					'Returns the full content of a blog post or developer bit as Markdown, including its front matter. Send its URL, as returned by find-articles.',
				tags: ['blog', 'markdown', 'content'],
				examples: [
					`Read ${publicUrl('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo')}`,
				],
				outputModes: ['text/markdown'],
			},
		],
	};
}
