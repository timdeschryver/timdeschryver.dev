<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { variables } from '$lib/variables';
	import Host from '$lib/Host.svelte';
	import { blog } from '$lib/current-blog.store';

	$: segment = $page.url.pathname.substring(1);
	let support;
	let y;

	let theme = '';

	onMount(() => {
		theme =
			window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
		document.body.classList.add(theme);
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
			toggleTheme(event.matches ? 'dark' : 'light');
		});

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
				page_path: to.url.pathname,
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

	function toggleTheme(newTheme: string) {
		document.body.classList.replace(theme, newTheme);
		theme = newTheme;
	}
</script>

<svelte:head>
	<script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js">
	</script>
</svelte:head>

<svelte:window bind:scrollY={y} />

<header>
	<div>
		<h2>
			<a href="/"
				><span class="name-long">Tim Deschryver</span><span class="name-short">Tim</span></a
			>
		</h2>

		<nav>
			<a href="/blog" class:active={segment.startsWith('blog')}>BLOG</a>
			<a href="/blog/rss.xml" data-sveltekit-reload>RSS</a>
			{#if theme === 'dark'}
				<button
					class="theme-switch"
					title="Switch to light theme"
					on:click={() => toggleTheme('light')}
					in:fly={{ y: 20, duration: 200, delay: 200 }}
				>
					☀️ Light
				</button>
			{:else}
				<button
					class="theme-switch"
					title="Switch to dark theme"
					on:click={() => toggleTheme('dark')}
					in:fly={{ y: -20, duration: 200, delay: 200 }}
					>🌚 Dark
				</button>
			{/if}
		</nav>

		{#if $blog}
			<div
				class="current-details title"
				on:click={() =>
					navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}`)}
			>
				🔗 {$blog.title}
			</div>
		{/if}

		{#if $blog && $blog.state !== 'single'}
			<div class="current-details">
				<button on:click={blog.toggleTldr}
					>{$blog.state === 'detailed'
						? 'Switch to TLDR version'
						: 'Switch to detailed version'}</button
				>
			</div>
		{/if}
	</div>
</header>

<main>
	<slot />
</main>

{#if segment}
	<footer>
		<Host />
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
		grid-template-columns: 1fr 1fr;
		align-items: center;
	}

	header > div > *:nth-child(even) {
		justify-self: right;
	}

	header * {
		margin-top: 0;
	}

	:global(body.light) header {
		box-shadow: rgb(0 0 0 / 5%) 0px 5px 15px;
	}

	:global(body.dark) header {
		box-shadow: rgb(255 255 255 / 5%) 0px 5px 15px;
	}

	.name-short {
		display: none;
	}

	.name-long {
		display: block;
	}

	@media (max-width: 480px) {
		header > div {
			grid-template-columns: auto auto;
		}

		.name-short {
			display: block;
		}

		.name-long {
			display: none;
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
		display: flex;
		justify-content: center;
		color: var(--text-color-light);
		font-size: 0.9rem;
	}
</style>
