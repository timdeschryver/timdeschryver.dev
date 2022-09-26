import { sveltekit } from '@sveltejs/kit/vite';
import VitePluginRestart from 'vite-plugin-restart';
import svgLoader from 'vite-svg-loader';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		svgLoader(),
		// @ts-ignore - Doesn't look like `vite-plugin-restart` exports correctly.
		VitePluginRestart.default({
			restart: ['./blog/**', './snippets/**'],
		}),
	],
	server: {
		fs: {
			allow: ['..'],
		},
	},
};

export default config;
