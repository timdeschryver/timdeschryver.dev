<script context="module">
  export async function preload({ params }) {
    const result = await this.fetch(`/snippets.json`)
    const snippets = await result.json();
    return { snippets };
  }
</script>

<script>
import Head from '../../components/Head.svelte'
import Snippets from '../../components/Snippets.svelte'
export let snippets
</script>

<Head title="Snippets - Tim Deschryver" />

<Snippets {snippets} />