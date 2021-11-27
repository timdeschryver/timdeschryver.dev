<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { page } from '$app/stores';
	import { variables } from '$lib/variables';

	$: segment = $page.path.substring(1);
	afterUpdate(() => {
		if (typeof gtag === 'function' && variables) {
			gtag('config', variables.gtag_id, {
				page_path: window.location.pathname,
			});
		}
	});
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
