<script context="module">  export async function preload({ params }) {
    const res = await this.fetch(`blog/${params.slug}.json`)

    if (res.ok) {
      const { post } = await res.json()
      return { post }
    }
    this.redirect(302, `${process.env.BASE_PATH}/blog`)
  }
</script>

<script>
  import Banner from '../../components/Banner.svelte'
  export let post
</script>

<style>
  header p {
    margin-top: 0;
    font-size: 0.83em;
  }

  :global(article li) {
    list-style-type: initial;
  }

  :global(article iframe) {
    width: 120%;
    height: 600px;
    margin-left: -10%;
  }

  :global(article p, article ul) {
    font-weight: var(--font-weight);
    transition-property: font-weight;
    transition-delay: var(--transition-duration);
  }

  :global(article code) {
    transition: all var(--transition-duration) ease-in-out;
  }

  :global(article table) {
    width: 100%;
  }

  :global(article th, article td) {
    text-align: left;
  }

  :global(article a) {
    color: inherit;
    border-bottom-color: var(--prime-color);
  }

  :global(article h3 + p, article h4 + p, article h5 + p) {
    margin-top: calc(var(--spacing) / 2);
  }
</style>

<svelte:head>
  <title>{post.metadata.title} - Tim Deschryver</title>

  <meta name="author" content={post.metadata.author} />
  <meta name="copyright" content={post.metadata.author} />
  <meta name="title" content={post.metadata.title} />
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
    content={'https://timdeschryver.dev/blog/' + post.metadata.slug} />
  <meta name="og:title" content={post.metadata.title} />
  <meta name="og:description" content={post.metadata.description} />
  <meta name="og:type" content="article" />
  <meta name="og:image" content={post.metadata.banner} />
</svelte:head>

<article>
  <Banner publisher={post.metadata.publisher} />
  <header>
    <h2>{post.metadata.title}</h2>
    <p>{post.metadata.date}</p>
  </header>
  {@html post.html}
</article>
