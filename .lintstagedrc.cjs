module.exports = {
	'*.{cjs,js,mjs,ts,svelte}': ['eslint --fix'],
	'*.{cjs,css,js,json,md,mjs,svelte,ts,yaml,yml}': ['prettier --write'],
	// only works on Node.js 16
	// '*.{jpg,jpeg,png,webp}': ['npm run optimize:image'],
};
