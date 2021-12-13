<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { page } from '$app/stores';
	import { variables } from '$lib/variables';

	$: segment = $page.path.substring(1);
	let support;
	let y;

	onMount(() => {
		if (typeof kofiWidgetOverlay !== 'undefined') {
			kofiWidgetOverlay.draw('timdeschryver', {
				type: 'floating-chat',
				'floating-chat.donateButton.text': '',
				...(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
					? {
							'floating-chat.donateButton.background-color': '#fff',
							'floating-chat.donateButton.text-color': '#111',
					  }
					: {
							'floating-chat.donateButton.background-color': '#fff',
							'floating-chat.donateButton.text-color': '#eee',
					  }),
			});
			support = document.querySelector('[id*=kofi-widget-overlay]');
		}
	});

	afterUpdate(() => {
		if (typeof gtag === 'function' && variables) {
			gtag('config', variables.gtag_id, {
				page_path: window.location.pathname,
			});
		}
	});

	$: if (support) {
		if (segment.startsWith('blog/') && y > 1000) {
			support.style.display = 'block';
		} else {
			support.style.display = 'none';
		}
	}
</script>

<header>
	<h2><a href="/">Tim Deschryver</a></h2>
	<nav>
		<a href="/blog" sveltekit:prefetch class:active={segment.startsWith('blog')}>Blog</a>
		<a href="/snippets" sveltekit:prefetch class:active={segment.startsWith('snippets')}>
			Snippets
		</a>
		<a href="https://timdeschryver.dev/twitter" rel="external">Twitter</a>
		<a href="https://tinyletter.com/timdeschryver" rel="external">Newsletter</a>
	</nav>
</header>

<svelte:head>
	<script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js">
	</script>
</svelte:head>

<svelte:window bind:scrollY={y} />

<main data-page={segment}>
	<slot />
</main>

<style>
	header > h2 > a {
		text-decoration: none;
	}

	nav {
		margin-top: var(--spacing-small);
	}

	nav a {
		margin-right: 0.5em;
	}
</style>
