import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: sveltePreprocess(),
	kit: {
		trailingSlash: 'always',
		prerender: {
			entries: ['*', '/sitemap.xml', '/blog/rss.xml'],
			default: true,
		},
		adapter: adapter(),
	},
};
