<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	let resources = [
		{
			link: 'https://sqlperformance.com/2017/02/sql-indexes/seek-leading-wildcard-sql-server/',
			description: 'Solving wildcard queries by using fragments',
			category: 'Performance Optimization'
		},
		{
			link: 'https://sqlperformance.com/2017/02/sql-performance/follow-up-1-leading-wildcard-seeks',
			description: 'Solving wildcard queries by using fragments part 2',
			category: 'Performance Optimization'
		}
	];
</script>

<svelte:head>
	<title>Resouces: SQL - Tim Deschryver</title>

	<meta name="title" content="Resouces: SQL" />
	<meta name="description" content="SQL Resources that I use as a reference" />
	<meta name="keywords" content="SQL, Resources" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="SQL Resources" />
	<meta name="twitter:description" content="SQL Resources that I use as a reference" />
	<meta name="og:url" content={`https://timdeschryver.dev/resources/sql`} />
	<meta name="og:title" content="Resouces: SQL" />
	<meta name="og:description" content="SQL Resources that I use as a reference" />
	<meta name="og:type" content="article" />
</svelte:head>

<h1>SQL Resources</h1>

<ul>
	{#each resources as resource}
		<li><a href={resource.link}>{resource.category}: {resource.description}</a></li>
	{/each}
</ul>

<style>
	li {
		margin-top: 0;
	}
</style>
