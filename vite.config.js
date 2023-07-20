import { sveltekit } from '@sveltejs/kit/vite';
import VitePluginRestart from 'vite-plugin-restart';
import svgLoader from 'vite-svg-loader';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(),
		svgLoader(),
		VitePluginRestart({
			restart: ['./blog/**', './bits/**'],
		}),
	],
	server: {
		fs: {
			allow: ['..'],
		},
	},
};

export default config;
