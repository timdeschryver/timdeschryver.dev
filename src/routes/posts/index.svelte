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
  import Head from '../../components/Head.svelte'
  export let posts
</script>

<style>
  a {
    border: none;
    color: var(--text-color);
    background-image: linear-gradient(
      to right,
      var(--prime-color),
      var(--prime-color) 50%,
      transparent 50%,
      transparent
    );
    background-position: 100% 0;
    background-size: 201% 100%;
    transition: all 447ms ease-in;
  }

  a:hover {
    color: var(--prime-color-text);
    background-position: 0 0;
  }

  li {
    transition: all 447ms ease-in;
  }

  li:nth-child(even):hover {
    transform: scale(1.1) rotate(1deg);
  }

  li:nth-child(odd):hover {
    transform: scale(1.1) rotate(-1deg);
  }

  [data-publisher='Angular In Depth'] {
    background-image: linear-gradient(
      to right,
      var(--aid-color),
      var(--aid-color) 50%,
      transparent 50%,
      transparent
    );
  }

  [data-publisher='Angular In Depth']:hover {
    color: var(--aid-color-text);
  }

  [data-publisher='ITNEXT'] {
    background-image: linear-gradient(
      to right,
      var(--itnext-color),
      var(--itnext-color) 50%,
      transparent 50%,
      transparent
    );
  }

  [data-publisher='ITNEXT']:hover {
    color: var(--itnext-color-text);
  }

  li:not(:first-child) {
    margin-top: 3em;
  }

  p {
    margin-top: calc(var(--spacing) / 3);
    color: var(--text-color-50);
  }

  small {
    color: var(--text-color-70);
  }

  h2 {
    font-weight: normal;
  }
</style>

<Head title="Posts" />

<ul>
  {#each posts as post}
    <li>
      <h2>
        {#if post.metadata.publisher}
          <a
            href={post.metadata.publish_url}
            data-publisher={post.metadata.publisher}>
             {post.metadata.title} - {post.metadata.publisher}
          </a>
          <a
            href="/posts/{post.metadata.slug}"
            style="display:none;visibility:hidden">
            keep
          </a>
        {:else}
          <a rel="prefetch" href="/posts/{post.metadata.slug}">
             {post.metadata.title}
          </a>
        {/if}
      </h2>
      <small>{post.metadata.dateFormat}</small>
      <p>{post.metadata.description}</p>
    </li>
  {/each}
</ul>

<a href="/rss.xml" style="display:none;visibility:hidden">keep</a>
<a href="/posts/rss.xml" style="display:none;visibility:hidden">keep</a>
