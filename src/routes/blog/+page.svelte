<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { humanDate } from '$lib/formatters';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { data } = $props();

	let filter = $state({
		query: null,
		from: null,
		to: null,
	});

	const meta = $derived(() => ({
		canonical: 'https://timdeschryver.dev/blog',
		title: "Tim's Blog",
		description: `${data.posts.length} notes, mainly about Angular and .NET`,
	}));

	const searchablePosts = $derived(() =>
		data.posts.map((post) => ({
			post,
			dateValue: Date.parse(post.date),
			titleLower: post.title.toLowerCase(),
			descriptionLower: post.description.toLowerCase(),
			tagsLower: post.tags.map((tag) => tag.toLowerCase()),
		})),
	);

	let filterUrlSyncHandle: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		filter = {
			query: $page.url.searchParams.get('q'),
			from: $page.url.searchParams.get('from'),
			to: $page.url.searchParams.get('to'),
		};
	});

	$effect(() => {
		const query = filter.query?.trim();
		const from = filter.from;
		const to = filter.to;

		clearTimeout(filterUrlSyncHandle);

		filterUrlSyncHandle = setTimeout(() => {
			const params = new URLSearchParams(window.location.search);
			setOrDeleteParam(params, 'q', query);
			setOrDeleteParam(params, 'from', from);
			setOrDeleteParam(params, 'to', to);

			const nextSearch = params.toString();
			const currentSearch = window.location.search.startsWith('?')
				? window.location.search.slice(1)
				: window.location.search;

			if (nextSearch !== currentSearch) {
				window.history.replaceState(
					window.history.state,
					'',
					nextSearch ? `?${nextSearch}` : window.location.pathname,
				);
			}
		}, 150);

		return () => clearTimeout(filterUrlSyncHandle);
	});

	const rawQueryParts = $derived(() =>
		(filter.query || '')
			.split(/\s+/)
			.map((part) => part.trim())
			.filter(Boolean),
	);

	const queryParts = $derived(() => rawQueryParts().map((part) => part.toLowerCase()));
	const normalizedQuery = $derived(() => queryParts().join(' '));

	const filteredPosts = $derived(() => {
		let filteredPosts = searchablePosts();
		const parts = queryParts();

		if (parts.length) {
			filteredPosts = searchablePosts().filter((p) => {
				return parts.every(
					(q) =>
						p.tagsLower.some((t) => match(t, q)) ||
						like(p.titleLower, q) ||
						like(p.descriptionLower, q),
				);
			});
		}

		if (filter.from) {
			const from = Date.parse(filter.from);

			if (!Number.isNaN(from)) {
				filteredPosts = filteredPosts.filter((p) => p.dateValue >= from);
			}
		}

		if (filter.to) {
			const to = Date.parse(filter.to);

			if (!Number.isNaN(to)) {
				filteredPosts = filteredPosts.filter((p) => p.dateValue <= to);
			}
		}

		return filteredPosts.map(({ post }) => post);
	});

	function tagClicked(tag) {
		const normalizedTag = tag.toLowerCase();

		if (rawQueryParts().some((part) => part.toLowerCase() === normalizedTag)) {
			filter.query = rawQueryParts()
				.filter((part) => part.toLowerCase() !== normalizedTag)
				.join(' ');
		} else if (normalizedQuery().includes(normalizedTag)) {
			filter.query = `${(filter.query || '')
				.replace(new RegExp(escapeRegExp(tag), 'ig'), '')
				.replace(/\s+/g, ' ')
				.trim()}`;
		} else {
			filter.query = filter.query ? `${filter.query.trim()} ${tag}` : tag;
		}
	}

	function isTagActive(tag) {
		const normalizedTag = tag.toLowerCase();

		return (
			normalizedQuery().includes(normalizedTag) || queryParts().some((q) => match(q, normalizedTag))
		);
	}

	function setOrDeleteParam(params, key, value) {
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
	}

	function escapeRegExp(value) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function like(text, value) {
		return text.includes(value);
	}

	function match(text, value) {
		return text === value;
	}
