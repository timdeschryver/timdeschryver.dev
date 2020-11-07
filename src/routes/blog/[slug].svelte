<script context="module">
  export async function preload({ params }) {
    const result = await this.fetch(`/blog/${params.slug}.json`);
    const post = await result.json();
    return { post };
  }
</script>

<script>
  export let post;
</script>

<style>
  h1 {
    word-break: break-word;
  }
  .article-action {
    background: none;
    margin: 0;
    cursor: pointer;
    text-decoration: none;
    text-transform: uppercase;
    color: var(--prime-color);
    font-size: 0.75rem;
    line-height: 2.5;
    border: none;
    font-weight: 900;
    white-space: nowrap;
  }
  .article-action:not(:last-child) {
    margin-right: 17px;
  }
  .selection-actions {
    margin-top: 0;
    position: absolute;
    transform: translate(-78px, 10px);
    mix-blend-mode: normal !important;
  }
  .selection-actions button {
    margin: 0;
    margin-left: 5px;
    cursor: pointer;
    text-decoration: none;
    text-transform: uppercase;
    border: none;
    padding: 0.25rem 1rem;
    font-size: 0.75rem;
    line-height: 2.5;
    font-weight: 900;
    background: var(--prime-color);
  }
  .article-actions {
    text-align: center;
  }
</style>

<svelte:head>
  <title>{post.metadata.title} - Tim Deschryver</title>

  <link rel="canonical" href="{post.metadata.canonical_url}" />

  <meta name="author" content="{post.metadata.author}" />
  <meta name="copyright" content="{post.metadata.author}" />
  <meta name="title" content="{post.metadata.title}" />
  <meta name="description" content="{post.metadata.description}" />
  <meta name="keywords" content={post.metadata.tags.join(',')} />
  <meta name="image" content="{post.metadata.banner}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="{post.metadata.banner}" />
  <meta name="twitter:title" content="{post.metadata.title}" />
  <meta name="twitter:description" content="{post.metadata.description}" />
  <meta name="twitter:label1" content="Written by" />
  <meta name="twitter:data1" content="{post.metadata.author}" />
  <meta name="twitter:label2" content="Published on" />
  <meta name="twitter:data2" content="{post.metadata.humanDate}" />

  <meta name="og:url" content="{post.metadata.canonical_url}" />
  <meta name="og:title" content="{post.metadata.title}" />
  <meta name="og:description" content="{post.metadata.description}" />
  <meta name="og:type" content="article" />
  <meta name="og:image" content="{post.metadata.banner}" />
</svelte:head>

<h1>{post.metadata.title}</h1>
<time datetime="{post.metadata.humanDate}">{post.metadata.humanDate}</time>

{@html post.html}

<div class="article-actions">
  <a
    class="article-action"
    target="_blank"
    rel="nofollow noreferrer"
    href="https://twitter.com/intent/tweet?text={post.metadata.title}&via=tim_deschryver&url={post.metadata.canonical_url}"
  >
    Share on Twitter
  </a>
  <a
    class="article-action"
    href="https://twitter.com/search?q={post.metadata.canonical_url}"
    target="_blank"
    rel="nofollow noreferrer"
  >
    Discuss on Twitter
  </a>
  <a
    class="article-action"
    target="_blank"
    rel="nofollow noreferrer"
    href="https://github.com/timdeschryver/timdeschryver.dev/tree/master/static/content/blog/{post.metadata.slug}/index.md"
  >
    Edit on GitHub
  </a>
</div>
