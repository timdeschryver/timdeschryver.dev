module.exports = {
	'*.{cjs,js,mjs,ts,svelte}': ['oxlint --fix --format=agent'],
	'*.{cjs,css,js,json,md,mjs,svelte,ts,yaml,yml}': ['oxfmt --no-error-on-unmatched-pattern'],
	// only works on Node.js 16
	// '*.{jpg,jpeg,png,webp}': ['npm run optimize:image'],
};
