A workaround I found in the typescript-eslint codebase is to use a CommonJS file to load the flat config from an EcmaScript module.

```js:eslint.config.cjs
// @ts-check

// TODO - https://github.com/nrwl/nx/issues/22576
/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigPromise} */
const config = (async () => (await import('./eslint.config.mjs')).default)();
module.exports = config;
```
