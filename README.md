# timdeschryver.dev

## Included

- dynamic css variables (and theme)
- syntax highlighting
- env variables
- rss feed
- sitemap
- google analytics

## TODO

- create proper TS types
- release
- prettier
- linting ?

## Broken

- search (needs `@sapper/app` to access param via `stores`)
- BMC (needs `@sapper/app` to access param via `stores`)
- line highlighting (prism throws errors)
- build `npm run build` (this seems to also be broken for new inits with `@sveltejs/adapter-node`)

## Differences

- layout file renamed from `_layout.svelte` to `$layout.svelte`
- renamed sapper tags to svelte tags e.g. `%sapper.body%` to `%svelte.body%`
- moved `#sapper` container from `app.html` to `$layout.svelte` because it was getting removed and only the `%svelte.body%` tag was rendered
- moved `content` to `static/content` to access the images without having to copy the content on build
- moved to TypeScript, added `lang="ts"` to each script
- fetch needs need a prefixing slash, otherwise it just appends to the current URL, before `blog/${params.slug}.json` now `/blog/${params.slug}.json`
- replaced `process.env` with `import.meta.env.`. All variables need to be prefixed with `SNOWPACK_PUBLIC_` and the package `@snowpack/plugin-dotenv` needs to be installed. https://github.com/snowpackjs/snowpack/tree/master/plugins/plugin-dotenv#readme
- rewrote sitemap to not have the same property in different nodes within the template string (throws "date_importmeta is not defined")

## Questions

- how to run changes to "API" without having to restart
- how to reload when md is changed

## Removed

- send me a message
- graphql
