<script lang="ts">
	import { onMount } from 'svelte';
	import Support from '$lib/Support.svelte';
	import { humanDate } from '$lib/formatters';
	import Head from '$lib/Head.svelte';
	import Comments from '$lib/Comments.svelte';
	import { blog } from '$lib/current-blog.svelte';
	import Share from '$lib/Share.svelte';
	import Actions from '$lib/Actions.svelte';
	import BlogSeries from '$lib/BlogSeries.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Newsletter from '$lib/Newsletter.svelte';
	import Ad from '$lib/Ad.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	const { data } = $props();
	const { post } = data;

	const tldr = $derived(() => blog.blog?.state === 'tldr');

	// svelte-ignore state_referenced_locally
	codeBlockLifeCycle(tldr);
	copyLifeCycle();

	onMount(() => {
		const hasTldr = post.tldr && $page.url.searchParams.get('tldr') === 'true';
		blog.loadBlog(post.metadata.title, hasTldr ? 'tldr' : post.tldr ? 'detailed' : 'single');
		return () => blog.reset();
	});

	let scrollY = $state(0);
	let header: HTMLElement | null = $state(null);
	const sideNavsVisible = $derived(
		() =>
			scrollY &&
			header &&
			header.getBoundingClientRect().bottom + header.offsetHeight - 220 < scrollY,
	);

	function headerClick(evt: MouseEvent) {
		gotoHeader(evt.currentTarget as HTMLElement);
	}

	function tocClick(evt: MouseEvent) {
		evt.preventDefault();
		const element = document.querySelector((evt.currentTarget as HTMLElement).getAttribute('href'));
		gotoHeader(element as HTMLElement);
	}

	function gotoHeader(header: HTMLElement) {
		const y = header.getBoundingClientRect().top + window.scrollY - 100;
		window.scrollTo({ top: y, behavior: 'smooth' });
	}

	const htmlStyle = `<style> 
		main {
			--accent-color: var(--${post.metadata.color ?? 'base-color'});
		}

		main h1, 
		main h2,  
		main h3, 
		main h4,
		main h5, 
		main h6 {
			color: hsla(var(--accent-color), 1);
		}
	</style>`;

	const headings = $derived(() => {
		if (!browser) {
			return [];
		}
		const hasTldr = post.tldr && $page.url.searchParams.get('tldr') === 'true';
		return hasTldr
			? []
			: ([...document.querySelectorAll('main > h2,h3')].reverse() as HTMLElement[]);
	});

	$effect(() => {
		headings().forEach((h) => {
			h.removeEventListener('click', headerClick);
			h.addEventListener('click', headerClick);
		});
		return () => {
			headings().forEach((h) => {
				h.removeEventListener('click', headerClick);
			});
		};
	});

	const pres = $derived(() => {
		return browser ? [...document.querySelectorAll('pre')] : [];
	});

	$effect(() => {
		pres().forEach((pre) => {
			pre.removeEventListener('click', copyLinkToCodeBlock);
			pre.addEventListener('click', copyLinkToCodeBlock);
		});
		return () => {
			pres().forEach((pre) => {
				pre.removeEventListener('click', copyLinkToCodeBlock);
			});
		};
	});

	let lastHeadingId = $state(null);
	$effect(() => {
		if (browser) {
			if (blog.blog?.state === 'tldr' && lastHeadingId) {
				lastHeadingId = null;
			} else if (blog.blog?.state !== 'tldr' && headings()) {
				const heading = headings().find((h) => h.offsetTop <= scrollY + 110);
				if (lastHeadingId !== heading?.id) {
					lastHeadingId = heading?.id;
				}
			}
		}
	});

	function copyLinkToCodeBlock(e: PointerEvent) {
		if (e.ctrlKey && navigator.clipboard && navigator.clipboard.writeText) {
			const { origin, pathname } = window.location;
			navigator.clipboard.writeText(`${origin}${pathname}#${(e.currentTarget as HTMLElement).id}`);
		}
	}
