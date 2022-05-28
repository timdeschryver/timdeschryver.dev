import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: sveltePreprocess(),
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['*', '/sitemap.xml', '/blog/rss.xml'],
			default: true,
		},
	},
};
