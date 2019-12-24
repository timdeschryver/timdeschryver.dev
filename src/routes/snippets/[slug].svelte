<script context="module">  export async function preload({ params }) {
    const res = await this.fetch('snippets.json')

    if (res.ok) {
      const { snippets } = await res.json()
      const snippet = snippets.find(s => s.metadata.slug === params.slug)
      if (!snippet) {
        this.redirect(302, `${process.env.BASE_PATH}/snippets`)
      }
      return { snippets, snippet }
    }
    this.error(500, 'Something went wrong...')
  }
</script>

<script>
  import { onMount } from 'svelte'
  import Head from '../../components/Head.svelte'
  import Snippets from '../../components/Snippets.svelte'

  export let snippets
  export let snippet

  onMount(async () => {
    document.getElementById(snippet.metadata.slug).scrollIntoView({
      behavior: 'smooth',
    })
  })
</script>

<Head title="Snippets - Tim Deschryver" social={false} />

<svelte:head>
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:description" content={snippet.metadata.title} />
  <meta name="twitter:image" content={snippet.metadata.image} />

  <meta name="og:description" content={snippet.metadata.title} />
  <meta name="og:image" content={snippet.metadata.image} />
</svelte:head>

<Snippets {snippets} />
