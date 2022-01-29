<script context="module" lang="ts">
	export const prerender = true;

	export async function load({ fetch }) {
		const result = await fetch(`/blog.json`);
		const { metadata, tags } = await result.json();
		return {
			props: {
				metadata,
				tags,
			},
		};
	}
</script>

<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { humanDate } from '$lib/formatters';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	export let metadata;
	export let tags;

	let query;
	let params;

	let meta = {
		canonical: 'https://timdeschryver.dev/blog',
		title: "Tim's Blog",
		description: `${metadata.length} notes, mainly about Angular and .NET`,
	};

	onMount(() => {
		params = new URLSearchParams(window.location.search);
		// fallback, in the vercel build `query` seems to be undefined
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

<div />

<div>
	<input
		type="search"
		bind:value={query}
		placeholder="Search"
		autocomplete="off"
		aria-label="Search"
	/>
	{#each tags as tag}
		<button class:active={queryParts.some((q) => match(q, tag))} on:click={() => tagClicked(tag)}>
			{tag}
		</button>
	{/each}
</div>

<ul>
	{#each filteredPosts as post}
		<li>
			<h2>
				<a href={`/blog/${post.slug}`}>
					{post.title}
				</a>
				<time datetime={humanDate(post.date)}>[{humanDate(post.date)}]</time>
			</h2>
			<div>{post.description}</div>
			<div>
				<a href={`/blog/${post.slug}`}>Read more</a>
				{#if post.tldr}
					| <a href={`/blog/${post.slug}?tldr=true`}>Read TLDR</a>
				{/if}
			</div>
		</li>
	{:else}Sorry, no posts matched your criteria...{/each}
</ul>

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

	li div {
		margin-top: var(--spacing-small);
		color: var(--text-color-light);
	}

	li + li {
		margin-top: var(--spacing-large);
	}

	time {
		color: var(--text-color-light);
	}
</style>
