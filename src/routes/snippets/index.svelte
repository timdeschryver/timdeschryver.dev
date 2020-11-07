<script context="module" lang="ts">
  export async function preload() {
    const result = await this.fetch(`/snippets.json`);
    const snippets = await result.json();
    return { snippets };
  }
</script>

<script lang="ts">
  import Head from "../../components/Head.svelte";
  import Snippets from "../../components/Snippets.svelte";
  export let snippets;
</script>

<Head title="Snippets - Tim Deschryver" />

<Snippets {snippets} />
