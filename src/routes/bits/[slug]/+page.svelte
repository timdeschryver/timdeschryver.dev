<script lang="ts">
	import '../../code.css';
	import Support from '$lib/Support.svelte';
	import Head from '$lib/Head.svelte';
	import Share from '$lib/Share.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Comments from '$lib/Comments.svelte';
	import Ad from '$lib/Ad.svelte';

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
	image={bit.metadata.banner}
	type="article"
	author={bit.metadata.author}
	published={bit.metadata.date}
	tags={bit.metadata.tags}
/>

<div class="eyebrow">Developer bit</div>
<h1 style:--bit-title="bit-title-{bit.metadata.slug}">{bit.metadata.title}</h1>
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

<div class="m-auto mt-0 mb-normal">
	<Ad />
</div>

{@html bit.html}

<Support />

<Share title="Share this bit" text={bit.metadata.title} url={bit.metadata.canonical} />

<Comments />

<style>
	.eyebrow {
		margin-top: clamp(4rem, 10vh, 7rem);
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-color-light);
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
