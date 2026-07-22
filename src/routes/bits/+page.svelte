<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { page } from '$app/stores';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Newsletter from '$lib/Newsletter.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const { bits, tags } = data;

	codeBlockLifeCycle();
	copyLifeCycle();

	let query = $state(null);

	onMount(() => {
		query = $page.url.searchParams.get('q') ?? '';
	});

	$effect(() => {
		goto(resolve(query ? `/bits?q=${encodeURIComponent(query)}` : '/bits'), {
			noScroll: true,
			replaceState: true,
			keepFocus: true,
		});
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

<Head
	title="Developer Bits - Tim Deschryver"
	description="Short notes about developer tools, new Angular and .NET features, and other topics that I'm excited about."
	canonical="https://timdeschryver.dev/bits"
/>

<header class="mt-normal">
	<h1>Developer Bits</h1>
	<p>Tools || (new) features || blog posts in a bit format on topics that I'm excited about.</p>

	<Newsletter hideTitle={true} />

	<div class="mt-normal">
		{#each tags as tag (tag)}
			<button class:active={queryParts && tagSelected(tag)} onclick={() => tagClicked(tag)}>
				# {tag}
			</button>
		{/each}
	</div>
</header>

{#each bits as bit, i (bit.metadata.slug)}
	{#if queryParts.length === 0 || bit.metadata.tags.some((tag) => tagSelected(tag))}
		<div class="bit">
			<h2>
				{bits.length - i}.
				<a
					href={resolve('/bits/[slug]', { slug: bit.metadata.slug })}
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
		content-visibility: auto;
		contain-intrinsic-size: auto 900px;
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
