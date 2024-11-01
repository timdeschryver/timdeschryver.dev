import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import VitePluginRestart from 'vite-plugin-restart';
import svgLoader from 'vite-svg-loader';

export default defineConfig(({ mode }) => {
	return {
		plugins: [
			sveltekit(),
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
			environmentMatchGlobs: [['src/**/*.dom.test.ts', 'jsdom']],
		},
		resolve: {
			conditions: mode === 'test' ? ['browser'] : [],
		},
	};
});
