<script>
	import Socials from './Socials.svelte';

	export let editUrl = '';
</script>

<hr />

<div class="article-actions">
	<a class="mt-0" target="_blank" rel="noreferrer" href={editUrl}> Edit on GitHub </a>
	<Socials short={true} />
</div>

<hr />

<style>
	.article-actions {
		display: flex;
		justify-content: space-evenly;
	}

	a {
		font-weight: bold;
	}
</style>
