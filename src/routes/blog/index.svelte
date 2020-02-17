<script context="module">
  export async function preload() {
    const res = await this.fetch(`blog.json`)
    if (res.ok) {
      const { posts } = await res.json()
      return { posts }
    }
    this.error(500, 'Something went wrong...')
  }
</script>

<script>
  import Head from '../../components/Head.svelte'
  export let posts
</script>

<style>
  li:not(:first-child) {
    margin-top: 3em;
  }

  p {
    margin-top: calc(var(--spacing) / 3);
    font-size: 1em;
  }

  time {
    font-size: 0.8em;
    opacity: 0.8;
  }

  ul {
    list-style: none;
  }

  li {
    padding: 0.5em;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    border-right: 3px solid transparent;
  }

  li:hover {
    box-shadow: var(--prime-color-shadow) 13px 13px 1px 0px;
    border-bottom: 3px solid var(--prime-color);
    border-right: 3px solid var(--prime-color);
  }

  li a {
    font-size: initial;
  }

  h2 {
    line-height: 1.2;
  }
</style>

<Head title="Blog - Tim Deschryver" />

<ul>
  {#each posts as post}
    <li>
      <a rel="prefetch" href={`/blog/${post.metadata.slug}`}>
        <h2>{post.metadata.title}</h2>
        <time datetime={post.metadata.date}>{post.metadata.date}</time>

        <p>{post.metadata.description}</p>
      </a>
    </li>
  {/each}
</ul>
