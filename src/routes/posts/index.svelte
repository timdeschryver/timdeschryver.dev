<script context="module">
  export async function preload() {
    const res = await this.fetch(`posts.json`)
    if (res.ok) {
      const posts = await res.json()
      return {
        posts: posts.filter(p => p.metadata.published),
      }
    }

    this.error(404, 'Not found')
  }
</script>

<script>
  export let posts
</script>

<style>
  a {
    border: none;
    color: var(--text-color);
    transition: all 0.3s ease-in-out;
  }

  a:hover {
    background: var(--prime-color);
    color: #fff;
  }

  [data-publisher='Angular In Depth']:hover {
    background: var(--aid-color);
    color: var(--aid-color-text);
  }

  [data-publisher='ITNEXT']:hover {
    background: var(--itnext-color);
    color: var(--itnext-color-text);
  }

  li:not(:first-child) {
    margin-top: 3em;
  }

  p {
    margin-top: calc(var(--spacing) / 3);
    color: var(--text-color-faded);
  }

  small {
    color: var(--text-color-faded);
  }

  h2 {
    font-weight: normal;
  }
</style>

<svelte:head>
  <title>Posts</title>
</svelte:head>

<ul>
  {#each posts as post}
    <li>
      <h2>
        {#if post.metadata.publisher}
          <a href={post.metadata.publish_url} data-publisher={post.metadata.publisher}> {post.metadata.title} - {post.metadata.publisher}</a>
          <a href="/posts/{post.metadata.slug}" style="display:none;visibility:hidden" />
        {:else}
          <a rel="prefetch" href="/posts/{post.metadata.slug}">{post.metadata.title}</a>
        {/if}
      </h2>
      <small>{post.metadata.dateFormat}</small>
      <p>{post.metadata.description}</p>
    </li>
  {/each}
</ul>
