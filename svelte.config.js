import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: sveltePreprocess(),
	kit: {
		prerender: {
			entries: ['*', '/sitemap.xml', '/blog/rss.xml'],
			default: true,
		},
		adapter: adapter({ edge: true }),
	},
};
