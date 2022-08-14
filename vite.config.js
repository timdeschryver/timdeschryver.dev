import { sveltekit } from '@sveltejs/kit/vite';
import VitePluginRestart from 'vite-plugin-restart';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		// @ts-ignore - Doesn't look like `vite-plugin-restart` exports correctly.
		VitePluginRestart.default({
			restart: ['./blog/**', './snippets/**'],
		}),
	],
	assetsInclude: ['blog', 'snippets'],
	server: {
		fs: {
			allow: ['..'],
		},
	},
};

export default config;