</script>

<Head title={post.metadata.title} details={false} />

<svelte:head>
	<link rel="canonical" href={post.metadata.canonical} />

	<meta name="author" content={post.metadata.author} />
	<meta name="copyright" content={post.metadata.author} />
	<meta name="keywords" content={post.metadata.tags.join(',')} />
	<meta name="title" property="og:title" content={post.metadata.title} />
	<meta name="description" property="og:description" content={post.metadata.description} />
	<meta name="image" property="og:image" content={post.metadata.banner} />
	<meta name="publish_date" property="og:publish_date" content={humanDate(post.metadata.date)} />
	<meta name="og:type" property="og:type" content="article" />
	<meta name="og:url" property="og:url" content={post.metadata.canonical} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={post.metadata.banner} />
	<meta name="twitter:image:alt" content={post.metadata.title} />
	<meta name="twitter:title" content={post.metadata.title} />
	<meta name="twitter:description" content={post.metadata.description} />
	<meta name="twitter:label1" content="Written by" />
	<meta name="twitter:data1" content={post.metadata.author} />
	<meta name="twitter:label2" content="Published on" />
	<meta name="twitter:data2" content={humanDate(post.metadata.date)} />
</svelte:head>

<svelte:window bind:scrollY />

<header bind:this={header} style:--post-title="post-title-{post.metadata.slug}">
	<h1>{post.metadata.title}</h1>
	<img class="banner" src={post.metadata.banner} alt={post.metadata.title} />
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
			{#each post.metadata.logos as logo}
				<img class="mt-0 logo" src="/images/{logo.src}" alt={logo.alt} />
			{/each}
		</div>

		<div class="mt-0 author">
			<img class="author-img" src="/images/tim.jpg" alt="profile" />
			<div class="mt-0">
				<div class="author-name">Tim Deschryver</div>
				<div class="author-source mt-0">timdeschryver.dev</div>
			</div>
		</div>
	</div>
</header>

<aside class="left-nav" hidden={!sideNavsVisible()}>
	{#if post.metadata.toc.length > 1}
		<div class="toc" hidden={blog.blog?.state === 'tldr'}>
			<h3>On this page</h3>
			<ul>
				{#each post.metadata.toc as { slug, description, level }}
					<li class:active={lastHeadingId === slug} style={`--level:${level - 2}`}>
						<a href={`#${slug}`} onclick={tocClick}>{description}</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div>
		<Ad />
	</div>

	{#if post.metadata.translations}
		<div>
			<h4>Read this post in</h4>
			{#each post.metadata.translations as translation}
				<a href={translation.url} rel="external">{translation.language}</a>
			{/each}
		</div>
	{/if}

	<Share title="Share this post" text={post.metadata.title} url={post.metadata.canonical} />
</aside>

{#if post.metadata.translations && post.metadata.translations.length > 0}
	<div class="translations">
		<hr />
		<p>Thanks to the ❤️ community you can also read this post in:</p>
		<ul>
			{#each post.metadata.translations as translation}
				<li>
					<a href={translation.url} rel="external" class="mark">{translation.language}</a> thanks to
					<a href={translation.profile} rel="external" class="mark">{translation.author}</a>
				</li>
			{/each}
		</ul>
		<hr />
	</div>
{/if}

{#if post.tldr}
	<button class="tldr" onclick={blog.toggleTldr}>
		👀 {blog.blog?.state === 'tldr'
			? 'I want to read the blog post'
			: 'Just show me the code already'}</button
	>
{/if}

{@html htmlStyle}

{#if post.metadata.series && post.metadata.seriesPosts}
	<BlogSeries series={post.metadata.series} seriesPosts={post.metadata.seriesPosts} />
{/if}

{#if tldr()}
	{@html post.tldr}
{:else}
	{@html post.html}

	{#if post.contributors.length}
		<h4>A warm thank you to the contributors of this blog post</h4>
		<ul class="mt-0">
			{#each post.contributors as [login, name]}
				<li>
					<a href={`https://github.com/${login}`} rel="external">{name ?? login}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if post.metadata.incomingLinks.length}
		<h4>Incoming links</h4>
		<ul class="mt-0" data-sveltekit-reload>
			{#each post.metadata.incomingLinks as link}
				<li>
					<a href={`/blog/${link.slug}`} class="mark">{link.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if post.metadata.outgoingLinks.length}
		<h4>Outgoing links</h4>
		<ul class="mt-0" data-sveltekit-reload>
			{#each post.metadata.outgoingLinks as link}
				<li>
					<a href={`/blog/${link.slug}`} class="mark">{link.title}</a>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

<Actions editUrl={post.metadata.edit} />

<Newsletter beehiivId={post.beehiivId} />

<Support />

<Share title="Share this post" text={post.metadata.title} url={post.metadata.canonical} />

<Comments />

<style>
	.tldr {
		background: none;
		border: none;
		text-align: center;
		font-weight: bolder;
		margin-bottom: var(--spacing);
	}

	:global(main > p:first-of-type) {
		margin-top: 0;
	}

	.left-nav {
		display: block;
		position: fixed;
		padding-top: 2.5em;
		padding-right: 2.5em;
		padding-left: 3em;
		text-align: left;
		width: 20%;
		transition: all 0.2s;
		background-color: var(--background-color-subtle);
		height: 100%;
		margin-top: 0;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		overflow: auto;
	}

	.left-nav > * {
		display: block;
		background: none;
		cursor: pointer;
		color: var(--text-color-light);
		margin-top: 3px;
		margin-bottom: 0;
	}

	.left-nav > div + div {
		margin-top: var(--spacing);
	}

	.toc {
		max-height: 75vh;
		margin-top: 0;
		overflow: auto;
	}

	@media (max-width: 1799px) {
		.left-nav {
			width: 25%;
		}

		:global(main[data-segment*='blog/'] ~ footer) {
			padding-left: 25%;
		}
	}

	@media (max-width: 1022px) {
		.left-nav {
			display: none;
		}

		:global(main[data-segment*='blog/'] ~ footer) {
			padding-left: 0;
		}
	}

	.toc ul {
		list-style: none;
		font-size: 1rem;
		color: var(--text-color-light-subtle);
		transition: all 0.25s;
	}

	.toc ul li.active {
		color: var(--text-color);
		font-weight: 600;
	}

	.toc ul li.active::first-letter {
		font-size: 1.5rem;
		line-height: 1;
		font-weight: 900;
	}

	.toc ul li:hover {
		color: var(--text-color);
		font-weight: 600;
	}

	.toc ul li {
		margin-left: calc((var(--level)) * 1em);
	}

	:global(body > div > main) > header {
		grid-column: 1 / 4;
		min-height: 100dvh;
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

	.banner {
		display: none;
	}

	.details {
		display: flex;
		justify-content: space-between;
		margin: 0;
		font-size: 1.5rem;
		width: 100%;
		align-items: center;
	}

	.author-img,
	.logo {
		width: 64px;
		height: 64px;
	}

	.author {
		display: flex;
		align-items: center;
		text-align: left;
		gap: 0.5em;
	}

	.author-name {
		font-size: 1.3rem;
	}
	.author-source {
		font-size: 0.8rem;
		transform: translate(3px, -8px);
		display: none;
	}

	.author-img {
		width: auto;
		border-radius: 100%;
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

		.author-name {
			font-size: 1rem;
		}

		.author-img,
		.logo {
			width: 48px;
			height: 48px;
		}
	}

	.translations {
		margin-bottom: 2em;
	}

	.translations ul {
		list-style: none;
		margin-top: var(--spacing-small);
	}

	@media (prefers-reduced-motion: no-preference) {
		header {
			view-transition-name: var(--post-title);
		}
	}
</style>
