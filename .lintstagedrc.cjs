module.exports = {
	'*.{js,ts,json,svelte}': ['eslint --fix'],
	'*.{md,cjs}': ['prettier --write'],
	'*.{jpg,jpeg,png,gif}': ['npm run optimize:image'],
};
