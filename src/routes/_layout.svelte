<script>
  import { afterUpdate, onMount } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  export let segment
  let theme

  afterUpdate(() => {
    if (typeof gtag === 'function') {
      gtag('config', process.env.GA_TRACKING_ID, {
        page_path: window.location.pathname,
      })
    }
  })

  onMount(() => {
    theme = document.body.className

    window.addEventListener('changeTheme', evt => {
      theme = evt.detail.theme
      document.body.className = evt.detail.theme
      try {
        localStorage && localStorage.setItem('__theme', evt.detail.theme)
      } catch (_) {}
    })
  })

  function setTheme(theme) {
    window.dispatchEvent(
      new CustomEvent('changeTheme', {
        detail: {
          theme,
        },
      }),
    )
  }
</script>

<style>
  main,
  header,
  footer {
    margin-left: auto;
    margin-right: auto;
    max-width: var(--content-width);
    padding: 0.75em 1.3125em;
  }

  header,
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  header nav {
    margin: 0;
  }

  header {
    border-bottom: 2px var(--prime-color) solid;
  }

  header a {
    color: var(--text-color);
    border: none;
  }

  nav .nav-item {
    background: var(--prime-color);
    padding: 2px 4px;
    color: var(--background-color);
    border: 1px solid;
    box-shadow: 2px 2px var(--prime-color-shadow);
    transition: all var(--transition-duration) ease-in-out;
    font-size: 1.5em;
  }

  nav .nav-item:hover {
    box-shadow: 3px 3px var(--prime-color-shadow);
  }

  footer {
    border-top: 2px var(--prime-color) solid;
    flex-direction: row-reverse;
    font-weight: 900;
  }

  button[role='presentation'] {
    background: none;
    border: none;
    display: block;
    outline: none;
    cursor: pointer;
    margin: 0;
  }

  a.social-link {
    border: none;
  }

  aside {
    max-width: calc(var(--content-width) + 13rem);
    margin: auto;
  }

  aside ul {
    position: fixed;
    transform: translateY(300px);
    transition: all var(--transition-duration) ease-in-out;
  }

  @media (max-width: 1050px) {
    aside ul {
      margin-left: 10px;
    }
  }

  @media (max-width: 850px) {
    aside ul {
      transform: translateY(-59px);
      position: absolute;
    }
  }

  @media (max-width: 800px) {
    div:not([data-page='home']) h1 {
      transform: translateX(24px);
      transition: all var(--transition-duration) ease-in-out;
      transition-delay: 111ms;
    }
  }
</style>

<div data-page={segment || 'home'}>
  <header>
    <h1>
      <a href="/">Tim Deschryver</a>
    </h1>

    <nav>
      <a href="posts" class="nav-item">Posts</a>
    </nav>
  </header>

  {#if segment !== undefined && theme !== undefined}
    <aside>
      <ul>
        <li>
          {#if theme === 'sunrise'}
            <button
              role="presentation"
              aria-label="sunrise"
              out:fly={{ y: 147, duration: 347 }}
              in:fade={{ delay: 348 }}
              on:click={() => setTheme('sunset')}>
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
                class="feather feather-sunset">
                <path d="M17 18a5 5 0 0 0-10 0" />
                <line x1="12" y1="9" x2="12" y2="2" />
                <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
                <line x1="1" y1="18" x2="3" y2="18" />
                <line x1="21" y1="18" x2="23" y2="18" />
                <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
                <line x1="23" y1="22" x2="1" y2="22" />
                <polyline points="16 5 12 9 8 5" />
              </svg>
            </button>
          {:else}
            <button
              role="presentation"
              aria-label="sunset"
              out:fly={{ y: -147, duration: 347 }}
              in:fade={{ delay: 348 }}
              on:click={() => setTheme('sunrise')}>
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
                class="feather feather-sunrise">
                <path d="M17 18a5 5 0 0 0-10 0" />
                <line x1="12" y1="2" x2="12" y2="9" />
                <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
                <line x1="1" y1="18" x2="3" y2="18" />
                <line x1="21" y1="18" x2="23" y2="18" />
                <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
                <line x1="23" y1="22" x2="1" y2="22" />
                <polyline points="8 6 12 2 16 6" />
              </svg>
            </button>
          {/if}
        </li>
      </ul>
    </aside>
  {/if}

  <main>
    <slot />
  </main>

  {#if segment !== undefined}
    <footer>
      <a href="https://twitter.com/tim_deschryver" class="social-link">
        @tim_deschryver
      </a>
    </footer>
  {/if}
</div>
