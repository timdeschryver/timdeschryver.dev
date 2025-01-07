---
title: ESLint flat config with EcmaScript modules (mjs) in an NX workspace
slug: eslint-flat-config-with-ecmascript-modules-mjs-in-an-nx-workspace
description: Lessons learned from migrating Angular Testing Library to ESLint's flat config format in an NX workspace.
date: 2025-01-07
tags: NX, typescript, eslint, Angular
---

The release of [ESLint v9](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/) provides an improved way to configure ESLint using the flat config format.
Since its release in April 2024 many projects have adopted this new format, including the two important ones for Angular developers being [typescript-eslint](https://typescript-eslint.io/) and [Angular ESLint](https://github.com/angular-eslint/angular-eslint).

:::tip
Check out the [ESLint migrator](https://eslint.org/docs/latest/use/configure/migration-guide) or [NX Migrator](https://nx.dev/recipes/tips-n-tricks/flat-config) to help you migrate your project to the new flat config format. Sadly, these tools migrate the current config to the flat **compat** format as a bridge between the old and new formats, not the new flat format itself.
:::

While [NX](https://nx.dev/) also supports the flat config format, there is a small caveat when using EcmaScript modules (`*.mjs`) in an NX workspace.
[For now](https://github.com/nrwl/nx/issues/22576) the NX linter doesn't recognize the `.mjs` extension ([see code](https://github.com/nrwl/nx/blob/master/packages/eslint/src/utils/flat-config.ts#L4-L8)), meaning that you can't use the flat config format with EcmaScript modules out of the box.

A workaround I found in the typescript-eslint codebase is to use a CommonJS file to load the flat config from an EcmaScript module.

```js:eslint.config.cjs
// @ts-check

// TODO - https://github.com/nrwl/nx/issues/22576
/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigPromise} */
const config = (async () => (await import('./eslint.config.mjs')).default)();
module.exports = config;
```

You can see the full migration to the flat config format in Angular Testing Library in this [commit](https://github.com/testing-library/angular-testing-library/commit/e0cd81e6a881dafe92cad10d19ecef26be977f88#diff-19a8c525f44c132750329bf35fdc218ceda8a1129af768d275a139f7c874fe48R3).
