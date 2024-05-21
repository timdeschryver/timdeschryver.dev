---
title: Enforce module boundaries with no-restricted-imports
slug: enforce-module-boundaries-with-no-restricted-imports
date: 2024-05-21
tags: typescript, developer-experience, architecture
---

# Enforce module boundaries with no-restricted-imports

Define module boundaries in your project by restricting specific imports using ESLint's `no-restricted-imports` rule.
The rule allows you to prevent certain modules from being imported in specific files or directories.

From an architectural point of view this is useful to enforce module boundaries e.g. to prevent feature A to be imported within feature B, or prevent circular dependencies between modules.

There are also some alternative tools that allow you to define module boundaries such as [Sherrif](https://github.com/softarc-consulting/sheriff) or [Nx](https://nx.dev/features/enforce-module-boundaries).
If you're already using these tools, I think it's better to stick with them as they provide more flexibility and features.
However, I find the ESLint approach to be straightforward and the easiest to configure, and it doesn't require an additional dependency.

For more information about the ESLint rule, refer to the [official ESLint documentation](https://eslint.org/docs/rules/no-restricted-imports), or the TypeScript-variant at the [TypeScript ESLint documentation](https://typescript-eslint.io/rules/no-restricted-imports/). If you're using Biome, see the [Biome documentation](https://biomejs.dev/linter/rules/no-restricted-imports/).

```js{3-13}:.eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@feature-a'],
            message: 'You cannot import feature A from this module.',
          },
        ],
      },
    ],
  },
};
```
