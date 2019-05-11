<script context="module">
  export async function preload({ params }) {
    const res = await this.fetch(`posts/${params.slug}.json`)
    if (res.ok) {
      return { post: await res.json() }
    }

    this.error(404, 'Not found')
  }
</script>

<script>
  export let post
</script>

<svelte:head>
  <title>{post.metadata.title}</title>

  <meta name="author" content={post.metadata.author} />
  <meta name="copyright" content={post.metadata.author} />
  <meta name="description" content={post.metadata.description} />
  <meta name="keywords" content={post.metadata.tags.join(',')} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={post.metadata.banner} />
  <meta name="twitter:title" content={post.metadata.title} />
  <meta name="twitter:description" content={post.metadata.description} />

  <meta name="og:title" content={post.metadata.title} />
  <meta name="og:description" content={post.metadata.description} />
  <meta name="og:type" content="article" />
  <meta name="og:image" content={post.metadata.banner} />
</svelte:head>

<article class="post prism-dark">
  <h2>{post.metadata.title}</h2>
  {@html post.html}
</article>
