<script lang="ts">
	import { run } from 'svelte/legacy';

	import { tick } from 'svelte';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Host from '$lib/Host.svelte';
	import { blog } from '$lib/current-blog.svelte';
	import { setTheme, theme } from '$lib/theme.store';
	import './layout.css';
	import Socials from '$lib/Socials.svelte';

	let { children } = $props();

	let segment = $derived($page.url?.pathname.substring(1) ?? '');
	let support = $state<HTMLElement | null>();
	let scrollY = $state(0);
	let kofiRequested = false;
	let activeViewTransition: ViewTransition | null = null;
	let blogOverviewAnchor: { slug: string; viewportTop: number } | null = null;

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		const fromPath = navigation.from?.url.pathname;
		const toPath = navigation.to?.url.pathname;
		if (fromPath === '/blog' && toPath?.startsWith('/blog/')) {
			const slug = decodeURIComponent(toPath.slice('/blog/'.length));
			const article = document.querySelector<HTMLElement>(`[data-post-slug="${CSS.escape(slug)}"]`);
			if (article) {
				blogOverviewAnchor = { slug, viewportTop: article.getBoundingClientRect().top };
			}
		}
		const anchorToRestore =
			navigation.type === 'popstate' && fromPath?.startsWith('/blog/') && toPath === '/blog'
				? blogOverviewAnchor
				: null;

		return new Promise((resolve) => {
			const transition = startManagedViewTransition(async () => {
				resolve();
				await navigation.complete;
				if (anchorToRestore) {
					await tick();
					restoreBlogOverviewAnchor(anchorToRestore);
				}
			});

			if (anchorToRestore) {
				const restoreAfterTransition = () =>
					requestAnimationFrame(() => restoreBlogOverviewAnchor(anchorToRestore));
				void transition.finished.then(restoreAfterTransition, restoreAfterTransition);
			}
		});
	});

	function restoreBlogOverviewAnchor(anchor: { slug: string; viewportTop: number }) {
		const article = document.querySelector<HTMLElement>(
			`[data-post-slug="${CSS.escape(anchor.slug)}"]`,
		);
		if (article) {
			window.scrollBy(0, article.getBoundingClientRect().top - anchor.viewportTop);
		}
	}

	function startManagedViewTransition(update: () => void | Promise<void>) {
		activeViewTransition?.skipTransition();
		const transition = document.startViewTransition(update);
		activeViewTransition = transition;

		void transition.ready.catch((error) => {
			if (!isInterruptedViewTransition(error)) {
				console.error('View transition failed to start.', error);
			}
		});
		void transition.finished.then(
			() => clearActiveViewTransition(transition),
			(error) => {
				clearActiveViewTransition(transition);
				if (!isInterruptedViewTransition(error)) {
					console.error('View transition failed.', error);
				}
			},
		);

		return transition;
	}

	function clearActiveViewTransition(transition: ViewTransition) {
		if (activeViewTransition === transition) {
			activeViewTransition = null;
		}
	}

	function isInterruptedViewTransition(error: unknown) {
		if (!(error instanceof DOMException)) return false;
		const message = error.message.toLowerCase();
		return (
			error.name === 'AbortError' ||
			(message.includes('viewtransition') && message.includes('skip'))
		);
	}

	run(() => {
		const supportVisible = segment.startsWith('blog/') && scrollY > 1000;
		if (supportVisible && !support) {
			loadKofiWidget();
		}

		if (support) {
			support.style.display = supportVisible ? 'block' : 'none';
		}
	});

	function loadKofiWidget() {
		if (kofiRequested || typeof document === 'undefined') return;
		kofiRequested = true;

		const draw = () => {
			kofiWidgetOverlay.draw('timdeschryver', {
				type: 'floating-chat',
				'floating-chat.donateButton.text': '',
				'floating-chat.donateButton.background-color': '#fff',
				'floating-chat.donateButton.text-color': $theme === 'dark' ? '#111' : '#eee',
			});
			support = document.querySelector('[id*=kofi-widget-overlay]');
		};

		if (typeof kofiWidgetOverlay !== 'undefined') {
			draw();
			return;
		}

		const script = document.createElement('script');
		script.async = true;
		script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
		script.addEventListener('load', draw, { once: true });
		document.head.appendChild(script);
	}

	function toggleTheme(event: MouseEvent, newTheme: 'light' | 'dark') {
		// Credits to https://github.com/antfu/antfu.me/blob/main/src/logics/index.ts
		const isAppearanceTransition =
			typeof document.startViewTransition === 'function' &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!isAppearanceTransition) {
			setTheme(newTheme);
			return;
		}

		const x = event.clientX;
		const y = event.clientY;
		const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
		const transition = startManagedViewTransition(async () => {
			setTheme(newTheme);
			await tick();
		});
		void transition.ready.then(
			() => {
				const clipPath = [
					`circle(0px at ${x}px ${y}px)`,
					`circle(${endRadius}px at ${x}px ${y}px)`,
				];
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
			},
			() => {},
		);
	}

	$effect.pre(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.classList.remove('light', 'dark');
			document.documentElement.classList.add($theme);
		}
	});
