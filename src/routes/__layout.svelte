<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { variables } from '$lib/variables';
	import { afterNavigate } from '$app/navigation';

	$: segment = $page.url.pathname.substring(1);
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

		if (variables && typeof gtag === 'function') {
			gtag('config', variables.gtag_id);
		}
	});

	afterNavigate(({ to }) => {
		if (variables && typeof gtag === 'function') {
			gtag('event', 'page_view', {
				page_title: document.title,
				page_location: location.href,
				page_path: to.pathname,
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
		<a href="/blog" class:active={segment.startsWith('blog')}>Blog</a>
		<a href="/snippets" class:active={segment.startsWith('snippets')}> Snippets </a>
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
