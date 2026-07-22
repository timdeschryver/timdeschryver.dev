<script lang="ts">
	import Support from '$lib/Support.svelte';
	import Head from '$lib/Head.svelte';
	import Share from '$lib/Share.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Comments from '$lib/Comments.svelte';
	import Newsletter from '$lib/Newsletter.svelte';
	import Ad from '$lib/Ad.svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const { bit } = data;

	let scrollY = $state(0);
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

<svelte:window bind:scrollY />

<div></div>
<h1 style:--bit-title="bit-title-{bit.metadata.slug}">{bit.metadata.title}</h1>
{#if bit.metadata.banner}
	<img
		src={bit.metadata.banner}
		alt={bit.metadata.title}
		width={bit.metadata.bannerWidth}
		height={bit.metadata.bannerHeight}
		fetchpriority="high"
		decoding="async"
		style="--scroll: {(scrollY ?? 0) <= 150
			? 1
			: scrollY <= 200
				? 0.75
				: scrollY <= 300
					? 0.5
					: scrollY <= 500
						? 0.25
						: 0}"
	/>
{/if}

<div class="m-auto mt-0 mb-normal">
	<Ad />
</div>

{@html bit.html}

<Support />

<Newsletter beehiivId={bit.beehiivId} />

<Share title="Share this bit on" text={bit.metadata.title} url={bit.metadata.canonical} />

<Comments />

<style>
	@media (prefers-reduced-motion: no-preference) {
		h1 {
			view-transition-name: var(--bit-title);
		}

		img {
			transform: translate3d(0px, 0vh, 0px) scale3d(1, 1, 1)
				rotateX(calc((1 - var(--scroll)) * 40deg)) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg);
			transition: all 1s ease-out;
			grid-column: 1 / 4;
			width: 100%;
			max-width: 95ch;
			justify-self: center;
		}
	}
</style>
