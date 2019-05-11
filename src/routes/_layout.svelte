<script>
  import SocialLinks from '../components/SocialLinks.svelte'
  export let segment
</script>

<style>
  main,
  header,
  footer {
    margin-left: auto;
    margin-right: auto;
    max-width: 47rem;
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
    color: #fff;
    box-shadow: 2px 2px var(--prime-color-shadow);
    transition: all 0.2s ease-in-out;
    font-size: 1.5em;
  }

  nav .nav-item:hover {
    box-shadow: 3px 3px var(--prime-color-shadow);
  }

  footer {
    border-top: 2px var(--prime-color) solid;
  }
</style>

<header>
  <h1>
    <a href="/">Tim Deschryver</a>
  </h1>

  <nav>
    <a href="posts" class="nav-item">Posts</a>
  </nav>
</header>

<main>
  <slot />
</main>

{#if segment !== undefined}
  <footer>
    <div>
      Follow me on:
      <SocialLinks separator="&" />
    </div>
  </footer>
{/if}
