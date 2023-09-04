<script lang="ts">
	import Support from '$lib/Support.svelte';
	import { humanDate } from '$lib/formatters';
	import Head from '$lib/Head.svelte';
	import Socials from '$lib/Socials.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle';

	/** @type {import('./$types').PageData} */
	export let data;
	const { bit } = data;

	codeBlockLifeCycle();
</script>

<Head title={bit.metadata.title} details={false} />

<svelte:head>
	<link rel="canonical" href={bit.metadata.canonical} />

	<meta name="author" content={bit.metadata.author} />
	<meta name="copyright" content={bit.metadata.author} />
	<meta name="title" content={bit.metadata.title} />
	<meta name="description" content={bit.metadata.description} />
	<meta name="keywords" content={bit.metadata.tags.join(',')} />
	<meta name="image" content={bit.metadata.banner} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={bit.metadata.banner} />
	<meta name="twitter:image:alt" content={bit.metadata.title} />
	<meta name="twitter:title" content={bit.metadata.title} />
	<meta name="twitter:description" content={bit.metadata.description} />
	<meta name="twitter:label1" content="Written by" />
	<meta name="twitter:data1" content={bit.metadata.author} />
	<meta name="twitter:label2" content="Published on" />
	<meta name="twitter:data2" content={humanDate(bit.metadata.date)} />

	<meta name="og:url" content={bit.metadata.canonical} />
	<meta name="og:title" content={bit.metadata.title} />
	<meta name="og:description" content={bit.metadata.description} />
	<meta name="og:type" content="article" />
	<meta name="og:image" content={bit.metadata.banner} />
</svelte:head>

<div></div>

<h1 style:--name="bit-title-{bit.metadata.slug}">{bit.metadata.title}</h1>
{@html bit.html}

<h4>Follow me</h4>
<Socials />

<h4>Support me</h4>
<Support />

<style>
	@media (prefers-reduced-motion: no-preference) {
		h1 {
			view-transition-name: var(--name);
		}
	}
</style>
