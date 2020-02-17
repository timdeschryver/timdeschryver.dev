<script>
  export let snippets
</script>

<style>
  :global(h3 > a) {
    border-bottom: none;
  }
</style>

{#each snippets as snippet, index}
  {@html snippet.html}

  {#if index < snippets.length - 1}
    <hr />
  {/if}
{/each}
