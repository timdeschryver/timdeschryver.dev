<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} [text]
	 * @property {string} [url]
	 * @property {string} [title]
	 * @property {boolean} [compact]
	 */

	/** @type {Props} */
	let { text = '', url = '', title = '', compact = false } = $props();

	let blueskyUrl = $derived(
		createShareUrl('https://bsky.app/intent/compose', { text: `${text} ${url}` }),
	);
	let twitterUrl = $derived(
		createShareUrl('https://twitter.com/intent/tweet', { text, via: 'tim_deschryver', url }),
	);
	let linkedInUrl = $derived(
		createShareUrl('https://www.linkedin.com/sharing/share-offsite/', { url }),
	);

	/** @param {string} baseUrl @param {Record<string, string>} parameters */
	function createShareUrl(baseUrl, parameters) {
		const shareUrl = new URL(baseUrl);
		for (const [key, value] of Object.entries(parameters)) {
			shareUrl.searchParams.set(key, value);
		}
		return shareUrl.toString();
	}
</script>

<section class:compact class="share" aria-label={title}>
	<div class="heading">
		<h4>{title}</h4>
		{#if !compact}
			<p>Know someone who might find this useful? Share it with them.</p>
		{/if}
	</div>

	<div class="links">
		<a
			target="_blank"
			rel="noreferrer"
			href={blueskyUrl}
			class="share-link"
			aria-label="Share on Bluesky"
		>
			<svg class="social-icon bluesky-icon" viewBox="0 0 1024 1024" aria-hidden="true">
				<use href="/images/social-icons.svg#bluesky" />
			</svg>
			<span>Bluesky</span>
		</a>
		<a
			target="_blank"
			rel="noreferrer"
			href={twitterUrl}
			class="share-link"
			aria-label="Share on Twitter"
		>
			<svg class="social-icon twitter-icon" viewBox="0 0 24 24" aria-hidden="true">
				<use href="/images/social-icons.svg#twitter" />
			</svg>
			<span>Twitter</span>
		</a>
		<a
			target="_blank"
			rel="noreferrer"
			href={linkedInUrl}
			class="share-link"
			aria-label="Share on LinkedIn"
		>
			<svg class="social-icon linkedin-icon" viewBox="0 0 15 15" aria-hidden="true">
				<use href="/images/social-icons.svg#linkedin" />
			</svg>
			<span>LinkedIn</span>
		</a>
	</div>
</section>

<style>
	.share {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: clamp(1.25rem, 4vw, 1.75rem);
		border: 1px solid var(--line-color);
		border-radius: 0.85rem;
		background: var(--background-color-subtle);
	}

	.heading,
	h4,
	.heading p,
	.links,
	.share-link,
	.share-link span,
	.social-icon {
		margin-top: 0;
	}

	h4 {
		font-size: clamp(1.15rem, 3vw, 1.35rem);
	}

	.heading p {
		margin-top: 0.35rem;
		color: var(--text-color-light);
		font-size: 0.88rem;
		line-height: 1.45;
	}

	.links {
		display: flex;
		flex: 0 0 auto;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.share-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 2.5rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--line-color);
		border-radius: 0.5rem;
		background: var(--background-color);
		font-family: var(--head-font);
		font-size: 0.8rem;
		font-weight: 620;
		line-height: 1.2;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			transform 0.2s ease;
	}

	.share-link:hover {
		border-color: hsla(var(--accent-color), 0.55);
		background: hsla(var(--accent-color), 0.12);
		transform: translateY(-1px);
	}

	.social-icon {
		width: 1.1rem;
		height: 1.1rem;
		flex: 0 0 auto;
	}

	.bluesky-icon {
		width: 1.52rem;
		height: 1.52rem;
	}

	.linkedin-icon {
		width: 1.04rem;
		height: 1.04rem;
	}

	.share.compact {
		display: block;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: none;
	}

	.compact h4 {
		color: var(--text-color-light);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.compact .links {
		display: flex;
		gap: 0.35rem;
		margin-top: 0.65rem;
	}

	.compact .share-link {
		width: 2.65rem;
		height: 2.65rem;
		min-height: 2.65rem;
		padding: 0;
		border: 0;
		background: none;
	}

	.compact .share-link:hover {
		background: var(--background-color-transparent);
		color: var(--text-color);
		transform: none;
	}

	.compact .share-link span {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 640px) {
		.share:not(.compact) {
			align-items: stretch;
			flex-direction: column;
		}

		.share:not(.compact) .links {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.share:not(.compact) .share-link {
			padding-inline: 0.4rem;
		}
	}

	@media (max-width: 380px) {
		.share:not(.compact) .links {
			grid-template-columns: 1fr;
		}
	}
</style>
