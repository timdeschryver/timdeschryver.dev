import type { Reroute } from '@sveltejs/kit/hooks';

// Mirrors the /.well-known rewrites in staticwebapp.config.json, so they also work while developing
const rewrites: Record<string, string> = {
	'/.well-known/api-catalog': '/.well-known/api-catalog.linkset',
	'/.well-known/http-message-signatures-directory':
		'/.well-known/http-message-signatures-directory.jwks',
};

export const reroute: Reroute = ({ url }) => rewrites[url.pathname];
