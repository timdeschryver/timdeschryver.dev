<script lang="ts">
	import { run } from 'svelte/legacy';

	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import Host from '$lib/Host.svelte';
	import { blog } from '$lib/current-blog.svelte';
	import { theme } from '$lib/theme.store';
	import './layout.css';
	import Socials from '$lib/Socials.svelte';

	let { children } = $props();

	let segment = $derived($page.url?.pathname.substring(1) ?? '');
	let support = $state<HTMLElement | null>();
	let scrollY = $state(0);

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

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	run(() => {
		if (support) {
			if (segment.startsWith('blog/') && scrollY > 1000) {
				support.style.display = 'block';
			} else {
				support.style.display = 'none';
			}
		}
	});

	function toggleTheme(event: MouseEvent, newTheme: string) {
		// Credits to https://github.com/antfu/antfu.me/blob/main/src/logics/index.ts
		const isAppearanceTransition =
			document.startViewTransition &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!isAppearanceTransition) {
			theme.set(newTheme);
			return;
		}

		const x = event.clientX;
		const y = event.clientY;
		const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
		const transition = document.startViewTransition(async () => {
			theme.set(newTheme);
			await tick();
		});
		transition.ready.then(() => {
			const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
			document.documentElement.animate(
				{
					clipPath: newTheme === 'dark' ? [...clipPath].reverse() : clipPath,
				},
				{
					duration: 400,
					easing: 'ease-out',
					pseudoElement:
						newTheme === 'dark' ? '::view-transition-old(root)' : '::view-transition-new(root)',
				},
			);
		});
	}

	run(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.className = $theme;
		}
	});
</script>

<svelte:head>
	<script async src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"></script>
</svelte:head>

<svelte:window bind:scrollY />

<header>
	<div>
		<h2>
			<a href="/">Tim Deschryver</a>
		</h2>

		<nav>
			<a href="/blog" class:active={segment.startsWith('blog')}>BLOG</a>
			<a href="/bits" class:active={segment.startsWith('bits')}>BITS</a>
			<a href="/blog/rss.xml" data-sveltekit-reload>RSS</a>
			{#if $theme === 'dark'}
				<button
					class="theme-switch"
					title="Switch to light theme"
					onclick={(evt) => toggleTheme(evt, 'light')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="align-text-top" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
				</button>
			{:else}
				<button
					class="theme-switch"
					title="Switch to dark theme"
					onclick={(evt) => toggleTheme(evt, 'dark')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="align-text-top" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
				</button>
			{/if}
		</nav>

		{#if blog.blog}
			<div
				class="current-details title"
				onclick={() =>
					navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`)}
				onkeydown={() =>
					navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`)}
				role="button"
				tabindex="0"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="align-text-top" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
				{blog.blog.title}
			</div>
		{/if}

		{#if blog.blog && blog.blog.state !== 'single'}
			<div class="current-details">
				<button onclick={blog.toggleTldr}
					>{blog.blog.state === 'detailed'
						? 'Switch to TLDR version'
						: 'Switch to detailed version'}</button
				>
			</div>
		{/if}
	</div>
</header>

<main style={segment?.startsWith('bit') ? '	perspective: 2000px;' : ''} data-segment={segment}>
	{@render children?.()}
</main>

{#if segment}
	<footer>
		<Host />
		<Socials />
	</footer>
{/if}

<style>
	header {
		position: fixed;
		top: 0;
		width: 100%;
		height: var(--header-height);
		backdrop-filter: saturate(100%) blur(3px);
		z-index: 3;
	}

	header > div {
		display: grid;
		grid-template-columns: 2fr 1fr;
		align-items: center;
	}

	header > div > *:nth-child(even) {
		justify-self: right;
	}

	header * {
		margin-top: 0;
	}

	:global(html.light) header {
		box-shadow: rgb(0 0 0 / 5%) 0px 5px 15px;
	}

	:global(html.dark) header {
		box-shadow: rgb(255 255 255 / 5%) 0px 5px 15px;
	}

	@media (max-width: 480px) {
		header > div {
			grid-template-columns: auto auto;
		}

		header .current-details.title {
			visibility: hidden;
		}
	}

	header h2 > a {
		text-decoration: none;
	}

	header .current-details {
		margin-top: -1.5em;
		font-size: 0.8rem;
	}

	header .current-details.title {
		cursor: pointer;
	}

	nav {
		width: 100%;
		display: flex;
		justify-content: end;
		gap: 0.6em;
	}

	nav > *:last-child {
		margin-left: 0.6em;
	}

	nav a {
		color: var(--text-color-light);
		transition: 0.2s ease-in-out;
		text-decoration: none;
	}

	nav a.active,
	nav a:hover {
		color: var(--text-color);
		text-decoration: underline;
		font-weight: bold;
	}

	header button {
		padding: 0;
		margin: 0;
		border: none;
	}

	footer {
		position: static;
		bottom: 0;
		width: 100%;
		color: var(--text-color-light);
		font-size: 0.9rem;
		text-align: center;
	}

	.theme-switch {
		color: var(--text-color-light);
	}

</style>
