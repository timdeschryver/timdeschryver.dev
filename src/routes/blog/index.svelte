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

	onMount(() => {
		params = new URLSearchParams(window.location.search);
		// fallback, in the vercel build `query` seems to be undefined
		query = $page.query.get('q') || params.get('q') || '';
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

<Head title="Blog - Tim Deschryver" />

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
				<a sveltekit:prefetch href={`/blog/${post.slug}`}>
					{post.title}
				</a>
				<time datetime={humanDate(post.date)}>[{humanDate(post.date)}]</time>
			</h2>
			<p>{post.description}</p>
			<p>
				<a sveltekit:prefetch href={`/blog/${post.slug}`}>Read more</a>
				{#if post.tldr}
					| <a sveltekit:prefetch href={`/blog/${post.slug}?tldr=true`}>Read TLDR</a>
				{/if}
			</p>
		</li>
	{:else}Sorry, no posts matched your criteria...{/each}
</ul>

<style>
	button.active {
		border-color: currentColor;
	}

	p {
		margin-top: var(--spacing-small);
	}

	li + li {
		margin-top: var(--spacing-large);
	}
</style>
