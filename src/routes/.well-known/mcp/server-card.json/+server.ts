import { serverCard } from '#mcp/server-card.js';
import { publicUrl } from '#lib/variables.js';

export const prerender = true;

// The MCP Server Card (SEP-2127) of the MCP server in /mcp, served at /.well-known/mcp/server-card.json
// The Worker also serves it at /mcp/server-card, the recommended location within the spec
// The headers of prerendered responses are dropped, the CORS header is also set in staticwebapp.config.json
export function GET() {
	return new Response(JSON.stringify(serverCard(publicUrl()), null, '\t'), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}
