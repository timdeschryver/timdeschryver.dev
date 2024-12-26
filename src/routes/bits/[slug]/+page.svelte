<script lang="ts">
	import Support from '$lib/Support.svelte';
	import { humanDate } from '$lib/formatters';
	import Head from '$lib/Head.svelte';
	import Share from '$lib/Share.svelte';
	import codeBlockLifeCycle from '$lib/code-block-lifecycle.svelte';
	import copyLifeCycle from '$lib/copy-lifecycle.svelte';
	import Comments from '$lib/Comments.svelte';
	import Newsletter from '$lib/Newsletter.svelte';
	import Ad from '$lib/Ad.svelte';

	let { data } = $props();
	const { bit } = data;

	let scrollY = $state<number>();
	codeBlockLifeCycle();
	copyLifeCycle();
</script>

<Head title={bit.metadata.title} details={false} />

<svelte:head>
	<link rel="canonical" href={bit.metadata.canonical} />

	<meta name="author" content={bit.metadata.author} />
	<meta name="copyright" content={bit.metadata.author} />
	<meta name="title" content={bit.metadata.title} />
	<meta name="description" content={bit.metadata.description} />
	<meta name="keywords" content={bit.metadata.tags.join(',')} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image:alt" content={bit.metadata.title} />
	<meta name="twitter:title" content={bit.metadata.title} />
	<meta name="twitter:description" content={bit.metadata.description} />
	<meta name="twitter:label1" content="Written by" />
	<meta name="twitter:data1" content={bit.metadata.author} />
	<meta name="twitter:label2" content="Published on" />
	<meta name="twitter:data2" content={humanDate(bit.metadata.date)} />

	<meta name="og:url" content={bit.metadata.canonical} />
	<meta name="og:title" content={bit.metadata.title} />
	<meta name="og:description" content={bit.metadata.description} />
	<meta name="og:type" content="article" />

	<meta name="image" content={bit.metadata.banner} />
	<meta name="twitter:image" content={bit.metadata.banner} />
	<meta name="og:image" content={bit.metadata.banner} />
</svelte:head>

<svelte:window bind:scrollY />

<div></div>
<h1 style:--bit-title="bit-title-{bit.metadata.slug}">{bit.metadata.title}</h1>
<img
	src={bit.metadata.banner}
	alt="banner"
	style="--scroll: {(scrollY ?? 0) <= 150
		? 1
		: scrollY <= 200
			? 0.75
			: scrollY <= 300
				? 0.5
				: scrollY <= 500
					? 0.25
					: 0}"
	loading="lazy"
/>

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
