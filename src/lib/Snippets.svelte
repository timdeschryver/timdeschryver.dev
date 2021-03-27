<script lang="ts">
	export let snippets;
</script>

{#each snippets as snippet, index}
	<a style="display:none; visibility: hidden" hidden sveltekit:prefetch href={snippet.metadata.url}
		>{snippet.metadata.url}</a
	>
	{@html snippet.html}
	{#if index < snippets.length - 1}
		<hr />
	{/if}
{/each}
