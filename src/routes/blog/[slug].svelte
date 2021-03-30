<script context="module" lang="ts">
	export const prerender = true;

	export async function load({ page, fetch }) {
		const result = await fetch(`/blog/${page.params.slug}.json`);
		const { post } = await result.json();
		return {
			props: {
				post
			}
		};
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Support from '$lib/Support.svelte';
	import { humanDate } from '$lib/formatters';

	export let post;

	let tldrToggle;
	let scrollY;

	onMount(() => {
		tldrToggle =
			$page.query.get('tldr') !== null ||
			new URLSearchParams(window.location.search).get('tldr') !== null;
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
</script>

<svelte:head>
	<title>{post.metadata.title} - Tim Deschryver</title>

	<link rel="canonical" href={post.metadata.canonical} />

	<meta name="author" content={post.metadata.author} />
	<meta name="copyright" content={post.metadata.author} />
	<meta name="title" content={post.metadata.title} />
	<meta name="description" content={post.metadata.description} />
	<meta name="keywords" content={post.metadata.tags.join(',')} />
	<meta name="image" content={post.metadata.banner} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={post.metadata.banner} />
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

<h1>{post.metadata.title}</h1>

<div class="side-actions" hidden={(scrollY || 0) < 330}>
	<a href="/blog">All posts</a>
	{#if post.tldr}
		<button on:click={tldrClicked}>{tldrToggle ? 'Back to post' : 'Just the code'}</button>
	{/if}
</div>

<div class="time-heading">
	<time datetime={humanDate(post.metadata.date)}>{humanDate(post.metadata.date)}</time>
	{#if post.metadata.modified !== post.metadata.date}
		<span class="time"> | Modified on</span>
		<time datetime={humanDate(post.metadata.modified)}>{humanDate(post.metadata.modified)}</time>
	{/if}
</div>

{#if post.tldr}
	<button class="tldr" on:click={tldrClicked}>
		👀 {tldrToggle ? 'I want to read the blog post' : 'Just show me the code already '}</button
	>
{/if}

{#if tldrToggle && post.tldr}
	{@html post.tldr}
{:else}
	{@html post.html}
{/if}

<hr />

<Support />

<div class="article-actions">
	<a
		class="article-action"
		target="_blank"
		rel="nofollow noreferrer"
		href="https://timdeschryver.dev/support"
	>
		Support the blog
	</a>
	<a
		class="article-action"
		target="_blank"
		rel="nofollow noreferrer"
		href="https://twitter.com/intent/tweet?text={post.metadata.title}&via=tim_deschryver&url={post
			.metadata.canonical}"
	>
		Share on Twitter
	</a>
	<a
		class="article-action"
		href="https://twitter.com/search?q={post.metadata.canonical}"
		target="_blank"
		rel="nofollow noreferrer"
	>
		Discuss on Twitter
	</a>
	<a class="article-action" target="_blank" rel="nofollow noreferrer" href={post.metadata.edit}>
		Edit on GitHub
	</a>
</div>

<style>
	h1 {
		word-break: break-word;
	}
	.article-action {
		background: none;
		margin: 0;
		cursor: pointer;
		text-decoration: none;
		text-transform: uppercase;
		color: var(--prime-color);
		font-size: 0.75rem;
		line-height: 2.5;
		border: none;
		font-weight: 900;
		white-space: nowrap;
	}
	.article-action:not(:last-child) {
		margin-right: 17px;
	}
	.article-actions {
		text-align: center;
	}
	.time-heading {
		margin-top: 0;
	}

	.tldr {
		background: none;
		border: none;
		text-align: center;
		font-weight: 900;
		font-size: 1rem;
	}

	.side-actions {
		display: block;
		position: fixed;
		margin: 0;
		top: 20px;
		left: 20px;
	}

	.side-actions * {
		padding: 4px;
		font-size: 0.8rem;
		display: block;
		text-align: center;
		line-height: 2;
	}

	@media screen and (max-width: 1150px) {
		.side-actions {
			display: none;
		}
	}
</style>
