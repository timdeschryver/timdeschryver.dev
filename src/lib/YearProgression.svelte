<script lang="ts">
	type RunningStats = {
		kilometers: number;
		activityCount: number | null;
		year: number;
	};

	type GitHubStats = {
		totalCommits: number;
		repositoryCount: number | null;
	};

	let {
		stats,
		githubStats,
		blogPostsThisYear,
		blogReadingMinutes,
	}: {
		stats: RunningStats;
		githubStats: GitHubStats | null;
		blogPostsThisYear: number;
		blogReadingMinutes: number;
	} = $props();

	const distance = $derived(
		new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(stats.kilometers),
	);

	const commits = $derived(
		githubStats ? new Intl.NumberFormat('en').format(githubStats.totalCommits) : null,
	);
	const repositoryLabel = $derived.by(() => {
		if (!githubStats || githubStats.repositoryCount === null) {
			return null;
		}

		const repositories = new Intl.NumberFormat('en').format(githubStats.repositoryCount);
		return `across ${repositories} ${githubStats.repositoryCount === 1 ? 'repository' : 'repositories'}`;
	});

	const yearProgress = $derived.by(() => {
		const now = new Date();
		const start = new Date(stats.year, 0, 1);
		const end = new Date(stats.year + 1, 0, 1);
		return ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
	});
</script>

<aside class="year-stats" aria-label="Year to date stats" style="--progress: {yearProgress}%">
	<div class="progress-bar" title="{yearProgress.toFixed(1)}% through {stats.year}">
		<div class="progress-fill"></div>
		<span class="year-label"
			>{stats.year} <span class="year-pct">· {Math.round(yearProgress)}%</span></span
		>
	</div>

	<div class="grid">
		<div class="stat">
			<span class="label">Running</span>
			<div class="value-row">
				<strong class="number">{distance}</strong>
				<span class="unit">km</span>
			</div>
			{#if stats.activityCount}
				<span class="sub">{stats.activityCount} activities</span>
			{/if}
		</div>

		{#if blogPostsThisYear > 0}
			<div class="stat">
				<span class="label">Blog</span>
				<div class="value-row">
					<strong class="number">{blogPostsThisYear}</strong>
					<span class="unit">{blogPostsThisYear === 1 ? 'post' : 'posts'}</span>
				</div>
				{#if blogReadingMinutes > 0}
					<span class="sub">{blogReadingMinutes} min reading</span>
				{/if}
			</div>
		{/if}

		{#if commits}
			<div class="stat">
				<span class="label">GitHub</span>
				<div class="value-row">
					<strong class="number">{commits}</strong>
					<span class="unit">commits</span>
				</div>
				{#if repositoryLabel}
					<span class="sub">{repositoryLabel}</span>
				{/if}
			</div>
		{/if}
	</div>
</aside>

<style>
	.year-stats {
		--accent-color: var(--base-color);
		width: 100%;
		border-bottom: 1px solid hsla(var(--accent-color), 0.2);
		padding: 0 0 1rem;
	}

	.year-stats * {
		margin-top: 0;
	}

	.progress-bar {
		position: relative;
		width: 100%;
		height: 2px;
		background: hsla(var(--accent-color), 0.15);
		margin-bottom: 1.1rem;
	}

	.progress-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: var(--progress);
		background: hsl(var(--accent-color));
	}

	.year-label {
		position: absolute;
		top: 4px;
		right: 0;
		font-family: var(--head-font);
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-color-subtle);
		white-space: nowrap;
	}

	.year-pct {
		font-weight: 400;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0 1.5rem 0 0;
	}

	.stat + .stat {
		padding-left: 1.5rem;
		border-left: 1px solid hsla(var(--accent-color), 0.2);
	}

	.label {
		font-family: var(--head-font);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-color-subtle);
	}

	.value-row {
		display: flex;
		align-items: baseline;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.number {
		font-family: var(--head-font);
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		font-weight: 800;
		line-height: 1;
		color: var(--text-color);
		font-variant-numeric: tabular-nums;
	}

	.unit {
		font-family: var(--head-font);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-color-light);
	}

	.sub {
		font-size: 0.8rem;
		color: var(--text-color-subtle);
		font-weight: 400;
	}

	@media (max-width: 480px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 1rem 0;
		}

		.stat:nth-child(odd) {
			padding-right: 1rem;
		}

		.stat:nth-child(even) {
			padding-left: 1rem;
			border-left: 1px solid hsla(var(--accent-color), 0.2);
		}

		.stat + .stat:nth-child(3) {
			border-left: none;
			padding-left: 0;
		}

		.number {
			font-size: 1.8rem;
		}
	}
</style>
