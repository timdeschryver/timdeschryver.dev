> Update: You can now compose your workflow by reusing composite actions, [GitHub Actions: Reduce duplication with action composition](https://github.blog/changelog/2021-08-25-github-actions-reduce-duplication-with-action-composition/)

```yml
name: ci

on:
  push:
    branches:
      - 'main'
  pull_request: {}

jobs:
  build_test_release:
    strategy:
      matrix:
        node-version: ${{ fromJSON(github.ref == 'refs/heads/main' && '[16]' || '[12,14,16]') }}
        os: ${{ fromJSON(github.ref == 'refs/heads/main' && '["ubuntu-latest"]' || '["ubuntu-latest", "windows-latest"]') }}
    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v2
      - name: use Node.js ${{ matrix.node-version }} on ${{ matrix.os }}
        uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}
      - name: install
        run: npm install
      - name: build
        run: npm run build
      - name: test
        run: npm run test
      - name: Release
        if: github.ref == 'refs/heads/main' && github.repository == 'REPO_OWNER/REPO_NAME'
        run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```
