<script lang="ts">
	import Head from '$lib/Head.svelte';
</script>

<Head title="Bits - Tim Deschryver" details={false} />

<svelte:head>
	<meta name="title" content={"Tim's Bits"} />
	<meta
		name="description"
		content={'A new bit every Tuesday of a tool | feature | blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="twitter:title" content={"Tim's Bits"} />
	<meta
		name="twitter:description"
		content={'A new bit every Tuesday of a tool | feature | blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="og:title" content={"Tim's Bits"} />
	<meta
		name="og:description"
		content={'A new bit every Tuesday of a tool | feature | blog that I encountered recently that has helped and/or impressed me.'}
	/>
	<meta name="og:type" content="website" />
</svelte:head>

<header class="mt-normal" />

<section>
	<h2>Tools to keep your NPM dependencies up-to-date</h2>

	<div>
		You can use the default npm commands <a href="https://docs.npmjs.com/cli/commands/npm-outdated"
			><code>npm outdated</code></a
		>
		(check the registry to see if any packages are currently outdated) and
		<a href="https://docs.npmjs.com/cli/commands/npm-update"><code>npm update</code></a> (update all
		the packages listed to the latest version, respecting the semver constraints of both your package
		and its dependencies).
	</div>

	<pre>
		<code>
			npm outdated # list packages to update
			npm outdated --save # update package.json
			npm update # update packages
		</code>
	</pre>

	<div>
		But, to get a more detailed and prettier overview of the dependencies, you resort to the CLI
		tool <a href="https://github.com/antfu/taze"><code>🥦 taze</code></a>, which also works for
		monorepos.
	</div>

	<pre>
		<code>
			npx taze
			npx taze major
		</code>
	</pre>

	<div>
		The Visual Studio Code users under us can install the <a
			href="https://marketplace.visualstudio.com/items?itemName=idered.npm"><code>NPM</code></a
		> extension to get a nice sidebar with the package information (and quick actions to update them).
	</div>
</section>

<style>
	h2 {
		margin-bottom: var(--spacing-half);
	}

	pre {
		margin-top: 0;
		line-height: 1;
	}

	* + div {
		margin-top: 0;
	}
</style>
