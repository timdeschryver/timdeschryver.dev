---
title: Don't commit focused tests
slug: dont-commit-focused-tests
description: Prevent an accidental commit by using a linter.
author: Tim Deschryver
date: 2020-05-10
tags: Linters, DeveloperExperience, Tooling, ContinuousIntegration
banner: ./images/banner.jpg
bannerCredit: Photo by [Steinar Engeland](https://unsplash.com/@steinart) on [Unsplash](https://unsplash.com)
published: true
---

We've all done it, committing a focused test. Most of the time this won't be spotted during a review, and this might lead to bigger problems. So... how can this be prevented?

## Visual Studio Code extension

Last week, [Dzhavat Ushev](https://twitter.com/dzhavatushev) created the [Test Focus Highlighter](https://marketplace.visualstudio.com/items?itemName=dzhavat.test-focus-highlighter) Visual Studio Code extension which highlights focused tests.

![Warnings are shown for focused tests](./images/test-highlighter.jpg)

Neat right?! But this doesn't prevent us from committing tests, for this we have to take it a step further.

## TSLint

For projects that are using TSLint, the built-in [ban rule](https://palantir.github.io/tslint/rules/ban/) can be used to ban the usage of specific functions or global methods. I didn't know this existed, but [Maxime Robert](https://twitter.com/maxime1992) pointed me to it.

This ban rule can be configured in the `tslint.json` file.

```json:tslint.json
{
  "rules": {
    "ban": [
      true,
      { "name": ["describe", "only"], "message": "don't focus tests" },
      { "name": "fdescribe", "message": "don't focus tests" },
      { "name": ["it", "only"], "message": "don't focus tests" },
      { "name": "fit", "message": "don't focus tests" },
      { "name": ["test", "only"], "message": "don't focus tests" },
      { "name": "ftest", "message": "don't focus tests" }
    ]
  }
}
```

## ESLint

### eslint-plugin-ban

Sadly, for ESLint there isn't a built-in rule but there are options. Inspired by the TSLint ban rule, there's an ESLint [ban rule](https://www.npmjs.com/package/eslint-plugin-ban) that is created by the community. It has the same configuration and behaves the same way as the TSLint version.

This ban rule can be configured in the `.eslintrc.json` file.

```json:.eslintrc.json
{
  "rules": {
    "ban/ban": [
      true,
      { "name": ["describe", "only"], "message": "don't focus tests" },
      { "name": "fdescribe", "message": "don't focus tests" },
      { "name": ["it", "only"], "message": "don't focus tests" },
      { "name": "fit", "message": "don't focus tests" },
      { "name": ["test", "only"], "message": "don't focus tests" },
      { "name": "ftest", "message": "don't focus tests" }
    ]
  }
}
```

### eslint-plugin-jest

The second option, if you're using Jest, is to use the [eslint-plugin-jest](https://www.npmjs.com/package/eslint-plugin-jest) ESLint plugin. This plugin has a set of options and one of these is [no-focused-tests](https://github.com/jest-community/eslint-plugin-jest/blob/HEAD/docs/rules/no-focused-tests.md). You can enable the rule specifically, use the "all configuration", or the "recommended configuration".

```json:.eslintrc.json
{
  "extends": ["plugin:jest/recommended"]
}
```

## Pre-commit hook

After this post was released, [Netanel Basal](https://twitter.com/NetanelBasal) shared a third option by using a pre-commit hook.
This will prevent a user from committing a focused test.

For this method, you have to (1) create the hook, and (2) enable the hook with for example husky.

```js
const { execSync } = require('child_process');
const chalk = require('chalk');

/** Map of forbidden words and their match regex */
const words = {
	fit: '\\s*fit\\(',
	fdescribe: '\\s*fdescribe\\(',
	debugger: '(debugger);?',
};
let status = 0;
for (let word of Object.keys(words)) {
	const matchRegex = words[word];
	const gitCommand = `git diff --staged -G"${matchRegex}" --name-only`;
	const badFiles = execSync(gitCommand).toString();
	const filesAsArray = badFiles.split('\n');
	const tsFileRegex = /\.ts$/;
	const onlyTsFiles = filesAsArray.filter((file) => tsFileRegex.test(file.trim()));
	if (onlyTsFiles.length) {
		status = 1;
		console.log(chalk.bgRed.black.bold(`The following files contains '${word}' in them:`));
		console.log(chalk.bgRed.black(onlyTsFiles.join('\n')));
	}
}
process.exit(status);
```

```json
"husky": {
  "hooks": {
    "pre-commit": "node hooks/pre-commit.js",
  }
}
```

For an example, you can take a look at the [Transloco](https://github.com/ngneat/transloco) library.
Thanks Netanel!

## Conclusion

Using the Visual Studio Code extension helps you to spot focused tests, but doesn't prevent that these tests are committed. Using a linter helps to spot these focused tests (or skipped tests).
Linting your project during a continuous integration run will give you a warning or will throw an error (depending on how it's configured) to prevent an accidental commit.

Happy linting!
