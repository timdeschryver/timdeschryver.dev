<script context="module" lang="ts">
	export const prerender = true;

	export async function load({ fetch }) {
		const result = await fetch(`/snippets.json`);
		const { snippets } = await result.json();
		return {
			props: {
				snippets
			}
		};
	}
</script>

<script lang="ts">
	import Head from '$lib/Head.svelte';
	import Snippets from '$lib/Snippets.svelte';
	export let snippets;
</script>

<Head title="Snippets - Tim Deschryver" />

<Snippets {snippets} />
