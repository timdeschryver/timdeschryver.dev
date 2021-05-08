<script context="module" lang="ts">
	export const prerender = true;

	export async function load({ fetch }) {
		const result = await fetch(`/blog.json`);
		const { metadata, tags } = await result.json();
		return {
			props: {
				metadata,
				tags
			}
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
				(q) => p.tags.some((t) => match(t, q)) || like(p.title, q) || like(p.description, q)
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
	{#each filteredPosts as post, i}
		<li style="--i: {i}">
			<a sveltekit:prefetch href={`/blog/${post.slug}`} hidden={typeof query !== 'string'}>
				<h2>{post.title}</h2>
				<time datetime={humanDate(post.date)}>{humanDate(post.date)}</time>
			</a>
		</li>
	{:else}Sorry, no posts matched your criteria...{/each}
</ul>

<style>
	time {
		position: absolute;
		left: -15em;
		top: 0;
		font-size: 0.5rem;
		opacity: 0.7;
		letter-spacing: 0.1em;
		line-height: 2.2;
	}

	@media screen and (max-width: 1150px) {
		time {
			display: none;
		}
	}
	a {
		vertical-align: middle;
	}
	h2 {
		margin-top: 0;
		font-size: 0.9em;
	}
	li {
		padding: 0.5em 0;
		border-bottom: 2px solid transparent;
		border-right: 3px solid transparent;
		animation: slide-top 0.3s both;
		animation-delay: calc(var(--i) * 0.05s);
	}
	@keyframes slide-top {
		from {
			transform: translateY(-50%);
			opacity: 0;
		}
	}
	li:first-child {
		margin-top: 0;
	}
	li::before {
		background: none;
	}
	input {
		border: 1px solid;
	}
	button {
		background: var(--prime-color);
		border: none;
		padding: 0.2em 0.5em;
		margin: 0.3em;
		opacity: 0.7;
		border-radius: 2px;
		transition: opacity 300ms;
		cursor: pointer;
		font-size: 0.65rem;
	}
</style>
