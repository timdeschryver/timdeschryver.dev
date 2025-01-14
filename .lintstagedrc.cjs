module.exports = {
	'*.{js,ts,json,svelte}': ['eslint --fix'],
	'*.{md,cjs,js,ts,json,svelte}': ['prettier --write'],
	// only works on Node.js 16
	// '*.{jpg,jpeg,png,webp}': ['npm run optimize:image'],
};
