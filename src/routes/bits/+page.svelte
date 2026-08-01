<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { page } from '$app/stores';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
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
	description="Short notes about developer tools, new .NET and Angular features, and other topics that I'm excited about."
	canonical="https://timdeschryver.dev/bits"
/>

<header class="mt-normal">
	<div class="eyebrow">Short-form notes</div>
	<h1>Developer Bits</h1>
	<p>Tools || (new) features || blog posts in a bit format on topics that I'm excited about.</p>

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
		border-top: solid 1px var(--line-color);
		margin: 4rem 0;
	}
	.bit {
		content-visibility: auto;
		contain-intrinsic-size: auto 900px;
		overflow: auto;
	}
	header {
		position: relative;
		margin-top: clamp(4rem, 10vh, 7rem);
		padding-bottom: 3rem;
		border-bottom: 1px solid var(--line-color);
	}

	header h1 {
		margin-top: clamp(1.25rem, 3vw, 2.25rem);
		font-size: clamp(3rem, 8vw, 6rem);
		line-height: 0.95;
		letter-spacing: -0.06em;
	}

	.eyebrow {
		margin: 0 0 1rem;
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-color-light);
	}

	.bit h2 {
		font-size: clamp(1.6rem, 4vw, 2.35rem);
		text-wrap: balance;
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
