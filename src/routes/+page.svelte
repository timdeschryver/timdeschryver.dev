<script lang="ts">
	import { resolve } from '$app/paths';
	import Head from '$lib/Head.svelte';
	import YearProgression from '$lib/YearProgression.svelte';

	type RunningStats = {
		kilometers: number;
		totalHours: number | null;
		year: number;
		updatedAt: string;
	};

	type GitHubStats = {
		totalCommits: number;
		repositoryCount: number | null;
		year: number;
	};

	let {
		data,
	}: {
		data: {
			stravaRunning: RunningStats | null;
			githubStats: GitHubStats | null;
			blogPostsThisYear: number;
			blogReadingMinutes: number;
		};
	} = $props();
	const showYearProgression = false;

	let lastConfetti = 0;
	async function fireConfetti(evt: MouseEvent | FocusEvent): Promise<void> {
		if (evt instanceof FocusEvent) {
			return;
		}
		if (lastConfetti + 1_111 > Date.now()) return;

		lastConfetti = Date.now();
		const { default: confetti } = await import('canvas-confetti');

		const defaults = {
			disableForReducedMotion: true,
			origin: { x: evt.x / window.innerWidth, y: (evt.y - 1) / window.innerHeight },
		};
		confetti({
			...defaults,
			spread: 26,
			startVelocity: 55,
			particleCount: Math.floor(200 * 0.25),
		});
		confetti({
			...defaults,
			spread: 60,
			particleCount: Math.floor(200 * 0.2),
		});
		confetti({
			...defaults,
			spread: 100,
			decay: 0.91,
			scalar: 0.8,
			particleCount: Math.floor(200 * 0.35),
		});
		confetti({
			...defaults,
			spread: 120,
			startVelocity: 25,
			decay: 0.92,
			scalar: 1.2,
			particleCount: Math.floor(200 * 0.1),
		});
		confetti({
			...defaults,
			spread: 120,
			startVelocity: 45,
			particleCount: Math.floor(200 * 0.1),
		});
	}
</script>

<Head
	title="Tim Deschryver - .NET and Angular Software Engineer"
	description="Tim Deschryver is a software engineer and Microsoft MVP from Belgium who writes about .NET, Angular, testing, and developer tooling."
	canonical="https://timdeschryver.dev"
	type="profile"
/>

