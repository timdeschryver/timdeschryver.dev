import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: sveltePreprocess(),
	kit: {
		adapter: adapter({ edge: true }),
		prerender: {
			entries: ['*', '/sitemap.xml', '/blog/rss.xml'],
			default: true,
		},
	},
};
