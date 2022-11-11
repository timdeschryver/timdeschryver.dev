<script lang="ts">
	import Head from '$lib/Head.svelte';
	import confetti from 'canvas-confetti';

	let lastConfetti = 0;
	function fireConfetti(evt: MouseEvent): void {
		if (lastConfetti + 1_111 > Date.now()) return;

		lastConfetti = Date.now();

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

<Head title="Tim Deschryver" details={true} />

<section>
	<h1>
		Hi, I'm Tim <div class="wave">👋</div>
	</h1>

	<p>
		A software engineer from Belgium who enjoys to <strong
			on:mouseover={fireConfetti}
			on:focus={fireConfetti}><a href="/blog">blog</a></strong
		>
		about my experiences with the aim to help others and my future self, primarily on
		<strong on:mouseover={fireConfetti} on:focus={fireConfetti}>Angular</strong>
		and
		<strong on:mouseover={fireConfetti} on:focus={fireConfetti}>.NET</strong>.
	</p>

	<p>
		Lifelong learner and <strong on:mouseover={fireConfetti} on:focus={fireConfetti}
			><a href="https://github.com/timdeschryver" rel="external">open-source enthusiast</a></strong
		>, mainly working on <a href="https://ngrx.io/" rel="external">NgRx</a> and
		<a href="https://testing-library.com/angular" rel="external">Angular Testing Library</a>.
	</p>

	<p>
		Recognized by Microsoft as a <strong on:mouseover={fireConfetti} on:focus={fireConfetti}
			><a
				href="https://mvp.microsoft.com/en-us/PublicProfile/5004452?fullName=Tim%20Deschryver"
				rel="external">Most Valuable Professional (MVP)</a
			></strong
		>.
	</p>

	<p>
		Also a hobby <strong on:mouseover={fireConfetti} on:focus={fireConfetti}>runner</strong>.
	</p>

	<p>
		You can find me on <a href="https://timdeschryver.dev/github" rel="external">GitHub</a> and
		<a href="https://timdeschryver.dev/twitter" rel="external">Twitter</a><a
			style="display:none"
			rel="me"
			href="https://mastodon.social/@timdeschryver">Mastodon</a
		>.
	</p>
</section>

<style>
	section {
		text-align: center;
		font-size: 1.25rem;
		margin-top: 2em;
	}

	/* Thanks to https://codepen.io/jakejarvis/pen/pBZWZw */
	.wave {
		animation-name: wave-animation;
		animation-duration: 2.5s;
		animation-iteration-count: infinite;
		transform-origin: 70% 70%;
		display: inline-block;
	}

	@keyframes wave-animation {
		0% {
			transform: rotate(0deg);
		}
		10% {
			transform: rotate(14deg);
		}
		20% {
			transform: rotate(-8deg);
		}
		30% {
			transform: rotate(14deg);
		}
		40% {
			transform: rotate(-4deg);
		}
		50% {
			transform: rotate(10deg);
		}
		60% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}
</style>
