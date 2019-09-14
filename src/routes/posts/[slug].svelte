<script context="module">  export async function preload({ params }) {
    const res = await this.fetch(`posts/${params.slug}.json`)

    if (res.ok) {
      const { post } = await res.json()
      return { post }
    }
    this.redirect(302, `${process.env.BASE_PATH}/posts`)
  }
</script>

<script>
  import Banner from '../../components/Banner.svelte'
  export let post
</script>

<style>
:global(article li) {
  list-style-type: initial;
}

:global(iframe) {
  width: 120%;
  height: 600px;
  margin-left: -10%;
}
</style>

<svelte:head>
  <title>{post.metadata.title}</title>

  <meta name="author" content={post.metadata.author} />
  <meta name="copyright" content={post.metadata.author} />
  <meta name="description" content={post.metadata.description} />
  <meta name="keywords" content={post.metadata.tags.join(',')} />
  <meta name="image" content={post.metadata.banner} />
  <meta name="canonical" content={post.metadata.canonical_url} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={post.metadata.banner} />
  <meta name="twitter:title" content={post.metadata.title} />
  <meta name="twitter:description" content={post.metadata.description} />

  <meta
    name="og:url"
    content={'https://timdeschryver.dev/posts/' + post.metadata.slug} />
  <meta name="og:title" content={post.metadata.title} />
  <meta name="og:description" content={post.metadata.description} />
  <meta name="og:type" content="article" />
  <meta name="og:image" content={post.metadata.banner} />
</svelte:head>

<article class="post">
  <Banner publisher={post.metadata.publisher} />
  <h2>{post.metadata.title}</h2>
  {@html post.html}
</article>
