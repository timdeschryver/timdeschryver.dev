// The identity of the MCP server and its MCP Server Card (SEP-2127, https://github.com/modelcontextprotocol/experimental-ext-server-card)
// The Worker serves the card at /mcp/server-card, the site publishes the same card at /.well-known/mcp/server-card.json
// Keep this module free of dependencies, the site imports it without installing the Worker's packages

export const serverInfo = {
	name: 'dev.timdeschryver/content',
	title: 'Tim Deschryver',
	version: '1.0.0',
};

// The protocol versions the MCP SDK negotiates, verified in server-card.test.ts
export const supportedProtocolVersions = [
	'2026-07-28',
	'2025-11-25',
	'2025-06-18',
	'2025-03-26',
	'2024-11-05',
	'2024-10-07',
];

export const serverCardMediaType = 'application/mcp-server-card+json';

export function serverCard(siteUrl: string) {
	const url = (pathname: string) => new URL(pathname, siteUrl).href;

	return {
		$schema: 'https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json',
		...serverInfo,
		description: 'Search and read the blog posts and developer bits of Tim Deschryver as Markdown',
		websiteUrl: url('/'),
		repository: {
			url: 'https://github.com/timdeschryver/timdeschryver.dev',
			source: 'github',
			subfolder: 'mcp',
		},
		icons: [
			{
				src: url('/favicons/android-chrome-512x512.png'),
				mimeType: 'image/png',
				sizes: ['512x512'],
			},
		],
		remotes: [
			{
				type: 'streamable-http',
				url: url('/mcp'),
				supportedProtocolVersions,
			},
		],
	};
}
