<script lang="ts">
	import Head from '$lib/Head.svelte';
	let resources = [
		{
			title: 'Useful scripts',
			links: [
				{
					link: 'http://www.sqlnuggets.com/blog/sql-scripts-how-to-find-missing-indexes/',
					description: 'How To Find Missing Indexes',
					category: 'Script',
				},
				{
					link: 'https://www.sqlshack.com/how-to-identify-and-monitor-unused-indexes-in-sql-server/',
					description: 'Finding unused indexes',
					category: 'Script',
				},
				{
					link: 'https://udayarumilli.com/sql-script-monitor-cpu-utilization-2/',
					description: 'Monitor CPU Utilization',
					category: 'Script',
				},
			],
		},
		{
			title: 'Good to knows',
			links: [
				{
					link: 'https://sqlperformance.com/2017/02/sql-indexes/seek-leading-wildcard-sql-server/',
					description: 'Solving wildcard queries by using fragments',
					category: 'Performance Optimization',
				},
				{
					link: 'https://sqlperformance.com/2017/02/sql-performance/follow-up-1-leading-wildcard-seeks',
					description: 'Solving wildcard queries by using fragments part 2',
					category: 'Performance Optimization',
				},
			],
		},
	];
</script>

<Head
	title="SQL Resources - Tim Deschryver"
	description="SQL resources that I use as a reference."
	canonical="https://timdeschryver.dev/resources/sql"
/>

<h1>SQL Resources</h1>

{#each resources as resource (resource.title)}
	<h2>{resource.title}</h2>

	<ul>
		{#each resource.links as link (link.link)}
			<li class="mt-0">
				<a href={link.link} rel="external">{link.category}: {link.description}</a>
			</li>
		{/each}
	</ul>
{/each}
