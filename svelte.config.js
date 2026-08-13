import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: '404.html',
		}),
		prerender: {
			handleInvalidUrl: ({ href, message }) => {
				// at:// URIs (the standard.site document links) are valid, but not crawlable
				if (href.startsWith('at://')) return;
				throw new Error(message);
			},
		},
	},
};
