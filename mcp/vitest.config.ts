import { defineConfig } from 'vitest/config';

// Without its own config, Vitest uses the site's Vite config (and SvelteKit plugin) of the parent folder
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
});
