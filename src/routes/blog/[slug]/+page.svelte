<script lang="ts">
	import { onDestroy, onMount, afterUpdate } from 'svelte';
	import Support from '$lib/Support.svelte';
	import { humanDate } from '$lib/formatters';
	import Head from '$lib/Head.svelte';
	import Comments from '../../../lib/Comments.svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	const { post } = data;

	const logos = post.metadata.tags
		.map((tag) => {
			switch (tag.toLowerCase()) {
				case '.net':
				case 'dotnet':
					return { src: 'dotnet.svg', alt: 'The .NET logo' };
				case 'angular':
					return { src: 'angular.svg', alt: 'The Angular logo' };
				case 'playwright':
					return { src: 'playwright.svg', alt: 'The Playwright logo' };
				case 'ngrx':
					return { src: 'ngrx.svg', alt: 'The NgRx logo' };
				case 'azure':
					return { src: 'azure.svg', alt: 'The Azure logo' };
				default:
					return null;
			}
		})
		.filter(Boolean);

	let tldrToggle;
	let scrollY;

	let pres: HTMLElement[] = [];

	onMount(() => {
		pres = [...(document.querySelectorAll('pre') as any)];

		pres.forEach((pre) => pre.addEventListener('click', copyOnClick));

		if (!window.location.hash) {
			requestAnimationFrame(() => {
				window.scrollTo({ top: document.querySelector('header').clientHeight + 25 });
			});
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			pres.forEach((pre) => pre.removeEventListener('click', copyOnClick));
		}
	});

	let headings = null;
	afterUpdate(() => {
		tldrToggle = new URLSearchParams(window.location.search).get('tldr') !== null;

		headings = tldrToggle
			? null
			: headings || window.history.pushState
			? [...(document.querySelectorAll('main h2,h3') as any)].reverse()
			: [];
	});

	$: if (tldrToggle !== undefined) {
		let params = new URLSearchParams(window.location.search);

		if (tldrToggle) {
			params.set('tldr', '1');
			window.history.replaceState(window.history.state, '', `${location.pathname}?${params}`);
		} else {
			params.delete('tldr');
			window.history.replaceState(window.history.state, '', `${location.pathname}`);
		}
	}

	function tldrClicked() {
		tldrToggle = !tldrToggle;
	}

	let lastHeading;
	$: {
		if (typeof window !== 'undefined') {
			if (tldrToggle === false && headings) {
				const heading = headings.find((h) => h.offsetTop <= scrollY);
				if (lastHeading !== heading) {
					lastHeading = heading;
					window.history.replaceState(window.history.state, '', heading ? `#${heading?.id}` : ' ');
				}
			} else if (tldrToggle === true) {
				lastHeading = null;
				window.history.replaceState(window.history.state, '', ' ');
			}
		}
	}

	function copyOnClick(e: PointerEvent) {
		if (e.ctrlKey && navigator.clipboard && navigator.clipboard.writeText) {
			const { origin, pathname } = window.location;
			navigator.clipboard.writeText(`${origin}${pathname}#${(e.currentTarget as HTMLElement).id}`);
		}
	}
</script>

<Head title="{post.metadata.title} - Tim Deschryver" details={false} />

<svelte:head>
	<link rel="canonical" href={post.metadata.canonical} />

	<meta name="author" content={post.metadata.author} />
	<meta name="copyright" content={post.metadata.author} />
	<meta name="title" content={post.metadata.title} />
	<meta name="description" content={post.metadata.description} />
	<meta name="keywords" content={post.metadata.tags.join(',')} />
	<meta name="image" content={post.metadata.banner} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={post.metadata.banner} />
	<meta name="twitter:image:alt" content={post.metadata.title} />
	<meta name="twitter:title" content={post.metadata.title} />
	<meta name="twitter:description" content={post.metadata.description} />
	<meta name="twitter:label1" content="Written by" />
	<meta name="twitter:data1" content={post.metadata.author} />
	<meta name="twitter:label2" content="Published on" />
	<meta name="twitter:data2" content={humanDate(post.metadata.date)} />

	<meta name="og:url" content={post.metadata.canonical} />
	<meta name="og:title" content={post.metadata.title} />
	<meta name="og:description" content={post.metadata.description} />
	<meta name="og:type" content="article" />
	<meta name="og:image" content={post.metadata.banner} />
</svelte:head>

<svelte:window bind:scrollY />

