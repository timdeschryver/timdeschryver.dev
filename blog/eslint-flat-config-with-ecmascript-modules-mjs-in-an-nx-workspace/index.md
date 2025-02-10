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
The `eslint.config.cjs` file just loads the flat config from the EcmaScript module `eslint.config.mjs` and re-exports it.

```js:eslint.config.cjs
// @ts-check

// TODO - https://github.com/nrwl/nx/issues/22576
/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigPromise} */
const config = (async () => (await import('./eslint.config.mjs')).default)();
module.exports = config;
```

The `eslint.config.mjs` file contains the flat config in EcmaScript module format.

```js:eslint.config.mjs
// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import jestDom from 'eslint-plugin-jest-dom';
import testingLibrary from 'eslint-plugin-testing-library';

export default tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "atl",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "atl",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
    },
  },
  {
    files: ["**/*.spec.ts"],
    extends: [
      jestDom.configs["flat/recommended"],
      testingLibrary.configs["flat/angular"],
    ],
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
```

You can find the full migration to the ESLint v9 flat config format for Angular Testing Library in [this commit](https://github.com/testing-library/angular-testing-library/commit/e0cd81e6a881dafe92cad10d19ecef26be977f88#diff-ade92dc557e1c37f3e97d3323edfba82ec5ae154ff4325ddd06962631a5c2666).
