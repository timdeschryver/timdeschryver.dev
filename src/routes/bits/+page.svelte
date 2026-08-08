<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { publicUrl } from '$lib/variables';
	import { humanDate } from '$lib/formatters';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const { bits, tags } = data;

	let query = $state<string | null>(null);

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

	let queryParts = $derived(
		(query || '')
			.split(/\s+/)
			.map((part) => part.toLowerCase())
			.filter(Boolean),
	);

	function tagClicked(tag: string) {
		const normalizedTag = tag.toLowerCase();

		if (queryParts.includes(normalizedTag)) {
			query = queryParts.filter((q) => q !== normalizedTag).join(' ');
		} else {
			query = query ? `${query.trim()} ${tag}` : tag;
		}
	}

	function tagSelected(tag: string) {
		return queryParts.includes(tag.toLowerCase());
	}

	function bitMatchesQuery(bit: {
		metadata: { title: string; description: string; tags: string[] };
	}) {
		const title = bit.metadata.title.toLowerCase();
		const description = bit.metadata.description.toLowerCase();
		const tags = bit.metadata.tags.map((tag) => tag.toLowerCase());

		return queryParts.every(
			(queryPart) =>
				tags.includes(queryPart) || title.includes(queryPart) || description.includes(queryPart),
		);
	}
</script>

<Head
	title="Developer Bits - Tim Deschryver"
	description="Short notes about developer tools, new .NET and Angular features, and other topics that I'm excited about."
	canonical={publicUrl('/bits')}
	type="collection"
	items={bits.slice(0, 20).map((bit) => ({
		name: bit.metadata.title,
		url: publicUrl(`/bits/${bit.metadata.slug}`),
	}))}
/>

<header class="mt-normal">
	<div class="eyebrow">Short-form notes</div>
	<h1>Developer Bits</h1>
	<p>Tools || (new) features || blog posts in a bit format on topics that I'm excited about.</p>

	<div class="mt-normal">
		{#each tags as tag (tag)}
			<button
				class:active={queryParts && tagSelected(tag)}
				aria-pressed={Boolean(queryParts && tagSelected(tag))}
				onclick={() => tagClicked(tag)}
			>
				# {tag}
			</button>
		{/each}
	</div>
</header>

<ol class="bits-list">
	{#each bits as bit, i (bit.metadata.slug)}
		{#if queryParts.length === 0 || bitMatchesQuery(bit)}
			<li>
				<article class="bit">
					<span class="bit-order" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
					<div class="bit-meta">
						<time datetime={bit.metadata.date}>{humanDate(bit.metadata.date)}</time>
						<span>{bit.metadata.tags.map((tag) => `#${tag}`).join(' · ')}</span>
					</div>
					<h2>
						<a
							href={resolve('/bits/[slug]', { slug: bit.metadata.slug })}
							class="mark-hover"
							style:--bit-title="bit-title-{bit.metadata.slug}">{bit.metadata.title}</a
						>
					</h2>
					<p>{bit.metadata.description}</p>
					<a
						href={resolve('/bits/[slug]', { slug: bit.metadata.slug })}
						class="read-more mark-hover">Read bit</a
					>
				</article>
			</li>
		{/if}
	{/each}
</ol>

<style>
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

	.bits-list {
		margin-top: 0;
		list-style: none;
	}

	.bits-list > li {
		margin-top: 0;
		border-bottom: 1px solid var(--line-color);
	}

	.bit {
		position: relative;
		padding: clamp(1.5rem, 3.5vw, 2.25rem) 0;
	}

	.bit-order {
		position: absolute;
		right: 0;
		top: clamp(1.5rem, 3.5vw, 2.25rem);
		color: var(--text-color-subtle);
		font-family: var(--head-font);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
	}

	.bit-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem 1rem;
		padding-right: 3rem;
		color: var(--text-color-light);
		font-size: 0.78rem;
	}

	.bit-meta time {
		font-size: 1em;
	}

	.bit-meta > * {
		margin-top: 0;
	}

	.bit h2 {
		margin-top: 1rem;
		font-size: clamp(1.6rem, 4vw, 2.35rem);
		text-wrap: balance;
	}

	.bit p {
		max-width: 62ch;
		color: var(--text-color-light);
	}

	.read-more {
		display: inline-block;
		font-family: var(--head-font);
		font-size: 0.85rem;
		font-weight: 650;
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
