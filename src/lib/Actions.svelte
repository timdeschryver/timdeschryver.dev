<script lang="ts">
	type Props = {
		editUrl?: string;
		contentType?: string;
	};

	let { editUrl = '', contentType = 'blog post' }: Props = $props();
</script>

<p>
	Feel free to update this {contentType} on
	<a class="mark" target="_blank" rel="noreferrer" href={editUrl}>GitHub</a>, thanks in advance!
</p>

<style>
	p {
		font-style: italic;
	}
</style>
