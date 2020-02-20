<script>
  import { afterUpdate } from 'svelte'
  import Settings from '../components/Settings.svelte'

  export let segment
  let toggleSettings = false

  afterUpdate(() => {
    if (typeof gtag === 'function') {
      gtag('config', process.env.GA_TRACKING_ID, {
        page_path: window.location.pathname,
      })
    }
  })
</script>

<style>
  nav {
    margin-top: 0.3em;
    position: relative;
  }

  nav > a {
    padding: 0.3em 0.7em;
  }

  nav > a:not(:last-child) {
    margin-right: 0.5em;
  }

  .active {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0.3em;
  }

  .settings-button {
    position: absolute;
    right: 0;
    margin-top: 0;
    bottom: 0;
    border: none;
    background: none;
    color: unset;
    cursor: pointer;
  }

  .settings-container {
    margin-top: 0;
    grid-column: 1 / 4;
    background: rgba(248, 196, 0, 0.5);
  }
</style>

<header>
  <h1>
    <a href="/">Tim Deschryver</a>
  </h1>
  <nav>
    <a href="/blog" ref="prefetch" class:active={segment === 'blog'}>Blog</a>
    <a href="/snippets" ref="prefetch" class:active={segment === 'snippets'}>
      Snippets
    </a>
    <a href="/newsletter" class:active={segment === 'newsletter'}>Newsletter</a>

    <button
      class="settings-button"
      on:click={() => (toggleSettings = !toggleSettings)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="2em"
        height="2em"
        viewBox="0 0 464.736 464.736">
        <path
          d="M446.598 18.143c-24.183-24.184-63.393-24.191-87.592-.008l-16.717
          16.717c-8.98-8.979-23.525-8.979-32.504 0-8.981 8.972-8.981 23.533 0
          32.505l5.416 5.419-180.588 180.601h-.016l-62.685 62.691a28.21 28.21 0
          00-8.235 18.684l-.15 3.344v.046l-2.529 56.704a9.445 9.445 0 002.739
          7.048 9.356 9.356 0 006.63 2.738c.135 0 .269 0
          .42-.008l30.064-1.331h.016l18.318-.815 8.318-.366a36.993 36.993 0
          0024.469-10.776L392.87 150.445l4.506 4.505a22.92 22.92 0 0016.252
          6.733 22.919 22.919 0 0016.253-6.733c8.98-8.973 8.98-23.534
          0-32.505l16.716-16.718c24.185-24.183 24.185-63.393.001-87.584zM272.639
          227.33l-84.6 15.96 137.998-138.004 34.332 34.316-87.73 87.728zM64.5
          423.872c-35.617 0-64.5 9.145-64.5 20.435 0 11.284 28.883 20.428 64.5
          20.428s64.486-9.143
          64.486-20.428c0-11.291-28.869-20.435-64.486-20.435z" />
      </svg>
    </button>
  </nav>
</header>

<div hidden={!toggleSettings} class="settings-container">
  <Settings />
</div>

<main>
  <slot />
</main>

<footer />
