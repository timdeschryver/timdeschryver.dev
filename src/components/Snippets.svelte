<script>
  export let snippets
</script>

<ul>
  {#each snippets as snippet}
    <li>
      {@html snippet.html}
    </li>
  {/each}
</ul>
