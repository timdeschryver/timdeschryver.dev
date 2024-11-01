<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [editUrl]
	 */

	/** @type {Props} */
	let { editUrl = '' } = $props();
</script>

<p>
	Feel free to update this blog post on <a
		class="mark"
		target="_blank"
		rel="noreferrer"
		href={editUrl}>GitHub</a
	>, thanks in advance!
</p>

<style>
	p {
		font-style: italic;
	}
</style>
