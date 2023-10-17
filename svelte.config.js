import { vitePreprocess } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
	},
};