<header>
	<h1>{post.metadata.title}</h1>
	<div class="details">
		<div class="published-at">
			{#if post.metadata.modified !== post.metadata.date}
				<time datetime={humanDate(post.metadata.modified)}>
					Modified {humanDate(post.metadata.modified)}</time
				>
			{:else}
				<time datetime={humanDate(post.metadata.date)}
					>Published {humanDate(post.metadata.date)}</time
				>
			{/if}
		</div>

		<div class="logos">
			{#each logos as logo}
				<img class="mt-0" src="/images/{logo.src}" alt={logo.alt} height="48px" />
			{/each}
		</div>

		<a class="mt-0" href="https://timdeschryver.dev/twitter" rel="external">@tim_deschryver</a>
	</div>
</header>

<div class="side-actions" hidden={(scrollY || 0) < 1000}>
	<a href="/blog">All posts</a>
	{#if post.tldr}
		<button on:click={tldrClicked}>{tldrToggle ? 'Full Version' : 'TLDR Version'}</button>
	{/if}
	{#if post.metadata.translations}
		<div>Translations</div>
		{#each post.metadata.translations as translation}
			<a href={translation.url} rel="external">{translation.language}</a>
		{/each}
	{/if}
</div>

{#if post.metadata.translations}
	<div class="translations">
		<hr />
		<p>This article is also available in:</p>
		<ul>
			{#each post.metadata.translations as translation}
				<li>
					<a href={translation.url} rel="external">{translation.language}</a> by
					<a href={translation.profile} rel="external">{translation.author}</a>
				</li>
			{/each}
		</ul>
		<hr />
	</div>
{/if}

{#if post.tldr}
	<button class="tldr" on:click={tldrClicked}>
		👀 {tldrToggle ? 'I want to read the blog post' : 'Just show me the code already'}</button
	>
{/if}

{#if tldrToggle && post.tldr}
	{@html post.tldr}
{:else}
	{@html post.html}

	{#if post.contributors.length}
		<h5>A warm thank you to the contributors of this blog post</h5>
		<ul class="mt-0">
			{#each post.contributors as [login, name]}
				<li>
					<a href={`https://github.com/${login}`} rel="external">{name}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if post.metadata.incomingLinks.length}
		<h5>Incoming links</h5>
		<ul class="mt-0">
			{#each post.metadata.incomingLinks as link}
				<li>
					<a href={`/blog/${link.slug}`}>{link.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if post.metadata.outgoingLinks.length}
		<h5>Outgoing links</h5>
		<ul class="mt-0">
			{#each post.metadata.outgoingLinks as link}
				<li>
					<a href={`/blog/${link.slug}`}>{link.title}</a>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<Support />

<Comments />

<div class="article-actions">
	<a class="mt-0" target="_blank" rel="external" href="https://timdeschryver.dev/support">
		Support the blog
	</a>
	<a
		class="mt-0"
		target="_blank"
		rel="external"
		href="https://twitter.com/intent/tweet?text={post.metadata.title}&via=tim_deschryver&url={post
			.metadata.canonical}"
	>
		Share on Twitter
	</a>
	<a
		class="mt-0"
		href="https://twitter.com/search?q={post.metadata.canonical}"
		target="_blank"
		rel="external"
	>
		Discuss on Twitter
	</a>
	<a class="mt-0" target="_blank" rel="external" href={post.metadata.edit}> Edit on GitHub </a>
</div>

<style>
	.tldr {
		background: none;
		border: none;
		text-align: center;
		font-weight: 900;
		margin-top: var(--spacing);
	}

	.side-actions {
		display: block;
		position: fixed;
		margin: 0;
		top: 20px;
		left: 20px;
	}

	.side-actions div {
		border: none;
		margin-top: var(--spacing);
	}

	.side-actions > * {
		padding: 4px;
		display: block;
		text-align: center;
		border: 1px solid;
		background: none;
		width: 100%;
		cursor: pointer;
		color: var(--text-color-light);
		margin-top: 3px;
		margin-bottom: 0;
	}

	@media (max-width: 1450px) {
		.side-actions {
			width: 130px;
		}
	}

	@media (max-width: 1380px) {
		.side-actions {
			display: none;
		}
	}

	:global(#svelte > main) > header {
		grid-column: 1 / 4;
		min-height: 100vh;
		min-width: 90%;
		max-width: 90%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-evenly;
		text-align: center;
		margin: 0 auto;
		padding: 0;
		font-size: clamp(1rem, 3vw, 6rem);
	}

	.details {
		display: flex;
		justify-content: space-between;
		margin: 0;
		font-size: 1.5rem;
		width: 100%;
	}

	.details > * {
		margin-top: 0;
	}

	.logos {
		display: flex;
		gap: 0.6em;
		display: none;
	}

	@media screen and (max-width: 1150px) {
		.details {
			font-size: 1rem;
		}
	}

	.article-actions {
		display: flex;
		justify-content: space-evenly;
	}

	.translations ul {
		list-style: none;
		margin-top: var(--spacing-small);
	}

	:global(.tweet-preview) {
		border: 1px solid var(--text-color-subtle);
		border-radius: 0.3em;
		padding: 1em 0.8em;
	}

	:global(.tweet-preview *) {
		margin-top: 0;
	}

	:global(.tweet-preview > *:not(:first-child)) {
		margin-top: 1em;
	}

	:global(.tweet-preview > .header) {
		display: grid;
		grid-template-columns: 48px 1fr;
		align-items: center;
		gap: 1em;
	}

	:global(.tweet-preview .author-profile) {
		border-radius: 100%;
	}

	:global(.tweet-preview > .footer) {
		display: flex;
		justify-content: space-between;
	}

	:global(.tweet-preview .tweet-url) {
		text-decoration: none;
		color: #1da1f2;
		font-weight: 500;
	}

	:global(.tweet-preview .tweet-card) {
		text-decoration: none;
		color: var(--text-color-light);
	}

	:global(.tweet-preview video) {
		margin-top: 0.5em;
	}
</style>
