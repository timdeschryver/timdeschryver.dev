<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Support from '$lib/Support.svelte';
	import Socials from '$lib/Socials.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle';
	import copyLifeCycle from '$lib/copy-lifecycle';

	/** @type {import('./$types').PageData} */
	export let data;
	const { bits, tags } = data;

	codeBlockLifeCycle();
	copyLifeCycle();

	let query: string;
	let params: URLSearchParams;

	onMount(async () => {
		params = new URLSearchParams(window.location.search);
		// fallback, sometimes `query` seems to be undefined
		query = $page.url.searchParams.get('q') || params.get('q') || '';
	});

	$: if (params) {
		if (query) {
			params.set('q', query);
			window.history.replaceState(window.history.state, '', `${location.pathname}?${params}`);
		} else {
			params.delete('q');
			window.history.replaceState(window.history.state, '', location.pathname);
		}
	}

	$: queryParts = (query || '').split(' ').filter(Boolean);

	function tagClicked(tag) {
		if (queryParts.includes(tag)) {
			query = queryParts.filter((q) => q !== tag).join(' ');
		} else {
			query = query ? `${query.trim()} ${tag}` : tag;
		}
	}

	function tagSelected(tag: string) {
		return queryParts.includes(tag);
	}
</script>

<Head title="Bits - Tim Deschryver" details={false} />

<svelte:head>
	<meta name="title" content={"Tim's Bits"} />
	<meta
		name="description"
		content={'A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="twitter:title" content={"Tim's Bits"} />
	<meta
		name="twitter:description"
		content={'A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="og:title" content={"Tim's Bits"} />
	<meta
		name="og:description"
		content={'A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped and/or impressed me.'}
	/>
	<meta name="og:type" content="website" />
</svelte:head>

<header class="mt-normal">
	<h3>
		A new bit every Tuesday of a tool || feature || blog that has helped me, or which I encountered
		recently and impressed me.
	</h3>

	<div class="mt-normal">
		{#each tags as tag}
			<button class:active={queryParts && tagSelected(tag)} on:click={() => tagClicked(tag)}>
				# {tag}
			</button>
		{/each}
	</div>
</header>

{#each bits as bit, i}
	{#if queryParts.length === 0 || bit.metadata.tags.some((tag) => tagSelected(tag))}
		<h2>
			{bits.length - i}.
			<a
				href="/bits/{bit.metadata.slug}"
				class="mark-hover"
				data-sveltekit-preload-data="hover"
				style:--bit-title="bit-title-{bit.metadata.slug}">{bit.metadata.title}</a
			>
		</h2>
		{@html bit.html}
	{/if}
{/each}

<h4>Follow me</h4>
<Socials />

<h4>Support me</h4>
<Support />

<style>
	button {
		color: var(--text-color-light);
		transition: color 0.2s ease;
	}

	button:hover {
		color: var(--text-color);
	}

	button.active {
		border-color: currentColor;
		color: var(--text-color);
	}

	@media (prefers-reduced-motion: no-preference) {
		a {
			view-transition-name: var(--bit-title);
		}
	}
</style>
