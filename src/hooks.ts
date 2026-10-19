import type { Reroute } from '@sveltejs/kit/hooks';

// Mirrors the /.well-known/api-catalog rewrite in staticwebapp.config.json, so it also works while developing
export const reroute: Reroute = ({ url }) => {
	if (url.pathname === '/.well-known/api-catalog') {
		return '/.well-known/api-catalog.linkset';
	}
};
