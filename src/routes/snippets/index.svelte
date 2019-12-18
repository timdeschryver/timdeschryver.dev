<script context="module">  export async function preload() {
    const res = await this.fetch(`snippets.json`)
    if (res.ok) {
      const { snippets } = await res.json()
      return { snippets }
    }
    this.error(500, 'Something went wrong...')
  }
</script>

<script>
  import Head from '../../components/Head.svelte'
  export let snippets
</script>

<Head title="Snippets" />

<ul>
  {#each snippets as snippet}
    <li>
      {@html snippet.html}
    </li>
  {/each}
</ul>
