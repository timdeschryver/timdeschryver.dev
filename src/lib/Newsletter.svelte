<script>
	export let beehiivId = '6e82f6ae-d456-4c88-8cda-8ceb01587e01';
	export let hideTitle = false;
</script>

<div style="padding: 1em; border: 1px solid; background: var(--background-color-transparent)">
	{#if !hideTitle}
		<h4>Join My Newsletter (WIP)</h4>
	{/if}
	<div class="mt-0">
		<p>
			Join my weekly newsletter to receive my latest blog posts and bits, directly in your inbox.
		</p>
		<iframe
			title="Subscribe to my newsletter"
			src={`https://embeds.beehiiv.com/${beehiivId}?slim=true`}
			data-test-id="beehiiv-embed"
			frameborder="0"
			scrolling="no"
			style="width: 100%; height: 51px; margin: 0; border-radius: 0px !important; background-color: transparent;"
		></iframe>
	</div>
</div>
