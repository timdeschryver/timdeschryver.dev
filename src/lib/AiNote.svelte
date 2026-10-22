<script lang="ts">
	let { text }: { text: string } = $props();
</script>

<div class="custom-block info-ai ai-note" role="note" aria-label="Written with AI">
	<div class="custom-block-title">
		<span class="custom-block-icon">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M12 8V4H8" />
				<rect width="16" height="12" x="4" y="8" rx="2" />
				<path d="M2 14h2" />
				<path d="M20 14h2" />
				<path d="M15 13v2" />
				<path d="M9 13v2" />
			</svg>
		</span>
		Written with AI
	</div>
	<p>{text}</p>
</div>

<style>
	.ai-note {
		margin-top: var(--spacing);
	}
</style>