<section class="profile">
	<div class="intro-label">Software engineer · Belgium</div>
	<h1>Hi, I'm Tim <span class="wave">👋</span></h1>
	<nav class="profile-socials" aria-label="Social profiles">
		<span>Elsewhere</span>
		<a href="https://www.linkedin.com/in/tim-deschryver" rel="me external">LinkedIn</a>
		<a href="https://bsky.app/profile/timdeschryver.dev" rel="me external">Bluesky</a>
		<a href="https://twitter.com/tim_deschryver" rel="me external">Twitter</a>
		<a href="https://github.com/timdeschryver" rel="me external">GitHub</a>
	</nav>

	<dl class="profile-details">
		<div class="profile-detail">
			<dt>Work & writing</dt>
			<dd>
				<p>
					I’m a software engineer who <strong onmouseover={fireConfetti} onfocus={fireConfetti}
						><a class="mark mark-hover" href={resolve('/blog')}>writes</a></strong
					>
					about lessons learned while working with
					<strong onmouseover={fireConfetti} onfocus={fireConfetti}>.NET</strong>
					and
					<strong onmouseover={fireConfetti} onfocus={fireConfetti}>Angular</strong>, both to help
					others and my future self.
				</p>
			</dd>
		</div>
		<div class="profile-detail">
			<dt>Open source</dt>
			<dd>
				<p>
					I’m an <strong onmouseover={fireConfetti} onfocus={fireConfetti}
						><a class="mark mark-hover" href="https://github.com/timdeschryver" rel="external"
							>open-source enthusiast</a
						></strong
					>
					and core team member of
					<a class="mark mark-hover" href="https://ngrx.io/" rel="external">NgRx</a>
					and
					<a class="mark mark-hover" href="https://testing-library.com/angular" rel="external"
						>Angular Testing Library</a
					>, contributing to their ongoing development and maintenance.
				</p>
			</dd>
		</div>
		<div class="profile-detail">
			<dt>Recognition</dt>
			<dd>
				<p>
					Recognized by Microsoft as a <strong onmouseover={fireConfetti} onfocus={fireConfetti}
						><a
							class="mark mark-hover"
							href="https://mvp.microsoft.com/en-us/PublicProfile/5004452?fullName=Tim%20Deschryver"
							rel="external">Most Valuable Professional (MVP)</a
						></strong
					>.
				</p>
			</dd>
		</div>
		<div class="profile-detail">
			<dt>Beyond code</dt>
			<dd>
				<p>
					Also a hobby <strong onmouseover={fireConfetti} onfocus={fireConfetti}>runner</strong>.
				</p>
			</dd>
		</div>
		<div class="profile-detail current-interests">
			<dt><h2 id="current-interests-title">Currently exploring</h2></dt>
			<dd class="interest-list">
				<div class="interest">
					<h3>Agentic AI</h3>
					<p>
						Applying coding agents to real software-development workflows and integrating agentic AI
						into applications in a thoughtful, practical way.
					</p>
				</div>
				<div class="interest">
					<h3>Sociocracy 3.0</h3>
					<p>Exploring better ways for teams to collaborate and make decisions.</p>
				</div>
			</dd>
		</div>
	</dl>

	{#if showYearProgression && data.stravaRunning}
		<YearProgression
			stats={data.stravaRunning}
			githubStats={data.githubStats}
			blogPostsThisYear={data.blogPostsThisYear}
			blogReadingMinutes={data.blogReadingMinutes}
		/>
	{/if}

	<p>
		<strong>Kaizen 改善</strong> (kai.zen): Kaizen is an approach to creating continuous improvement based
		on the idea that small, ongoing positive changes can reap significant improvements.
	</p>
</section>

<style>
	.profile {
		position: relative;
		font-size: 1.25rem;
		margin-top: clamp(4rem, 12vh, 8rem);
		padding-top: 1.5rem;
	}

	.profile::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: clamp(4rem, 18vw, 10rem);
		height: 1px;
		background: var(--text-color);
	}

	h1 {
		max-width: 10ch;
		margin-top: clamp(1.25rem, 3vw, 2rem);
		font-size: clamp(3.5rem, 10vw, 7rem);
		font-weight: 760;
		line-height: 0.9;
		letter-spacing: -0.07em;
		text-wrap: balance;
	}

	.intro-label {
		margin: 0 0 1.25rem;
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-color-light);
	}

	.profile-socials {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.35rem 1rem;
		margin-top: clamp(1.25rem, 3vw, 2rem);
		font-size: 0.85rem;
	}

	.profile-socials > * {
		margin-top: 0;
	}

	.profile-socials span {
		margin-right: 0.25rem;
		color: var(--text-color-light);
		font-family: var(--head-font);
		font-size: 0.68rem;
		font-weight: 650;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.profile-socials a {
		font-weight: 550;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.profile-details {
		margin-top: clamp(2.5rem, 6vw, 4rem);
		border-top: 1px solid var(--line-color);
		border-bottom: 1px solid var(--line-color);
	}

	.profile-detail {
		display: grid;
		grid-template-columns: minmax(9rem, 0.4fr) minmax(0, 1fr);
		gap: clamp(1rem, 4vw, 3rem);
		align-items: start;
		margin-top: 0;
		padding: clamp(1.25rem, 3vw, 2rem) 0;
	}

	.profile-detail + .profile-detail {
		border-top: 1px solid var(--line-color);
	}

	.profile-detail dt {
		font-family: var(--head-font);
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-color-light);
	}

	.profile-detail dd,
	.profile-detail p {
		margin-top: 0;
	}

	.profile-detail p {
		max-width: 48ch;
		font-size: clamp(1.05rem, 2vw, 1.2rem);
		line-height: 1.6;
	}

	.current-interests h2 {
		margin: 0;
		font: inherit;
		letter-spacing: inherit;
	}

	.interest-list,
	.interest {
		margin-top: 0;
	}

	.interest + .interest {
		margin-top: clamp(1.25rem, 3vw, 2rem);
		padding-top: clamp(1.25rem, 3vw, 2rem);
		border-top: 1px solid var(--line-color);
	}

	.interest h3 {
		margin-top: 0;
		font-size: clamp(1.1rem, 2vw, 1.35rem);
		line-height: 1.25;
	}

	.interest p {
		max-width: 48ch;
		margin-top: 0;
		color: var(--text-color-light);
		font-size: 1rem;
		line-height: 1.6;
	}

	@media (max-width: 620px) {
		.profile {
			margin-top: 3rem;
		}

		h1 {
			font-size: clamp(3.2rem, 18vw, 5rem);
		}

		.profile-detail {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.profile-detail p {
			font-size: 1.05rem;
		}

		.interest p {
			margin-top: 0.35rem;
		}
	}
</style>
