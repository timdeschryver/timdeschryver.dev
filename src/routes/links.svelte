<script context="module">  export async function preload() {
    const res = await this.fetch(`links.json`)
    if (res.ok) {
      const { posts } = await res.json()
      return { posts }
    }
    this.error(500, 'Something went wrong...')
  }
</script>

<script>
  export let posts
</script>

<ul>
  <li>
    <a href="/blog/rss.xml">RSS Feed</a>
  </li>
  <li>
    <a href="/sitemap.xml">Sitemap</a>
  </li>
  <li>
    <a href="/snippets">Snippets</a>
  </li>
  <li>
    <a href="/resources/ngrx">Resources - NgRx</a>
  </li>
  {#each posts as post}
    <li>
      <a href="/blog/{post.metadata.slug}">{post.metadata.title}</a>
    </li>
  {/each}
</ul>
