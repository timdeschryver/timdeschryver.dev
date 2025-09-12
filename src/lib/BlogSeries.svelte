<script lang="ts">
	import type { SeriesPost, BlogSeries } from './models';

	interface Props {
		series: BlogSeries;
		seriesPosts: SeriesPost[];
	}

	const { series, seriesPosts }: Props = $props();

	function getSeriesProgress(posts: SeriesPost[]): { current: number; total: number } {
		const currentIndex = posts.findIndex((post) => post.current);
		return {
			current: currentIndex + 1,
			total: posts.length,
		};
	}

	const progress = $derived(getSeriesProgress(seriesPosts));
</script>

<div class="blog-series">
	<p class="series-header">
		<span class="series-title">Series: {series.name}</span>
		<span class="series-progress">({progress.current}/{progress.total})</span>
	</p>

	<ol class="series-posts">
		{#each seriesPosts as post}
			<li class="series-post" class:current={post.current}>
				{#if post.current}
					<span class="post-title current-post">{post.title}</span>
				{:else}
					<a href="/blog/{post.slug}" class="post-title mark mark-hover" data-sveltekit-reload>
						{post.title}
					</a>
				{/if}
			</li>
		{/each}
	</ol>
</div>

<style>
	.blog-series {
		margin: 0 0 var(--spacing) 0;
		padding: 0;
	}

	.series-header {
		font-size: var(--font-size);
		font-weight: 400;
		margin: 0 0 var(--spacing-half) 0;
		color: var(--text-color-light);
	}

	.series-title {
		font-weight: 500;
		color: var(--text-color);
	}

	.series-progress {
		opacity: 0.8;
	}

	.series-posts {
		list-style: decimal;
		margin: 0;
		padding-left: 1.5rem;
		font-size: var(--font-size);
		line-height: var(--line-height);
	}

	.series-post {
		margin: var(--spacing-small) 0;
	}

	.post-title {
		font-weight: 300;
		color: var(--text-color-light);
		text-decoration: none;
	}

	.current-post {
		font-weight: 500;
		color: var(--text-color);
	}

	.post-title.mark {
		box-shadow: none;
		transition: box-shadow 0.2s ease-in-out;
	}

	.post-title.mark:hover {
		box-shadow: inset 0 -0.1375rem 0 hsla(var(--accent-color), 0.6);
	}

	@media (max-width: 768px) {
		.series-posts {
			padding-left: 1.25rem;
		}

		.series-header {
			font-size: 1rem;
		}
	}
</style>
