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
    margin-top: 0;
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
    transition: box-shadow 300ms;

    box-shadow: var(--prime-color-03) 13px 13px 1px 0px;
    border-bottom: 3px solid var(--prime-color);
    border-right: 3px solid var(--prime-color);
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
