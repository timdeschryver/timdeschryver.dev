<script context="module" lang="ts">
	export async function load({ fetch }) {
		const result = await fetch(`/snippets.json`);
		const { snippets } = await result.json();
		return {
			cache: {
				maxage: 300,
			},
			props: {
				snippets,
			},
		};
	}
</script>

<script lang="ts">
	import Head from '$lib/Head.svelte';
	import Snippets from '$lib/Snippets.svelte';
	export let snippets;
</script>

<Head title="Snippets - Tim Deschryver" details={true} />

<Snippets {snippets} />
