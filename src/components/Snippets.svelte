<script>
  export let snippets
</script>

{#each snippets as snippet, index}
  {@html snippet.html}

  {#if index < snippets.length - 1}
    <hr />
  {/if}
{/each}
