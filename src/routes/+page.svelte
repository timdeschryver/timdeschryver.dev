<script lang="ts">
	import Head from '$lib/Head.svelte';
	import confetti from 'canvas-confetti';
	import Socials from '$lib/Socials.svelte';

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
			on:focus={fireConfetti}><a class="mark mark-hover" href="/blog">blog</a></strong
		>
		about my experiences with the aim to help others and my future self, primarily on
		<strong on:mouseover={fireConfetti} on:focus={fireConfetti}>Angular</strong>
		and
		<strong on:mouseover={fireConfetti} on:focus={fireConfetti}>.NET</strong>.
	</p>

	<p>
		Lifelong learner and <strong on:mouseover={fireConfetti} on:focus={fireConfetti}
			><a class="mark mark-hover" href="https://github.com/timdeschryver" rel="external"
				>open-source enthusiast</a
			></strong
		>, mainly working on <a class="mark mark-hover" href="https://ngrx.io/" rel="external">NgRx</a>
		and
		<a class="mark mark-hover" href="https://testing-library.com/angular" rel="external"
			>Angular Testing Library</a
		>.
	</p>

	<p>
		Recognized by Microsoft as a <strong on:mouseover={fireConfetti} on:focus={fireConfetti}
			><a
				class="mark mark-hover"
				href="https://mvp.microsoft.com/en-us/PublicProfile/5004452?fullName=Tim%20Deschryver"
				rel="external">Most Valuable Professional (MVP)</a
			></strong
		>.
	</p>

	<p>
		Also a hobby <strong on:mouseover={fireConfetti} on:focus={fireConfetti}>runner</strong>.
	</p>

	<p>
		<Socials />
	</p>
</section>

<style>
	section {
		text-align: center;
		font-size: 1.25rem;
		margin-top: 2em;
	}
</style>
