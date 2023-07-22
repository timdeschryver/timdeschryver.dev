<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { humanDate } from '$lib/formatters';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	const { metadata, tags } = data;

	let query;
	let params;

	let meta = {
		canonical: 'https://timdeschryver.dev/blog',
		title: "Tim's Blog",
		description: `${metadata.length} notes, mainly about Angular and .NET`,
	};

	onMount(() => {
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

	$: queryParts = (query || '').split(' ');

	let filteredPosts = [];
	$: if (query) {
		filteredPosts = metadata.filter((p) => {
			return queryParts.every(
				(q) => p.tags.some((t) => match(t, q)) || like(p.title, q) || like(p.description, q),
			);
		});
	} else {
		filteredPosts = metadata;
	}

	function tagClicked(tag) {
		if (queryParts.includes(tag)) {
			query = queryParts.filter((q) => q !== tag).join(' ');
		} else {
			query = query ? `${query.trim()} ${tag}` : tag;
		}
	}

	function like(text, value) {
		return text.match(new RegExp(value, 'i'));
	}

	function match(text, value) {
		return text.match(new RegExp(`^${value}$`, 'i'));
	}
</script>

<Head title="Blog - Tim Deschryver" details={false} />

<svelte:head>
	<link rel="canonical" href={meta.canonical} />

	<meta name="title" content={meta.title} />
	<meta name="description" content={meta.description} />

	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />

	<meta name="og:url" content={meta.canonical} />
	<meta name="og:title" content={meta.title} />
	<meta name="og:description" content={meta.description} />
	<meta name="og:type" content="website" />
</svelte:head>

<div class="mt-normal">
	<input
		type="search"
		bind:value={query}
		placeholder="Search"
		autocomplete="off"
		aria-label="Search"
	/>
	{#each tags as tag}
		<button
			class={tag}
			class:active={queryParts.some((q) => match(q, tag))}
			on:click={() => tagClicked(tag)}
		>
			{tag}
		</button>
	{/each}
</div>

<ul>
	{#each filteredPosts as post}
		<li class={post.tags.join(' ')}>
			<article>
				<h2>
					<a href={`/blog/${post.slug}`} data-sveltekit-preload-data="hover">
						{post.title}
					</a>
				</h2>
				<time datetime={humanDate(post.date)}>{humanDate(post.date)}</time>
				<div>{post.description}</div>
				<div>
					<a href={`/blog/${post.slug}`} data-sveltekit-preload-data="hover">Read more</a>
					{#if post.tldr}
						| <a href={`/blog/${post.slug}?tldr=true`} data-sveltekit-preload-data="hover"
							>Read TLDR</a
						>
					{/if}
				</div>
			</article>
		</li>
	{:else}Sorry, no posts matched your criteria...
	{/each}
</ul>

<style>
	button {
		--border-color: transparent;

		color: var(--text-color-light);
		border-color: var(--border-color);
		transition: color 0.2s ease;
	}

	button:hover,
	button.active {
		color: var(--text-color);
	}

	button.active {
		--background-color: none;

		--border-color: currentColor;
		background-color: var(--background-color);
	}

	li {
		--border-color: var(--background-color-transparent);
		--background-color: none;

		list-style: none;
		padding: 1em;
		transition: all 0.2s ease;
		border: 1px solid;
		border-radius: 3px;

		background-color: var(--background-color);
		border-color: var(--border-color);
	}

	li:hover {
		--background-color: var(--background-color-transparent);
		--border-color: currentColor;

		transform: scale(1.02);
	}

	li + li {
		margin-top: var(--spacing);
	}

	li div {
		margin-top: var(--spacing-small);
		color: var(--text-color-light);
	}

	time {
		color: var(--text-color-light);
	}

	[class~='typescript' i]:hover,
	[class~='typescript' i].active {
		--border-color: hsla(233, 82%, 69%, 0.8);
		--background-color: hsla(233, 82%, 69%, 0.2);
	}
	li[class~='typescript' i] {
		--border-color: hsla(233, 82%, 69%, 0.2);
	}

	[class~='angular' i]:hover,
	[class~='angular' i].active {
		--border-color: hsla(0, 74%, 56%, 0.8);
		--background-color: hsla(0, 74%, 56%, 0.2);
	}
	li[class~='angular' i] {
		--border-color: hsla(0, 74%, 56%, 0.2);
	}

	[class~='.net' i]:hover,
	[class~='.net' i].active {
		--border-color: hsla(261, 80%, 72%, 0.8);
		--background-color: hsla(261, 80%, 72%, 0.2);
	}
	li[class~='.net' i] {
		--border-color: hsla(261, 80%, 72%, 0.2);
	}

	[class~='ngrx' i]:hover,
	[class~='ngrx' i].active {
		--border-color: hsla(289, 65%, 46%, 0.8);
		--background-color: hsla(289, 65%, 46%, 0.2);
	}
	li[class~='ngrx' i] {
		--border-color: hsla(289, 65%, 46%, 0.2);
	}

	[class~='playwright' i]:hover,
	[class~='playwright' i].active {
		--border-color: hsla(135, 59%, 49%, 0.8);
		--background-color: hsla(135, 59%, 49%, 0.2);
	}
	li[class~='playwright' i] {
		--border-color: hsla(135, 59%, 49%, 0.2);
	}

	[class~='rxjs' i]:hover,
	[class~='rxjs' i].active {
		--border-color: hsla(336, 78%, 43%, 0.8);
		--background-color: hsla(336, 78%, 43%, 0.2);
	}
	li[class~='rxjs' i] {
		--border-color: hsla(336, 78%, 43%, 0.2);
	}

	[class~='azure' i]:hover,
	[class~='azure' i].active {
		--border-color: hsla(206, 100%, 36%, 0.8);
		--background-color: hsla(206, 100%, 36%, 0.2);
	}
	li[class~='azure' i] {
		--border-color: hsla(206, 100%, 36%, 0.2);
	}

	[class~='zod' i]:hover,
	[class~='zod' i].active {
		--border-color: hsla(215, 54%, 33%, 0.8);
		--background-color: hsla(215, 54%, 33%, 0.2);
	}
	li[class~='zod' i] {
		--border-color: hsla(215, 54%, 33%, 0.2);
	}
</style>
