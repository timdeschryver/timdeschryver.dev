<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/stores';
    import {afterNavigate} from '$app/navigation';
    import {variables} from '$lib/variables';
    import Host from '$lib/Host.svelte';
    import {blog} from "$lib/current-blog.store";

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

    afterNavigate(({to}) => {
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
</script>

<header>
    <div>
        <h2><a href="/">Tim Deschryver</a></h2>

        <nav>
            <a href="/blog" class:active={segment.startsWith('blog')}>BLOG</a>
        </nav>

        {#if $blog}
            <div class="current-details">
                {$blog.title}
            </div>
        {/if}

        {#if $blog && $blog.state !== 'single'}
            <div class="current-details">
                <button on:click={blog.toggleTldr}>{$blog.state === 'detailed' ? 'Detailed Version' : 'TLDR Version'}</button>
            </div>
        {/if}
    </div>
</header>

<svelte:head>
    <script src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js">
    </script>
</svelte:head>

<svelte:window bind:scrollY={y}/>

<main>
    <slot/>
</main>

{#if segment}
    <footer>
        <Host/>
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

    header > * > * {
        margin-top: 0;
    }

    @media (prefers-color-scheme: light) {
        header {
            box-shadow: rgb(0 0 0 / 5%) 0px 5px 15px;
        }
    }

    @media (prefers-color-scheme: dark) {
        header {
            box-shadow: rgb(255 255 255 / 5%) 0px 5px 15px;
        }
    }

    @media (max-width: 480px) {
        header .current-details {
            display: none;
        }

        header > div {
            grid-template-columns: auto auto;
        }
    }

    header h2 > a {
        text-decoration: none;
    }

    header .current-details {
        margin-top: -1.5em;
        font-size: .8rem;
    }

    nav a {
        color: var(--text-color-light);
        transition: .2s ease-in-out;
        text-decoration: none;
    }

    nav a.active, nav a:hover {
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
