<script>
  import { afterUpdate, onMount } from 'svelte'

  let theme
  let reduceMotion = false

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

    reduceMotion = window.matchMedia('(prefers-reduced-motion)').matches
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', evt => {
      reduceMotion = evt.matches
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
  header > div {
    margin-top: 0.7rem;
  }
</style>

<header>
  <h1>
    <a href="/">Tim Deschryver</a>
  </h1>
  <div>
    <a href="/blog">Blog</a>
    ·
    <a href="/snippets">Snippets</a>
    ·
    <a href="/newsletter">Newsletter</a>
  </div>

</header>

<main>
  <slot />
</main>

<footer />