</script>

<svelte:window bind:scrollY />

<a class="skip-link" href="#main-content">Skip to content</a>

<header class:scrolled={scrollY > 24}>
	<div class:has-blog-context={blog.blog}>
		<h2>
			<a href={resolve('/')}>Tim Deschryver</a>
		</h2>

		<nav>
			<a href={resolve('/blog')} class:active={segment.startsWith('blog')}>BLOG</a>
			<a href={resolve('/bits')} class:active={segment.startsWith('bits')}>BITS</a>
			<a href={resolve('/blog/rss.xml')} data-sveltekit-reload>RSS</a>
			{#if $theme === 'dark'}
				<button
					class="theme-switch"
					title="Switch to light theme"
					onclick={(evt) => toggleTheme(evt, 'light')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="align-text-top"
						aria-hidden="true"
						><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path
							d="m4.93 4.93 1.41 1.41"
						/><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path
							d="m6.34 17.66-1.41 1.41"
						/><path d="m19.07 4.93-1.41 1.41" /></svg
					>
				</button>
			{:else}
				<button
					class="theme-switch"
					title="Switch to dark theme"
					onclick={(evt) => toggleTheme(evt, 'dark')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="align-text-top"
						aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg
					>
				</button>
			{/if}
		</nav>

		{#if blog.blog}
			<div class="blog-context">
				<a
					class="current-blog-link"
					href={resolve('/blog/[slug]', { slug: blog.blog.slug })}
					title={blog.blog.title}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
							d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
						/></svg
					>
					<span>{blog.blog.title}</span>
				</a>
				{#if blog.blog.state !== 'single'}
					<button class="blog-version-toggle" onclick={blog.toggleTldr}
						>{blog.blog.state === 'detailed'
							? 'Switch to TLDR version'
							: 'Switch to detailed version'}</button
					>
				{/if}
			</div>
		{/if}
	</div>
</header>

<main
	id="main-content"
	tabindex="-1"
	style={segment?.startsWith('bit') ? '	perspective: 2000px;' : ''}
	data-segment={segment}
>
	{@render children?.()}
</main>

{#if segment}
	<footer>
		<Host />
		<span class:underlined-socials={segment.startsWith('blog/')}><Socials /></span>
	</footer>
{/if}

<style>
	.skip-link {
		position: fixed;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 10000;
		display: block;
		width: max-content;
		margin: 0;
		padding: 0.6rem 0.9rem;
		transform: translateY(calc(-100% - 1rem));
		border: 2px solid currentColor;
		border-radius: 2px;
		background: var(--background-color);
		color: var(--text-color);
		font-family: var(--head-font);
		font-size: 0.9rem;
		font-weight: 650;
		transition: transform 0.15s ease-out;
	}

	.skip-link:focus-visible {
		transform: translateY(0);
	}

	main {
		scroll-margin-top: calc(var(--header-height) + 1rem);
	}

	.underlined-socials :global(a) {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	header {
		position: fixed;
		top: 0;
		width: 100%;
		height: var(--header-height);
		margin-top: 0;
		background: transparent;
		backdrop-filter: blur(0);
		border-bottom: 1px solid transparent;
		transition:
			background-color 0.2s ease,
			backdrop-filter 0.2s ease,
			border-color 0.2s ease;
		z-index: 10;
	}

	header.scrolled {
		background: var(--header-color);
		backdrop-filter: saturate(120%) blur(16px);
		border-bottom-color: var(--line-color);
	}

	header > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: max-content;
		column-gap: clamp(1rem, 3vw, 2.5rem);
		align-content: center;
		align-items: baseline;
		height: 100%;
	}

	header > div.has-blog-context {
		grid-template-columns: auto minmax(0, 1fr) auto;
	}

	header > div > h2 {
		grid-column: 1;
		grid-row: 1;
	}

	header > div > nav {
		grid-column: 2;
		grid-row: 1;
		justify-self: end;
	}

	header > div.has-blog-context > nav {
		grid-column: 3;
	}

	header * {
		margin-top: 0;
	}

	header h2 > a {
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		font-size: 0.9rem;
		font-weight: 760;
		letter-spacing: 0.08em;
		line-height: 1;
		text-transform: uppercase;
	}

	.blog-context {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		align-items: center;
		min-width: 0;
		justify-self: stretch;
		font-size: 0.72rem;
		color: var(--text-color-light);
	}

	.current-blog-link {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-weight: 550;
		line-height: 1;
		text-decoration: none;
	}

	.current-blog-link:hover {
		color: var(--text-color);
	}

	.current-blog-link svg {
		flex: 0 0 auto;
		width: 14px;
		height: 14px;
	}

	.current-blog-link span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	header .blog-version-toggle {
		flex: 0 0 auto;
		margin-left: 0.8rem;
		padding-left: 0.8rem;
		border: 0;
		border-left: 1px solid var(--line-color);
		color: var(--text-color-light);
		font-size: 0.72rem;
		white-space: nowrap;
	}

	header .blog-version-toggle:hover {
		color: var(--text-color);
	}

	nav {
		display: flex;
		justify-content: end;
		align-items: center;
		gap: 1.2rem;
	}

	nav > *:last-child {
		margin-left: 0.2rem;
	}

	nav a {
		position: relative;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		line-height: 1;
		transition: color 0.2s ease-in-out;
		text-decoration: none;
	}

	nav a.active,
	nav a:hover {
		color: var(--text-color);
		text-decoration: none;
	}

	nav a.active::after {
		content: '';
		position: absolute;
		top: calc(100% + 0.35rem);
		left: 0;
		width: 100%;
		height: 1px;
		background: currentColor;
	}

	header button {
		padding: 0;
		margin: 0;
		border: none;
	}

	footer {
		position: static;
		width: min(calc(100% - 2.4rem), var(--content-width));
		margin: var(--spacing-large) auto 0;
		padding-top: 1.5rem;
		border-top: 1px solid var(--line-color);
		color: var(--text-color-light);
		font-size: 0.9rem;
		text-align: center;
	}

	.theme-switch {
		color: var(--text-color-light);
		display: grid;
		place-items: center;
	}

	.theme-switch svg {
		width: 18px;
		height: 18px;
	}

	@media (max-width: 620px) {
		header > div.has-blog-context {
			grid-template-columns: auto auto;
		}

		.blog-context {
			display: none;
		}

		header > div.has-blog-context > nav {
			grid-column: 2;
		}

		header h2 > a {
			font-size: 0.68rem;
		}

		nav {
			gap: 0.8rem;
		}

		nav a {
			font-size: 0.68rem;
		}
	}

	@media (min-width: 621px) and (max-width: 1000px) {
		.blog-version-toggle {
			display: none;
		}
	}
</style>
