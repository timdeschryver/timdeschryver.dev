<script context="module">  export async function preload() {
    const res = await this.fetch('snippets.json')

    if (res.ok) {
      const { snippets } = await res.json()
      return { snippets }
    }
    this.error(500, 'Something went wrong...')
  }
</script>

<script>
  import Head from '../../components/Head.svelte'
  import Snippets from '../../components/Snippets.svelte'

  export let snippets
</script>

<Head title="Snippets - Tim Deschryver" />

<Snippets {snippets} />
