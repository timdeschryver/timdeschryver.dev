<script lang="ts">
	import '../../code.css';
	import Support from '$lib/Support.svelte';
	import Head from '$lib/Head.svelte';
	import Share from '$lib/Share.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Comments from '$lib/Comments.svelte';
	import Ad from '$lib/Ad.svelte';
	import Actions from '$lib/Actions.svelte';
	import { humanDate } from '$lib/formatters';
	import { publicUrl } from '$lib/variables';
	import { resolve } from '$app/paths';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const { bit } = data;

	codeBlockLifeCycle();
	copyLifeCycle();
</script>

<Head
	title={bit.metadata.title}
	description={bit.metadata.description}
	canonical={bit.metadata.canonical}
	markdown={`${bit.metadata.canonical}.md`}
	image={bit.metadata.banner}
	imageWidth={bit.metadata.bannerWidth}
	imageHeight={bit.metadata.bannerHeight}
	imageType="image/webp"
	type="article"
	author={bit.metadata.author}
	published={bit.metadata.date}
	tags={bit.metadata.tags}
	section={{ name: 'Developer Bits', url: publicUrl('/bits') }}
/>

<article>
	<header>
		<div class="eyebrow">Developer bit</div>
		<h1 style:--bit-title="bit-title-{bit.metadata.slug}">{bit.metadata.title}</h1>
		<p class="summary">{bit.metadata.description}</p>
		<div class="byline">
			<span>By <a href={resolve('/')} class="mark">Tim Deschryver</a></span>
			<time datetime={bit.metadata.date}>Published {humanDate(bit.metadata.date)}</time>
			<span>{bit.metadata.tags.map((tag) => `#${tag}`).join(' · ')}</span>
		</div>
	</header>
	{#if bit.metadata.banner}
		<img
			src={bit.metadata.banner}
			alt={bit.metadata.title}
			width={bit.metadata.bannerWidth}
			height={bit.metadata.bannerHeight}
			fetchpriority="high"
			decoding="async"
		/>
	{/if}

	<div class="ad-wrapper mt-0 mb-normal">
		<Ad />
	</div>

	{@html bit.html}

	<Actions editUrl={bit.metadata.edit} contentType="developer bit" />
</article>

<Support />

<Share title="Share this bit" text={bit.metadata.title} url={bit.metadata.canonical} />

<Comments />

<style>
	.ad-wrapper {
		display: flex;
		justify-content: center;
	}

	.eyebrow {
		margin-top: clamp(4rem, 10vh, 7rem);
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-color-light);
	}

	.summary {
		max-width: 62ch;
		color: var(--text-color-light);
		font-size: clamp(1.08rem, 2vw, 1.25rem);
	}

	.byline {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1.25rem;
		color: var(--text-color-light);
		font-size: 0.85rem;
	}

	.byline > * {
		margin-top: 0;
	}

	h1 {
		margin-top: clamp(1.25rem, 3vw, 2.25rem);
		font-size: clamp(2.6rem, 7vw, 5.5rem);
		line-height: 0.98;
		letter-spacing: -0.055em;
		text-wrap: balance;
	}

	img {
		border: 1px solid var(--line-color);
		height: auto;
		max-width: 100%;
	}

	@media (prefers-reduced-motion: no-preference) {
		h1 {
			view-transition-name: var(--bit-title);
		}

		img {
			grid-column: 1 / 4;
			width: 100%;
			max-width: 95ch;
			justify-self: center;
		}
	}
</style>
