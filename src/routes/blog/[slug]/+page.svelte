<script lang="ts">
	import '../../code.css';
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
	import Ad from '$lib/Ad.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { publicUrl } from '$lib/variables';
	import { standardSite } from '$lib/standard-site';

	let { data } = $props();
	const post = $derived(data.post);
	const relatedLinks = $derived.by(() => {
		const links = [...post.metadata.outgoingLinks, ...post.metadata.incomingLinks];
		return [...new Map(links.map((link) => [link.slug, link])).values()];
	});

	const showTldr = $derived(() => blog.blog?.state === 'tldr');
	let tldrHtml = $state<string | null>(null);
	let tldrError = $state(false);

	// svelte-ignore state_referenced_locally
	codeBlockLifeCycle(showTldr);
	// svelte-ignore state_referenced_locally
	copyLifeCycle(showTldr);

	onMount(() => {
		const showTldrInitially = post.hasTldr && $page.url.searchParams.get('tldr') === 'true';
		blog.loadBlog(
			post.metadata.title,
			post.metadata.slug,
			showTldrInitially ? 'tldr' : post.hasTldr ? 'detailed' : 'single',
		);
		return () => blog.reset();
	});

	$effect(() => {
		if (!showTldr() || tldrHtml !== null) return;

		const controller = new AbortController();
		tldrError = false;

		fetch(resolve('/blog/[slug]/tldr', { slug: post.metadata.slug }), {
			signal: controller.signal,
		})
			.then((response) => {
				if (!response.ok) throw new Error(`Could not load TLDR (${response.status})`);
				return response.text();
			})
			.then((html) => {
				tldrHtml = html;
			})
			.catch((error: unknown) => {
				if (!(error instanceof DOMException && error.name === 'AbortError')) {
					tldrError = true;
				}
			});

		return () => controller.abort();
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
		const href = (evt.currentTarget as HTMLAnchorElement).getAttribute('href');
		if (!href) return;

		const element = document.querySelector<HTMLElement>(href);
		if (element) gotoHeader(element);
	}

	function gotoHeader(header: HTMLElement) {
		const y = header.getBoundingClientRect().top + window.scrollY - 100;
		window.scrollTo({ top: y, behavior: 'smooth' });
	}

	const htmlStyle = $derived(`<style>
		main {
			--accent-color: var(--${post.metadata.color ?? 'base-color'});
		}

		main > h2,
		main h3,
		main h4,
		main h5,
		main h6 {
			color: var(--text-color);
		}
	</style>`);

	const headings = $derived(() => {
		if (!browser) {
			return [];
		}
		const showTldrInitially = post.hasTldr && $page.url.searchParams.get('tldr') === 'true';
		return showTldrInitially
			? []
			: ([...document.querySelectorAll('main > h2, main > h3')].reverse() as HTMLElement[]);
	});

	$effect(() => {
		headings().forEach((h) => {
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
			pre.addEventListener('click', copyLinkToCodeBlock);
		});
		return () => {
			pres().forEach((pre) => {
				pre.removeEventListener('click', copyLinkToCodeBlock);
			});
		};
	});

	let lastHeadingId = $state<string | null>(null);
	$effect(() => {
		if (browser) {
			if (blog.blog?.state === 'tldr' && lastHeadingId) {
				lastHeadingId = null;
			} else if (blog.blog?.state !== 'tldr' && headings()) {
				const heading = headings().find((h) => h.offsetTop <= scrollY + 110);
				if (lastHeadingId !== heading?.id) {
					lastHeadingId = heading?.id ?? null;
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

	function showDetailedPost() {
		if (showTldr()) blog.toggleTldr();
	}

	function showCodeOnly() {
		if (!showTldr()) blog.toggleTldr();
	}
</script>

<Head
	title={post.metadata.title}
	description={post.metadata.description}
	canonical={post.metadata.canonical}
	markdown={`${post.metadata.canonical}.md`}
	image={post.metadata.banner}
	imageWidth={1200}
	imageHeight={627}
	imageType="image/webp"
	type="article"
	author={post.metadata.author}
	published={post.metadata.date}
	modified={post.metadata.modified}
	tags={post.metadata.tags}
	section={{ name: 'Blog', url: publicUrl('/blog') }}
	standardDocument={standardSite.document(post.metadata.slug, post.metadata.date)}
/>

<svelte:window bind:scrollY />

<header bind:this={header} style:--post-title="post-title-{post.metadata.slug}">
	<h1>{post.metadata.title}</h1>
	<div class="details">
		<div class="published-at">
			<time datetime={post.metadata.date}>Published {humanDate(post.metadata.date)}</time>
			{#if post.metadata.modified && post.metadata.modified !== post.metadata.date}
				<time datetime={post.metadata.modified}>Updated {humanDate(post.metadata.modified)}</time>
			{/if}
		</div>

		<div class="logos">
			{#each post.metadata.logos as logo (logo.src)}
				<img class="mt-0 logo" src="/images/{logo.src}" alt={logo.alt} width="64" height="64" />
			{/each}
		</div>

		<a class="mt-0 author" href={resolve('/')} aria-label="About Tim Deschryver">
			<img
				class="author-img"
				src="/images/tim-96.webp"
				alt="Tim Deschryver"
				width="96"
				height="96"
			/>
			<div class="mt-0">
				<span class="author-name">Tim Deschryver</span>
				<div class="author-source mt-0">timdeschryver.dev</div>
			</div>
		</a>
	</div>
</header>

{#if post.hasTldr}
	<div class="tldr" role="group" aria-label="Reading mode">
		<span class="tldr-label">Reading mode</span>
		<div class="tldr-options">
			<button
				type="button"
				class:active={!showTldr()}
				aria-pressed={!showTldr()}
				onclick={showDetailedPost}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
					<path d="M14 2v6h6" />
					<path d="M16 13H8" />
					<path d="M16 17H8" />
				</svg>
				Full article
			</button>
			<button
				type="button"
				class:active={showTldr()}
				aria-pressed={showTldr()}
				onclick={showCodeOnly}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="m16 18 6-6-6-6" />
					<path d="m8 6-6 6 6 6" />
				</svg>
				Code only
			</button>
		</div>
	</div>
{/if}

<p class="article-summary">{post.metadata.description}</p>
<ul class="article-tags" aria-label="Topics">
	{#each post.metadata.tags as tag (tag)}
		<li>#{tag}</li>
	{/each}
</ul>

<aside class="left-nav" hidden={!sideNavsVisible()}>
	{#if post.metadata.toc.length > 1}
		<div class="toc" hidden={blog.blog?.state === 'tldr'}>
			<h3>On this page</h3>
			<ul>
				{#each post.metadata.toc as { slug, description, level } (slug)}
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

	{#if post.metadata.translations.length > 0}
		<div>
			<h4>Read this post in</h4>
			{#each post.metadata.translations as translation (translation.url)}
				<a href={translation.url} rel="external">{translation.language}</a>
			{/each}
		</div>
	{/if}

	<Share title="Share this post" text={post.metadata.title} url={post.metadata.canonical} compact />
</aside>

{@html htmlStyle}

{#if post.metadata.series && post.metadata.seriesPosts}
	<BlogSeries series={post.metadata.series} seriesPosts={post.metadata.seriesPosts} />
{/if}

{#if showTldr()}
	{#if tldrHtml}
		{@html tldrHtml}
	{:else if tldrError}
		<p role="alert">The code-only version could not be loaded. Switch back and try again.</p>
	{:else}
		<p role="status">Loading code-only version...</p>
	{/if}
{:else}
	{@html post.html}

	{#if post.contributors.length}
		<h2>A warm thank you to the contributors of this blog post</h2>
		<ul class="mt-0">
			{#each post.contributors as [login, name] (login)}
				<li>
					<a href={`https://github.com/${login}`} rel="external">{name ?? login}</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if relatedLinks.length}
		<h2>Related articles</h2>
		<ul class="mt-0" data-sveltekit-reload>
			{#each relatedLinks as link (link.slug)}
				<li>
					<a href={resolve('/blog/[slug]', { slug: link.slug })} class="mark">{link.title}</a>
				</li>
			{/each}
		</ul>
	{/if}
{/if}

{#if post.metadata.translations.length > 0 && !sideNavsVisible()}
	<div class="translations">
		<hr />
		<p>Thanks to the ❤️ community you can also read this post in:</p>
		<ul>
			{#each post.metadata.translations as translation (translation.url)}
				<li>
					<a href={translation.url} rel="external" class="mark">{translation.language}</a> thanks to
					<a href={translation.profile} rel="external" class="mark">{translation.author}</a>
				</li>
			{/each}
		</ul>
		<hr />
	</div>
{/if}

<Actions editUrl={post.metadata.edit} />

<Support />

<Share title="Share this post" text={post.metadata.title} url={post.metadata.canonical} />

<Comments />

<style>
	:global(main[data-segment*='blog/']) {
		--content-width: 80ch;
	}

	.tldr {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		width: fit-content;
		max-width: 100%;
		margin: 0 auto var(--spacing);
		padding: 0.2rem;
		border: 1px solid var(--line-color);
		border-radius: 0.6rem;
		background: var(--background-color-subtle);
	}

	.article-summary {
		max-width: 62ch;
		margin-top: 0;
		color: var(--text-color-light);
		font-size: 1rem;
		font-style: italic;
		line-height: 1.7;
	}

	.article-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		margin-top: 0.5rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.78rem;
		list-style: none;
	}

	.article-tags li {
		margin-top: 0;
	}

	.tldr-label {
		padding: 0 0.65rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.68rem;
		font-weight: 650;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.tldr-options {
		display: flex;
		gap: 0.25rem;
		margin-top: 0;
	}

	.tldr button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 2.25rem;
		margin: 0;
		padding: 0.4rem 0.7rem;
		border: 0;
		border-radius: 0.45rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.78rem;
		font-weight: 620;
		line-height: 1.2;
		white-space: nowrap;
		transition:
			background-color 0.2s ease,
			color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.tldr button:hover:not(.active) {
		background: var(--background-color-transparent);
		color: var(--text-color);
	}

	.tldr button.active {
		background: hsla(var(--accent-color), 0.12);
		box-shadow: inset 0 0 0 1px var(--text-color-light);
		color: var(--text-color);
		cursor: default;
	}

	.tldr svg {
		flex: 0 0 auto;
	}

	@media (max-width: 480px) {
		.tldr {
			width: 100%;
			flex-direction: column;
			align-items: stretch;
		}

		.tldr-label {
			padding: 0.35rem 0.5rem 0.2rem;
			text-align: center;
		}

		.tldr-options {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	:global(main > p:first-of-type) {
		margin-top: 0;
	}

	.left-nav {
		display: block;
		position: fixed;
		top: var(--header-height);
		padding: 2.5rem clamp(1.5rem, 3vw, 3rem);
		text-align: left;
		width: min(25vw, 22rem);
		transition: all 0.2s;
		background: var(--background-color);
		height: calc(100dvh - var(--header-height));
		margin-top: 0;
		border-right: 1px solid var(--line-color);
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

	@media (min-width: 1280px) {
		:global(main[data-segment*='blog/'] ~ footer) {
			transform: translateX(min(12.5vw, 11rem));
		}
	}

	@media (max-width: 1279px) {
		.left-nav {
			display: none;
		}

		:global(main[data-segment*='blog/'] ~ footer) {
			padding-left: 0;
			transform: none;
		}
	}

	.toc ul {
		list-style: none;
		font-size: 1rem;
		color: var(--text-color-light);
		transition: all 0.25s;
	}

	.toc ul li.active {
		color: hsla(var(--accent-color), 1);
		font-weight: 600;
	}

	.toc h3 {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
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
		position: relative;
		min-height: calc(100dvh - var(--header-height));
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-end;
		text-align: left;
		margin: 0 auto;
		margin-bottom: clamp(2rem, 4vw, 3.5rem);
		padding: clamp(4rem, 12vh, 9rem) clamp(0rem, 5vw, 5rem) clamp(2rem, 5vw, 4rem);
		border-bottom: 1px solid var(--line-color);
		background:
			linear-gradient(135deg, hsla(var(--accent-color), 0.07), transparent 42%),
			linear-gradient(90deg, transparent 52%, hsla(var(--accent-color), 0.04));
		overflow: hidden;
	}

	:global(body > div > main) > header::after {
		content: '';
		position: absolute;
		top: clamp(3rem, 10vw, 8rem);
		right: clamp(0rem, 8vw, 8rem);
		width: clamp(5rem, 16vw, 13rem);
		aspect-ratio: 1;
		border: 1px solid hsla(var(--accent-color), 0.45);
		border-radius: 50%;
		transform: translateX(35%);
		pointer-events: none;
	}

	:global(body > div > main) > header h1 {
		position: relative;
		z-index: 1;
		max-width: 16ch;
		font-size: clamp(2.8rem, 7.5vw, 7rem);
		line-height: 0.95;
		letter-spacing: -0.065em;
		text-wrap: balance;
	}

	:global(body > div > main) > header h1::before {
		content: '';
		display: block;
		width: clamp(2.5rem, 5vw, 4rem);
		height: 0.28rem;
		margin-bottom: clamp(1.25rem, 3vh, 2rem);
		background: hsla(var(--accent-color), 1);
	}

	.details {
		display: flex;
		justify-content: space-between;
		margin-top: clamp(2rem, 8vh, 5rem);
		font-size: 0.85rem;
		width: 100%;
		align-items: center;
		color: var(--text-color-light);
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
		font-size: 0.9rem;
		font-weight: 650;
	}
	.author-source {
		font-size: 0.8rem;
		transform: translate(3px, -8px);
		display: none;
	}

	.published-at {
		display: grid;
		gap: 0.2rem;
	}

	.author-img {
		width: 44px;
		height: 44px;
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

	@media screen and (max-width: 620px) {
		:global(body > div > main) > header {
			justify-content: center;
			padding-top: clamp(2rem, 5vh, 3rem);
			padding-bottom: clamp(2rem, 5vh, 3rem);
			padding-left: 1.2rem;
			padding-right: 1.2rem;
		}

		:global(body > div > main) > header::after {
			top: 3rem;
		}

		.details {
			position: absolute;
			bottom: clamp(2rem, 5vh, 3rem);
			left: 1.2rem;
			right: 1.2rem;
			width: auto;
			align-items: center;
			gap: 0.75rem;
			margin-top: 0;
		}

		.author-img {
			width: 36px;
			height: 36px;
		}

		.author {
			flex-shrink: 0;
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
