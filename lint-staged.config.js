module.exports = {
  '*.{svelte,js}': ['eslint --fix'],
  '*.+(js|json|yml|yaml|css|less|scss|ts|md)': ['prettier --write', 'git add'],
}
