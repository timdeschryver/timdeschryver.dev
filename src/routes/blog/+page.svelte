<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { humanDate } from '$lib/formatters';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { onMount, tick } from 'svelte';

	let { data } = $props();

	type Filter = {
		query: string | null;
		from: string | null;
		to: string | null;
	};

	let filter = $state<Filter>({
		query: null,
		from: null,
		to: null,
	});

	let filterUrlSyncHandle: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		filter = {
			query: $page.url.searchParams.get('q'),
			from: $page.url.searchParams.get('from'),
			to: $page.url.searchParams.get('to'),
		};
	});

	$effect(() => {
		const query = filter.query?.trim() || null;
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
		let filteredPosts = data.posts;
		const parts = queryParts();

		if (parts.length) {
			filteredPosts = data.posts.filter((post) => {
				const titleLower = post.title.toLowerCase();
				const descriptionLower = post.description.toLowerCase();
				const tagsLower = post.tags.map((tag) => tag.toLowerCase());

				return parts.every(
					(q) =>
						tagsLower.some((tag) => match(tag, q)) ||
						like(titleLower, q) ||
						like(descriptionLower, q),
				);
			});
		}

		if (filter.from) {
			const from = Date.parse(filter.from);

			if (!Number.isNaN(from)) {
				filteredPosts = filteredPosts.filter((post) => Date.parse(post.date) >= from);
			}
		}

		if (filter.to) {
			const to = Date.parse(filter.to);

			if (!Number.isNaN(to)) {
				filteredPosts = filteredPosts.filter((post) => Date.parse(post.date) <= to);
			}
		}

		return filteredPosts;
	});

	function tagClicked(tag: string) {
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

	function isTagActive(tag: string) {
		const normalizedTag = tag.toLowerCase();

		return (
			normalizedQuery().includes(normalizedTag) || queryParts().some((q) => match(q, normalizedTag))
		);
	}

	async function clearFilters() {
		filter = { query: null, from: null, to: null };
		await tick();
		document.querySelector<HTMLInputElement>('#blog-search')?.focus();
	}

	function setOrDeleteParam(params: URLSearchParams, key: string, value: string | null) {
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
	}

	function escapeRegExp(value: string) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function like(text: string, value: string) {
		return text.includes(value);
	}

	function match(text: string, value: string) {
		return text === value;
	}
</script>

<Head
	title="Blog - Tim Deschryver"
	description={`${data.posts.length} articles about .NET, Angular, testing, and developer tooling.`}
	canonical="https://timdeschryver.dev/blog"
/>

<header class="page-intro">
	<div class="eyebrow">Writing · {data.posts.length} articles</div>
	<h1>Notes from building software</h1>
	<p>
		Practical ideas, experiments, and lessons learned while working with .NET, Angular, and the
		tools around them.
	</p>
</header>

<div class="filters">
	<label for="blog-search">Search articles</label>
	<input
		id="blog-search"
		type="search"
		bind:value={filter.query}
		placeholder="Title, topic, or keyword"
		autocomplete="off"
	/>
	<div class="search-info" role="status" aria-live="polite" aria-atomic="true">
		<span class="result-summary">
			<strong>{filteredPosts().length}</strong>
			{#if normalizedQuery() || filter.from || filter.to}
				{filteredPosts().length === 1 ? 'article matches' : 'articles match'} your filters
			{:else}
				{filteredPosts().length === 1 ? 'article' : 'articles'}
			{/if}
		</span>
		{#if filter.from || filter.to}
			<span class="date-range">
				{filter.from ? `From ${filter.from}` : ''}{filter.from && filter.to ? ' / ' : ''}{filter.to
					? `To ${filter.to}`
					: ''}
			</span>
		{/if}
	</div>
	{#each data.tags as tag (tag)}
		<button
			class={tag}
			class:active={isTagActive(tag)}
			aria-pressed={isTagActive(tag)}
			onclick={() => tagClicked(tag)}
		>
			{tag}
		</button>
	{/each}
</div>

<ul>
	{#each filteredPosts() as post, index (post.slug)}
		<li data-post-slug={post.slug} style:--accent-color={`var(--${post.color})`}>
			<article>
				<span class="post-order" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
				<a
					class="post-link"
					href={resolve('/blog/[slug]', { slug: post.slug })}
					data-sveltekit-preload-data="hover"
				>
					<h2 style:--post-title="post-title-{post.slug}" class="mark-hover">
						{post.title}
					</h2>
					<div class="post-description">{post.description}</div>
				</a>
				<div class="post-footer">
					<div class="post-meta">
						<time datetime={post.date}>{humanDate(post.date)}</time>
						{#if post.series}
							<span class="meta-separator" aria-hidden="true">/</span>
							<span class="series-indicator">
								<span class="series-label">Series</span>
								<span class="series-name">{post.series.name}</span>
								<span class="series-progress">{post.series.order}/{post.series.total}</span>
							</span>
						{/if}
					</div>
					<div class="post-actions">
						<a
							href={resolve('/blog/[slug]', { slug: post.slug })}
							data-sveltekit-preload-data="hover"
							class="bold mark-hover"
						>
							Read more</a
						>
						{#if post.tldr}
							| <a
								href={resolve('/blog/[slug]?tldr=true', { slug: post.slug })}
								data-sveltekit-preload-data="hover"
								class="bold mark-hover">Read TLDR</a
							>
						{/if}
					</div>
				</div>
			</article>
		</li>
	{:else}
		<li class="empty-state" aria-live="polite">
			<div class="empty-state-copy">
				<div class="empty-state-label">No articles found</div>
				<h2>Nothing matched this search.</h2>
				<p>
					Try fewer keywords, remove a topic, or clear the filters to see all {data.posts.length}
					articles.
				</p>
				<button onclick={clearFilters}>Clear all filters</button>
			</div>
		</li>
	{/each}
</ul>

<style>
	.page-intro {
		position: relative;
		margin-top: clamp(4rem, 10vh, 7rem);
		padding: 0 0 clamp(2rem, 6vw, 4rem);
		border-bottom: 1px solid var(--line-color);
	}

	.page-intro h1 {
		max-width: 11ch;
		margin-top: clamp(1.25rem, 3vw, 2.25rem);
		font-size: clamp(3rem, 8vw, 6rem);
		line-height: 0.95;
		letter-spacing: -0.06em;
		text-wrap: balance;
	}

	.page-intro p {
		max-width: 48ch;
		color: var(--text-color-light);
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

	.filters {
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--line-color);
	}

	.filters label {
		display: block;
		margin-bottom: 0.4rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.filters input {
		border: 1px solid var(--line-color);
		border-radius: 2px;
		background: var(--background-color-subtle);
		padding: 0.5rem 1rem;
		color: var(--text-color);
		font-family: var(--head-font);
		font-size: clamp(1.1rem, 3vw, 1.2rem);
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease;
	}

	.filters input::placeholder {
		color: var(--text-color-light);
	}

	.filters input:hover {
		border-color: var(--text-color-light);
	}

	.filters input:focus-visible {
		border-color: currentColor;
		background: var(--background-color);
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	button {
		color: var(--text-color-light);
		border: 0;
		border-bottom: 1px solid transparent;
		border-radius: 0;
		padding: 0.15em 0;
		margin-right: 0.8em;
		transition: color 0.2s ease;
	}

	button:hover,
	button.active {
		color: var(--text-color);
		border-color: currentColor;
	}

	button.active {
		background: transparent;
	}

	ul {
		margin-top: 0;
	}

	li {
		list-style: none;
		position: relative;
		padding: clamp(2rem, 5vw, 3.5rem) 0;
		border-bottom: 1px solid var(--line-color);
	}

	li:hover {
		background: linear-gradient(90deg, transparent, hsla(var(--accent-color), 0.06));
	}

	.empty-state {
		padding: clamp(3rem, 8vw, 6rem) 0;
		background: linear-gradient(90deg, var(--background-color-subtle), transparent 75%);
	}

	.empty-state:hover {
		background: linear-gradient(90deg, var(--background-color-subtle), transparent 75%);
	}

	.empty-state-copy {
		max-width: 42rem;
		margin-top: 0;
		padding-left: clamp(1rem, 3vw, 2.5rem);
		color: var(--text-color);
	}

	.empty-state-label {
		margin-top: 0;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.empty-state h2 {
		margin-top: 0.75rem;
		font-size: clamp(1.7rem, 4vw, 2.6rem);
	}

	.empty-state p {
		max-width: 48ch;
		color: var(--text-color-light);
	}

	.empty-state button {
		width: max-content;
		margin: 1.25rem 0 0;
		padding: 0 0 0.2rem;
		border: 0;
		border-bottom: 1px solid currentColor;
		color: var(--text-color);
		font-family: var(--head-font);
		font-size: 0.85rem;
		font-weight: 650;
	}

	li div {
		margin-top: var(--spacing-small);
		color: var(--text-color-light);
	}

	li h2 {
		font-size: clamp(1.65rem, 4vw, 2.45rem);
		line-height: 1.1;
		text-wrap: balance;
	}

	time {
		color: var(--text-color-light);
	}

	.search-info {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin: 0.75rem 0 1rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.85rem;
		text-align: left;
	}

	.result-summary strong {
		margin-right: 0.2rem;
		color: var(--text-color);
		font-size: 1.35rem;
		font-variant-numeric: tabular-nums;
		font-weight: 650;
	}

	.date-range {
		padding-left: 0.75rem;
		border-left: 1px solid var(--line-color);
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.post-link {
		display: block;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.post-meta {
		display: flex;
		gap: 0.65rem;
		align-items: baseline;
		margin-top: 0;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.post-description {
		margin-top: var(--spacing-small);
	}

	.post-footer {
		display: grid;
		gap: 0.35rem;
		margin-top: 1.25rem;
	}

	.post-actions {
		margin-top: 0;
	}

	.series-indicator {
		display: inline-flex;
		gap: 0.35rem;
		align-items: baseline;
		color: var(--text-color-light);
	}

	.series-label {
		color: var(--text-color-subtle);
	}

	.series-name {
		color: var(--text-color);
		letter-spacing: 0.03em;
		text-transform: none;
	}

	.series-progress {
		font-variant-numeric: tabular-nums;
	}

	article {
		display: grid;
		grid-template-columns: 2.75rem minmax(0, 1fr);
		column-gap: clamp(0.75rem, 2vw, 1.25rem);
		font-weight: 380;
	}

	article > a,
	article > div {
		grid-column: 2;
		min-width: 0;
	}

	.post-order {
		grid-column: 1;
		grid-row: 1 / span 2;
		margin-top: 0.4rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		font-weight: 650;
		letter-spacing: 0.08em;
		transition: color 0.2s ease;
	}

	li:hover .post-order {
		color: var(--text-color);
	}

	@media (max-width: 620px) {
		.page-intro::after {
			display: none;
		}

		.page-intro {
			margin-top: 3rem;
			padding-bottom: 2.5rem;
		}

		.filters {
			white-space: normal;
		}

		.filters input,
		.search-info {
			width: 100%;
			white-space: normal;
		}

		.search-info {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.25rem;
		}

		.date-range {
			padding-left: 0;
			border-left: 0;
		}

		.empty-state {
			padding: 2.5rem 0;
		}

		article {
			grid-template-columns: 1.75rem minmax(0, 1fr);
			column-gap: 0.65rem;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		h2 {
			view-transition-name: var(--post-title);
		}
	}
</style>
