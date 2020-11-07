<script context="module" lang="ts">
  export async function preload({ params }) {
    const result = await this.fetch(`/snippets.json`);
    const snippets = await result.json();
    const snippet = snippets.find(
      (snippet) => snippet.metadata.slug === params.slug
    );
    return { snippets, snippet };
  }
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import Snippets from "../../components/Snippets.svelte";
  export let snippets;
  export let snippet;

  onMount(async () => {
    document.getElementById(snippet.metadata.slug).scrollIntoView({
      behavior: "smooth",
    });
  });
</script>

<svelte:head>
  <title>Snippets - Tim Deschryver</title>

  <meta name="author" content={snippet.metadata.author} />
  <meta name="copyright" content={snippet.metadata.author} />
  <meta name="title" content={snippet.metadata.title} />
  <meta name="keywords" content={snippet.metadata.tags.join(',')} />
  <meta name="image" content={snippet.metadata.image} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={snippet.metadata.image} />
  <meta name="twitter:title" content="Tim Deschryver's Snippets" />
  <meta name="twitter:description" content={snippet.metadata.title} />
  <meta name="twitter:label1" content="Snippet by" />
  <meta name="twitter:data1" content={snippet.metadata.author} />

  <meta name="og:title" content="Tim Deschryver's Snippets" />
  <meta name="og:description" content={snippet.metadata.title} />
  <meta name="og:type" content="article" />
  <meta name="og:image" content={snippet.metadata.image} />
</svelte:head>

<Snippets {snippets} />
