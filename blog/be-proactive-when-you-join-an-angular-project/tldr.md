Here's a short overview of what we've seen in this post to help improve the shape of a codebase.

## Strictness

Update the `tsconfig.json` file of your project to enable strict compilation for [TypeScript](https://www.typescriptlang.org/tsconfig/strict.html) and [Angular](https://angular.io/guide/angular-compiler-options). Also, take a close look at the other strict options that can be used.

## ESLint

Migrate the codebase from TSLint to ESLint with the [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) and [angular-eslint](https://github.com/angular-eslint/angular-eslint) plugins. Also, don't forget about the [eslint-plugin-rxjs](https://github.com/cartant/eslint-plugin-rxjs) and [eslint-plugin-ngrx](https://github.com/timdeschryver/eslint-plugin-ngrx) plugins.

## Betterer

Instead of refactoring all violations in one go, use [Betterer](https://phenomnomnominal.github.io/betterer/) to incrementally increase the shape of the codebase. Don't do this by yourself but involve the whole team.

## Prettier

Format the code in an opinionated way with [Prettier](https://prettier.io/).

## Githooks and lint-staged

Enforce all of the rules to the whole team by using [githooks](https://git-scm.com/docs/githooks) in combination with [lint-staged](https://github.com/okonet/lint-staged).

## Playwright

Let [Playwright](https://playwright.dev/) generate a test for you while you're clicking through the application.

## Unify libraries

When you discover that multiple libraries are used for the same purpose try to unify them into one.
This makes it easier when a new developer joins the team.

## Clean up unused exports

Use [ts-prune](https://github.com/nadeesha/ts-prune) to detect and remove unused exports.
