import { SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/server';
import { describe, expect, it } from 'vitest';
import { serverCard, supportedProtocolVersions } from './server-card';

describe('serverCard', () => {
	it('advertises the protocol versions of the MCP SDK', () => {
		// 2026-07-28 is the (stateless) modern protocol, the SDK only lists the versions negotiated with initialize
		expect(supportedProtocolVersions).toEqual(['2026-07-28', ...SUPPORTED_PROTOCOL_VERSIONS]);
	});

	it('points to the streamable HTTP endpoint on the site', () => {
		const card = serverCard('https://timdeschryver.dev');
		expect(card.remotes).toEqual([
			{
				type: 'streamable-http',
				url: 'https://timdeschryver.dev/mcp',
				supportedProtocolVersions,
			},
		]);
		expect(card.name).toMatch(/^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/);
		expect(card.description.length).toBeLessThanOrEqual(100);
	});
});
