import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import VitePluginRestart from 'vite-plugin-restart';
import svgLoader from 'vite-svg-loader';

export default defineConfig(() => {
	return {
		plugins: [
			sveltekit({
				preprocess: vitePreprocess(),
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
			}),
			svgLoader(),
			VitePluginRestart({
				restart: ['./blog/**', './bits/**', '!*.webp'],
			}),
		],
		server: {
			fs: {
				allow: ['..'],
			},
		},
		test: {
			include: ['src/**/*.test.ts'],
		},
		resolve: {
			conditions: ['browser'],
		},
	};
});
