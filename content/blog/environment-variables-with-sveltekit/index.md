---
title: Environment variables with SvelteKit
slug: environment-variables-with-sveltekit
description: A simple workaround to use environment variables in SvelteKit
author: Tim Deschryver
date: 2021-04-26
tags: Svelte, SvelteKit, Environment Variables
banner: ./images/banner.jpg
bannerCredit: Photo by [Valerie Bosch](https://unsplash.com/@boschrudi) on [Unsplash](https://unsplash.com)
published: true
---

When the beta version of [SvelteKit](https://kit.svelte.dev/) was [announced](https://svelte.dev/blog/sveltekit-beta), I immediately got excited and migrated my blog from Sapper to SvelteKit. Overall, the migration was very smooth and quick. The big reason why this went smooth is that the API is almost identical, and the docs and examples were helpful.

I just stumbled upon one problem with environment variables.
Sadly, it [doesn't seem to have an easy fix](https://github.com/sveltejs/kit/issues/720), that's why I decided to write down a workaround (based on the answers given in that Github issue).

## Define Environment Variables

SvelteKit delegates its build step to [Vite](https://vitejs.dev/), which supports [environment variables](https://vitejs.dev/guide/env-and-mode.html). To define environment variables, we must use the [dotenv](https://github.com/motdotla/dotenv) module.

For example, to define a base path, we need to add the variable to a `.env.*` file.
Note that all environment variables must be prefixed with `VITE_`, otherwise, the variables won't be exposed due to security reasons.

```txt:.env.development
VITE_PUBLIC_BASE_PATH=http://localhost:3000
```

When the environment variable is defined, we can now use the `import.meta.env.VITE_PUBLIC_BASE_PATH` variable in our code. These variables will be replaced by their corresponding values.

## The Problem

But as I mentioned before, there's one problem.
When the application is served you don't notice the issue, but with the build command, the following error is thrown when the component file (which uses an environment variable) includes a style tag.

```bash
$ svelte-kit build
vite v2.1.3 building for production...
✓ 15 modules transformed.
.svelte/output/client/_app/manifest.json                            0.67kb
.svelte/output/client/_app/assets/start-a8cd1609.css                0.16kb / brotli: 0.10kb
.svelte/output/client/_app/pages\index.svelte-91d77487.js           0.56kb / brotli: 0.33kb
.svelte/output/client/_app/assets/pages\index.svelte-c8d90d46.css   0.03kb / brotli: 0.03kb
.svelte/output/client/_app/chunks/index-5061b396.js                 4.60kb / brotli: 1.83kb
.svelte/output/client/_app/start-c78a3e4f.js                        15.25kb / brotli: 5.31kb
vite v2.1.3 building SSR bundle for production...
✓ 8 modules transformed.
file: C:/Users/tdeschryver/dev/poc/sk-environment-variables/src/routes/index.svelte:6:131
> Unexpected token (6:131)
    at Object.pp$4.raise (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:15614:13)
    at Object.pp.unexpected (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:13306:8)
    at Object.pp.expect (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:13300:26)
    at Object.pp$3.parseObj (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:15250:12)
    at Object.pp$3.parseExprAtom (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:14989:17)
    at Object.pp$3.parseExprSubscripts (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:14816:19)
    at Object.pp$3.parseMaybeUnary (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:14793:17)
    at Object.parseMaybeUnary (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:19538:29)
    at Object.pp$3.parseExprOps (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:14728:19)
    at Object.pp$3.parseMaybeConditional (C:\Users\tdeschryver\dev\poc\sk-environment-variables\node_modules\rollup\dist\shared\rollup.js:14711:19)
error Command failed with exit code 1.
```

## The Workaround

The workaround to this problem is to extract the environment variables into a separate module.
Next, you can simply import the environment variable into your component from this module.

```ts:variables.ts
export const variables = {
	basePath: import.meta.env.VITE_PUBLIC_BASE_PATH
};
```

```html:index.svelte
<script lang="ts">
	import { variables } from '$lib/variables';
</script>

<div>basePath: {variables.basePath}</div>
```

## TypeScript Support

Lastly, you can make the environment variables type-safe by adding their types to the `global.d.ts` declaration file.

```ts:global.d.ts
interface ImportMetaEnv {
	VITE_PUBLIC_BASE_PATH: string;
}
```