</script>

<Head title="Blog - Tim Deschryver" details={false} />

<svelte:head>
	<link rel="canonical" href={meta().canonical} />

	<meta name="title" content={meta().title} />
	<meta name="description" content={meta().description} />

	<meta name="twitter:title" content={meta().title} />
	<meta name="twitter:description" content={meta().description} />

	<meta name="og:url" content={meta().canonical} />
	<meta name="og:title" content={meta().title} />
	<meta name="og:description" content={meta().description} />
	<meta name="og:type" content="website" />
</svelte:head>

<div class="mt-normal">
	<input
		type="search"
		bind:value={filter.query}
		placeholder="Search"
		autocomplete="off"
		aria-label="Search"
	/>
	<div class="mt-0 search-info">
		<div><small>Found {filteredPosts().length} posts out of {data.posts.length} posts</small></div>
		{#if filter.from}
			<div class="mt-0"><small>From {filter.from}</small></div>
		{/if}
		{#if filter.to}
			<div class="mt-0"><small>To {filter.to}</small></div>
		{/if}
		<small></small>
	</div>
	{#each data.tags as tag}
		<button class={tag} class:active={isTagActive(tag)} onclick={() => tagClicked(tag)}>
			{tag}
		</button>
	{/each}
</div>

<ul>
	{#each filteredPosts() as post (post.slug)}
		<li style:--accent-color={`var(--${post.color})`}>
			<article>
				<a href={`/blog/${post.slug}`} data-sveltekit-preload-data="hover">
					<h2 style:--post-title="post-title-{post.slug}" class="mark-hover">
						{post.title}
					</h2>
					{#if post.series}
						<div class="series-indicator">
							<span class="series-label">Series:</span>
							<span class="series-name">{post.series.name}</span>
							<span class="series-progress">({post.series.order}/{post.series.total})</span>
						</div>
					{/if}
					<time datetime={humanDate(post.date)}>{humanDate(post.date)}</time>
					<div>{post.description}</div>
				</a>
				<div>
					<a
						href={`/blog/${post.slug}`}
						data-sveltekit-preload-data="hover"
						class="bold mark-hover"
					>
						Read more</a
					>
					{#if post.tldr}
						| <a
							href={`/blog/${post.slug}?tldr=true`}
							data-sveltekit-preload-data="hover"
							class="bold mark-hover">Read TLDR</a
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
		color: var(--text-color-light);
		border: 1px solid transparent;
		transition: color 0.2s ease;
	}

	button:hover,
	button.active {
		color: var(--text-color);
		border-color: hsla(var(--accent-color), 0.8);
	}

	button.active {
		background-color: hsla(var(--accent-color), 0.1);
		border-color: hsla(var(--accent-color), 0.8);
	}

	li {
		list-style: none;
		padding: 1em;
		border: 1px solid;
		border-left-width: 8px;
		border-radius: 3px;
		border-color: hsla(var(--accent-color), 0.2);
	}

	li:hover {
		transition-property: background-color, border-color, border-width, transform;
		transition-duration: 0.2s;
		transition-timing-function: ease-out;
		transform: scale(1.05);
		background-color: hsla(var(--accent-color), 0.1);
		border-color: hsla(var(--accent-color), 0.8);
		border-left-width: 16px;
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

	.search-info {
		color: var(--text-color-light);
		text-align: right;
	}

	.series-indicator {
		font-size: 0.875rem;
		color: var(--text-color-light);
		margin: var(--spacing-small) 0;
		line-height: 1.4;
	}

	.series-label {
		font-weight: 500;
	}

	.series-name {
		color: var(--text-color);
		font-weight: 400;
	}

	.series-progress {
		opacity: 0.8;
		font-weight: 300;
	}

	article {
		font-weight: 300;
	}

	@media (prefers-reduced-motion: no-preference) {
		h2 {
			view-transition-name: var(--post-title);
		}
	}
</style>
