<script>
  export let snippets
</script>

<style>
  :global(.anchor:before) {
    top: -10%;
  }
</style>

{#each snippets as snippet, index}
  {@html snippet.html}

  {#if index < snippets.length - 1}
    <hr />
  {/if}
{/each}
