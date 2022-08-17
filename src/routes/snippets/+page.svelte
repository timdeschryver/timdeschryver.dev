<script lang="ts">
	import Head from '$lib/Head.svelte';
	import Snippets from '$lib/Snippets.svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	const { snippets } = data;
</script>

<Head title="Snippets - Tim Deschryver" details={true} />

<Snippets {snippets} />
