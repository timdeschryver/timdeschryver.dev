<script context="module" lang="ts">
	export async function load({ params, fetch }) {
		const result = await fetch(`/snippets.json`);
		const { snippets } = await result.json();
		const snippet = snippets.find((s) => s.metadata.slug === params.slug);
		return {
			cache: {
				maxage: 300,
			},
			props: {
				snippets,
				snippet,
			},
		};
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import Snippets from '$lib/Snippets.svelte';

	export let snippet;

	onMount(() => {
		document.getElementById(snippet.metadata.slug).scrollIntoView();
	});
</script>

<svelte:head>
	<title>Snippets - Tim Deschryver</title>

	<meta name="author" content={snippet.metadata.author} />
	<meta name="copyright" content={snippet.metadata.author} />
	<meta name="title" content={snippet.metadata.title} />
	<meta name="keywords" content={snippet.metadata.tags.join(',')} />
	<meta name="image" content={snippet.metadata.image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={snippet.metadata.image} />
	<meta name="twitter:image:alt" content={snippet.metadata.title} />
	<meta name="twitter:title" content="Tim Deschryver's Snippets" />
	<meta name="twitter:description" content={snippet.metadata.title} />
	<meta name="twitter:label1" content="Snippet by" />
	<meta name="twitter:data1" content={snippet.metadata.author} />

	<meta name="og:title" content="Tim Deschryver's Snippets" />
	<meta name="og:description" content={snippet.metadata.title} />
	<meta name="og:type" content="article" />
	<meta name="og:image" content={snippet.metadata.image} />
</svelte:head>

<Snippets snippets={[snippet]} />
