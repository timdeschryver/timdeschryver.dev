<script lang="ts">
	type RunningStats = {
		kilometers: number;
		activityCount: number | null;
	};

	let { stats }: { stats: RunningStats } = $props();

	const distance = $derived(
		new Intl.NumberFormat('en', {
			maximumFractionDigits: 1,
		}).format(stats.kilometers),
	);
</script>

<aside class="running-stats" aria-label="Running stats">
	<div class="distance">
		<span class="source">Running</span>
		<strong>{distance}</strong>
		<span>km</span>
		{#if stats.activityCount}
			<span class="separator">/</span>
			<span class="activities">{stats.activityCount} activities</span>
		{/if}
	</div>
</aside>

<style>
	.running-stats {
		--accent-color: var(--svelte);
		max-width: 22rem;
		padding: 0.55em 0.75em;
		border: 1px solid hsla(var(--accent-color), 0.25);
		border-left-width: 0.3rem;
		border-radius: 3px;
		background: var(--background-color-transparent);
		font-weight: 300;
	}

	.running-stats * {
		margin-top: 0;
	}

	.source,
	.distance {
		font-family: var(--head-font);
	}

	.distance {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.3rem;
		line-height: 1;
	}

	.source {
		flex-basis: 100%;
		color: var(--text-color-light);
		font-size: 0.8rem;
		font-weight: 700;
	}

	.distance strong {
		color: var(--text-color);
		font-size: 2rem;
		font-weight: 800;
	}

	.distance span {
		color: var(--text-color-light);
		font-size: 0.9rem;
		font-weight: 700;
	}

	.distance .separator,
	.distance .activities {
		color: var(--text-color-subtle);
		font-size: 0.85rem;
		font-weight: 400;
	}

	@media (max-width: 480px) {
		.running-stats {
			max-width: none;
		}

		.distance strong {
			font-size: 1.8rem;
		}
	}
</style>
