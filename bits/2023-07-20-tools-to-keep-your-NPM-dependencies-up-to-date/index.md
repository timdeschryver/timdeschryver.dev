---
title: Tools to keep your NPM dependencies up-to-date
slug: tools-to-keep-your-npm-dependencies-up-to-date
date: 2023-07-20
tags: tools
---

## Tools to keep your NPM dependencies up-to-date

You can use the default npm commands [npm outdated](https://docs.npmjs.com/cli/commands/npm-outdated) (check the registry to see if any packages are currently outdated) and [npm update](https://docs.npmjs.com/cli/commands/npm-update) (update all the packages listed to the latest version, respecting the semver constraints of both your package and its dependencies).

```bash
# list packages respecting semver
npm outdated
# update package.json
npm outdated --save
# update and install packages
npm update
```

But, to get a more detailed and prettier overview of the dependencies, you resort to the CLI
tool [🥦 taze](https://github.com/antfu/taze), which also works for monorepos.

```bash
# list packages respecting semver
npx taze
# include major versions
npx taze major
# write to package.json
npx taze -w
```

The Visual Studio Code users among us can install the [NPM](https://marketplace.visualstudio.com/items?itemName=idered.npm) extension to get a nice sidebar with the package information (and quick actions to update them). Just take a little glance at the sidebar to see if there are any updates available.

```bash
code --install-extension idered.npm --force
code-insiders --install-extension idered.npm --force
```
