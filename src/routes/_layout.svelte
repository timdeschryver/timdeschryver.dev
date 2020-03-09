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

  footer {
    text-align: center;
  }

  footer > a {
    margin-top: 0;
    color: var(--prime-color);
    margin: 0.7em 0.4em;
  }

  footer svg {
    transition: transform 300ms;
  }

  footer svg:hover {
    transform: scale(1.3);
  }

  /* https://neumorphism.io/#f8c400 */
  .active {
    border-radius: 10px;
    background: #f8c400;
    box-shadow: 6px 6px 11px #d3a700, -6px -6px 11px #ffe100;
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
    <a href="/blog" rel="prefetch" class:active={segment === 'blog'}>Blog</a>
    <a href="/snippets" rel="prefetch" class:active={segment === 'snippets'}>
      Snippets
    </a>
    <a href="/newsletter" class:active={segment === 'newsletter'}>Newsletter</a>

    <button
      aria-label="settings"
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

{#if segment !== undefined}
  <footer>
    <a
      rel="noopener noreferrer"
      href="https://twitter.com/intent/user?screen_name=tim_deschryver">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        aria-label="Visit my Twitter"
        fill="currentColor">
        <path
          d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574
          2.165-2.724-.951.564-2.005.974-3.127
          1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797
          6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523
          6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949
          4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07
          1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142
          0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
      </svg>
    </a>
    <a href="newsletter">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 36 36"
        aria-label="Join my Newsletter"
        shape-rendering="geometricPrecision"
        style="transform: translateY(10px);">
        <g>
          <g>
            <polygon
              fill="currentColor"
              points="26,25 19,25 19,30 12,25 6,25 6,8 26,8 " />
          </g>
          <g>
            <g>
              <path
                d="M24,9c0.5,0,1,0.5,1,1v13c0,0.5-0.5,1-1,1h-4h-2v2v2l-4.8-3.6L12.7,24H12H8c-0.5,0-1-0.5-1-1V10c0-0.5,0.5-1,1-1H24
                M24,7H8c-1.7,0-3,1.4-3,3v13c0,1.6,1.3,3,3,3h4l8,6v-6h4c1.7,0,3-1.4,3-3V10C27,8.4,25.7,7,24,7L24,7z" />
            </g>
          </g>
          <g>
            <polygon
              points="16,17.8 7,11 7,13.5 10.3,16 7,18.5 7,21 12,17.2 16,20.2
              20,17.2 25,21 25,18.5 21.7,16 25,13.5 25,11 " />
          </g>
          <g>
            <path
              fill="currentColor"
              d="M21.6,3.1c-1.1-1.3-3-1.4-4.2-0.4L16,3.8l-1.4-1.1c-1.3-1.1-3.2-0.9-4.2,0.4c-1.1,1.3-0.9,3.2,0.4,4.2
              l5.2,4.4l5.2-4.4C22.5,6.2,22.7,4.3,21.6,3.1z" />
            <path
              d="M16,13l-5.8-4.9C9.3,7.5,8.8,6.5,8.7,5.5c-0.1-1.1,0.2-2.1,0.9-3c0.7-0.9,1.8-1.5,3-1.5c0.9,0,1.8,0.3,2.6,1L16,2.5
              l0.8-0.6C17.5,1.4,18.4,1,19.3,1c1.2,0,2.3,0.5,3.1,1.4c0.7,0.7,1,1.7,0.9,2.7c-0.1,1.1-0.6,2.1-1.5,2.9L16,13z
              M12.7,3
              c-0.6,0-1.1,0.3-1.5,0.7c-0.4,0.5-0.6,1-0.5,1.5c0.1,0.5,0.3,1,0.7,1.3l4.6,3.9l4.6-3.9c0.4-0.4,0.7-0.9,0.8-1.5
              c0-0.5-0.1-0.9-0.4-1.3c-0.7-0.9-2-1-2.8-0.3l-2,1.6l-2-1.6C13.6,3.2,13.1,3,12.7,3z" />
          </g>
        </g>
      </svg>
    </a>
    <a href="blog/rss.xml">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        aria-label="Subscribe to my RSS Feed"
        fill="currentColor">
        <path
          d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796
          0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001
          3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966
          11.022
          11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046
          19.152 8.594 19.183
          19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" />
      </svg>
    </a>
  </footer>
{/if}
