module.exports = {
  '*.{svelte,js}': ['eslint --fix', 'git add'],
  '*.+(json|yml|yaml|css|less|scss|ts|md)': ['prettier --write', 'git add'],
}
