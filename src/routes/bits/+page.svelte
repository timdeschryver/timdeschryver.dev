<script lang="ts">
	import { run } from 'svelte/legacy';

	import Head from '$lib/Head.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Newsletter from '$lib/Newsletter.svelte';

	interface Props {
		data: import('./$types').PageData;
	}

	let { data }: Props = $props();
	const { bits, tags } = data;

	codeBlockLifeCycle();
	copyLifeCycle();

	let query: string = $state();
	let params: URLSearchParams = $state();

	onMount(async () => {
		params = new URLSearchParams(window.location.search);
		// fallback, sometimes `query` seems to be undefined
		query = $page.url.searchParams.get('q') || params.get('q') || '';
	});

	run(() => {
		if (params) {
			if (query) {
				params.set('q', query);
				window.history.replaceState(window.history.state, '', `${location.pathname}?${params}`);
			} else {
				params.delete('q');
				window.history.replaceState(window.history.state, '', location.pathname);
			}
		}
	});

	let queryParts = $derived((query || '').split(' ').filter(Boolean));

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
		content={"Tools || (new) features || blog posts in a bit format on topics that I'm excited about."}
	/>

	<meta name="twitter:title" content={"Tim's Bits"} />
	<meta
		name="twitter:description"
		content={"Tools || (new) features || blog posts in a bit format on topics that I'm excited about."}
	/>

	<meta name="og:title" content={"Tim's Bits"} />
	<meta
		name="og:description"
		content={"Tools || (new) features || blog posts in a bit format on topics that I'm excited about."}
	/>
	<meta name="og:type" content="website" />
</svelte:head>

<header class="mt-normal">
	<h3>Tools || (new) features || blog posts in a bit format on topics that I'm excited about.</h3>

	<Newsletter hideTitle={true} />

	<div class="mt-normal">
		{#each tags as tag}
			<button class:active={queryParts && tagSelected(tag)} onclick={() => tagClicked(tag)}>
				# {tag}
			</button>
		{/each}
	</div>
</header>

{#each bits as bit, i}
	{#if queryParts.length === 0 || bit.metadata.tags.some((tag) => tagSelected(tag))}
		<div class="bit">
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

			<hr />
		</div>
	{/if}
{/each}

<style>
	hr {
		border: none;
		border-top: solid 2px var(--text-color);
		margin: 4rem 1rem;
	}
	.bit {
		overflow: auto;
	}
	.bit:nth-child(even) hr {
		transform: rotate(2deg);
	}
	.bit:nth-child(odd) hr {
		transform: rotate(-2deg);
	}
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
