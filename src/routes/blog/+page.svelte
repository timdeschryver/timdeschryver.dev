<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { humanDate } from '$lib/formatters';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	const { data } = $props();
	const { posts, tags } = data;

	let filter = $state({
		query: null,
		from: null,
		to: null,
	});

	let meta = {
		canonical: 'https://timdeschryver.dev/blog',
		title: "Tim's Blog",
		description: `${posts.length} notes, mainly about Angular and .NET`,
	};

	onMount(() => {
		filter = {
			query: $page.url.searchParams.get('q'),
			from: $page.url.searchParams.get('from'),
			to: $page.url.searchParams.get('to'),
		};
	});

	$effect(() => {
		const params = new URLSearchParams(window.location.search);
		if (filter.query) {
			params.set('q', filter.query);
		} else {
			params.delete('q');
		}

		goto(params.size ? `?${params.toString()}` : '?', {
			noScroll: true,
			replaceState: true,
			keepFocus: true,
		});
	});

	const queryParts = $derived(() => (filter.query || '').split(' '));

	const filteredPosts = $derived(() => {
		let filteredPosts = posts;

		if (filter.query) {
			const parts = queryParts();
			filteredPosts = posts.filter((p) => {
				return parts.every(
					(q) => p.tags.some((t) => match(t, q)) || like(p.title, q) || like(p.description, q),
				);
			});
		}

		if (filter.from) {
			filteredPosts = filteredPosts.filter((p) => new Date(p.date) >= new Date(filter.from));
		}

		if (filter.to) {
			filteredPosts = filteredPosts.filter((p) => new Date(p.date) <= new Date(filter.to));
		}

		return filteredPosts;
	});

	function tagClicked(tag) {
		if (filter.query === tag) {
			filter.query = '';
		} else if (queryParts().includes(tag)) {
			filter.query = queryParts()
				.filter((q) => q !== tag)
				.join(' ');
		} else if (queryParts().join(' ').toLowerCase().includes(tag.toLowerCase())) {
			filter.query = `${filter.query.replace(new RegExp(tag, 'ig'), '').trim()}`;
		} else {
			filter.query = filter.query ? `${filter.query.trim()} ${tag}` : tag;
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
		bind:value={filter.query}
		placeholder="Search"
		autocomplete="off"
		aria-label="Search"
	/>
	<div class="mt-0 search-info">
		<div><small>Found {filteredPosts().length} posts out of {posts.length} posts</small></div>
		{#if filter.from}
			<div class="mt-0"><small>From {filter.from}</small></div>
		{/if}
		{#if filter.to}
			<div class="mt-0"><small>To {filter.to}</small></div>
		{/if}
		<small></small>
	</div>
	{#each tags as tag}
		<button
			class={tag}
			class:active={filter.query === tag ||
				queryParts().join(' ').includes(tag) ||
				queryParts().some((q) => match(q, tag))}
			onclick={() => tagClicked(tag)}
		>
			{tag}
		</button>
	{/each}
</div>

<ul>
	{#each filteredPosts() as post}
		<li style:--accent-color={`var(--${post.color})`}>
			<article>
				<a href={`/blog/${post.slug}`} data-sveltekit-preload-data="hover">
					<h2 style:--post-title="post-title-{post.slug}" class="mark-hover">
						{post.title}
					</h2>
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

	article {
		font-weight: 300;
	}

	@media (prefers-reduced-motion: no-preference) {
		h2 {
			view-transition-name: var(--post-title);
		}
	}
</style>
