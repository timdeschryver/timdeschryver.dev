<script>
  export let snippets
</script>

{#each snippets as snippet, index}
  <article>
    {@html snippet.html}

    {#if index < snippets.length - 1}
      <hr />
    {/if}
  </article>
{/each}
