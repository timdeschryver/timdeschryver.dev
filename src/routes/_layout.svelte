<script>
  import { afterUpdate } from 'svelte'
  import Settings from '../components/Settings.svelte'

  export let segment

  afterUpdate(() => {
    if (typeof gtag === 'function') {
      gtag('config', process.env.GA_TRACKING_ID, {
        page_path: window.location.pathname,
      })
    }
  })
</script>

<style>
  header {
    position: relative;
  }

  header > div {
    margin-top: 0.3em;
  }

  a:not(:last-child) {
    margin-right: 0.5em;
  }

  .active {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 0.3em;
    padding: 0.3em 0.7em;
  }

  /* .settings {
    position: absolute;
    right: 10px;
    bottom: 10px;
  } */
</style>

<header>
  <h1>
    <a href="/">Tim Deschryver</a>
  </h1>
  <div>
    <a href="/blog" class:active={segment === 'blog'}>Blog</a>
    <a href="/snippets" class:active={segment === 'snippets'}>Snippets</a>
    <a href="/newsletter" class:active={segment === 'newsletter'}>Newsletter</a>
  </div>
  <!-- <div class="settings">Settings</div> -->
</header>
<main>
  <Settings />
  <slot />
</main>

<footer />
