<section class="support" aria-labelledby="support-heading">
	<div class="support-icon" aria-hidden="true">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
			<path
				d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
			/>
		</svg>
	</div>

	<div class="support-content">
		<p class="eyebrow">Enjoying the blog?</p>
		<h4 id="support-heading">Support my work</h4>
		<p class="description">
			If you enjoyed this post and found it useful, consider supporting my work. It helps me keep
			creating and sharing content like this. Thank you!
		</p>

		<div class="actions">
			<a
				href="https://ko-fi.com/W7W579HXS"
				target="_blank"
				rel="noreferrer"
				class="support-link primary"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
					<path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
					<path d="M6 5h9" />
				</svg>
				Buy me a coffee
			</a>
			<a
				target="_blank"
				rel="noreferrer"
				href="https://www.paypal.com/donate?hosted_button_id=59M5TFPQJS8SQ"
				class="support-link"
			>
				Donate with PayPal
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					aria-hidden="true"
				>
					<path d="m9 18 6-6-6-6" />
				</svg>
			</a>
		</div>
	</div>
</section>

<style>
	.support {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: clamp(1rem, 3vw, 1.5rem);
		padding: clamp(1.25rem, 4vw, 2rem);
		border: 1px solid var(--line-color);
		border-radius: 0.85rem;
		background:
			linear-gradient(135deg, hsla(var(--accent-color), 0.1), transparent 55%),
			var(--background-color-subtle);
	}

	.support-icon {
		display: grid;
		place-items: center;
		width: 3rem;
		height: 3rem;
		margin-top: 0;
		border-radius: 50%;
		background: hsla(var(--accent-color), 0.13);
		color: hsla(var(--accent-color), 0.85);
	}

	.support-icon svg {
		width: 1.35rem;
		height: 1.35rem;
	}

	.support-content,
	.eyebrow,
	h4,
	.actions,
	.support-link,
	.support-link svg {
		margin-top: 0;
	}

	.eyebrow {
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.68rem;
		font-weight: 680;
		letter-spacing: 0.11em;
		line-height: 1.2;
		text-transform: uppercase;
	}

	h4 {
		margin-top: 0.4rem;
		font-size: clamp(1.35rem, 4vw, 1.65rem);
	}

	.description {
		max-width: 58ch;
		margin-top: 0.65rem;
		color: var(--text-color-light);
		font-size: 0.98rem;
		line-height: 1.6;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 1.15rem;
	}

	.support-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 2.65rem;
		padding: 0.55rem 0.9rem;
		border: 1px solid var(--line-color);
		border-radius: 0.5rem;
		background: var(--background-color);
		font-family: var(--head-font);
		font-size: 0.84rem;
		font-weight: 650;
		line-height: 1.2;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			transform 0.2s ease;
	}

	.support-link.primary {
		border-color: hsla(var(--accent-color), 0.4);
		background: hsla(var(--accent-color), 0.13);
	}

	.support-link:hover {
		border-color: hsla(var(--accent-color), 0.55);
		background: hsla(var(--accent-color), 0.18);
		transform: translateY(-1px);
	}

	.support-link svg {
		width: 1rem;
		height: 1rem;
		flex: 0 0 auto;
	}

	@media (max-width: 480px) {
		.support {
			grid-template-columns: 1fr;
		}

		.support-icon {
			width: 2.65rem;
			height: 2.65rem;
		}

		.actions {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
