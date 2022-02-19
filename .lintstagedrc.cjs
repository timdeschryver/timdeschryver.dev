module.exports = {
	'*.{js,ts,json,svelte}': ['eslint --fix'],
	'*.{md,cjs,js,ts,json,svelte}': ['prettier --write'],
	'*.{jpg,jpeg,png,gif}': ['npm run optimize:image'],
};
