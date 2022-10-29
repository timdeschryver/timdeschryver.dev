<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/stores';
    import {afterNavigate} from '$app/navigation';
    import {variables} from '$lib/variables';
    import Host from '$lib/Host.svelte';
    import {blogTitle} from "$lib/current-blog.store";

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
        <small>{$blogTitle}</small>
    </div>
    <nav>
        <a href="/blog" class:active={segment.startsWith('blog')}>BLOG</a>
    </nav>
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
        display: flex !important;
        justify-content: space-evenly;
        align-items: center;
        position: fixed;
        top: 0;
        width: 100%;
        height: var(--header-height);
        backdrop-filter: saturate(100%) blur(3px);
        z-index: 3;
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
        header {
            justify-content: space-around;
        }

        header small {
            display: none;
        }
    }


    header h2 > a {
        text-decoration: none;
    }

    nav {
        margin-top: var(--spacing-small);
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
