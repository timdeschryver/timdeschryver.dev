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
	import Support from '$lib/Support.svelte';
	import { humanDate } from '$lib/formatters';
	export let post;
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

<h1>{post.metadata.title}</h1>

<div class="time-heading">
	<time datetime={humanDate(post.metadata.date)}>{humanDate(post.metadata.date)}</time>
	{#if post.metadata.modified !== post.metadata.date}
		<span class="time"> | Modified on</span>
		<time datetime={humanDate(post.metadata.modified)}>{humanDate(post.metadata.modified)}</time>
	{/if}
</div>

{@html post.html}

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
</style>
