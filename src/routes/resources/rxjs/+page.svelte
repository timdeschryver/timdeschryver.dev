<script lang="ts">
	import Head from '$lib/Head.svelte';
	let resources = [
		{
			title: 'Getting Started with RxJS',
			links: [
				{
					link: 'https://rxjs.dev/',
					text: 'Documentation',
					category: '📖',
				},
				{
					link: 'https://www.pluralsight.com/courses/rxjs-angular-reactive-development',
					text: 'RxJS in Angular: Reactive Development (Pluralsight Course) - Deborah Kurata',
					category: '📺',
				},
				{
					link: 'https://www.youtube.com/watch?v=cjjjaOsc6JI',
					text: 'Common patterns with example - Kwinten Pisman',
					category: '🎤',
				},
				{
					link: 'https://ncjamieson.com/',
					text: 'Nicholas Jamieson’s blog with detailed RxJS articles',
					category: '✍️',
				},
				{
					link: 'https://benlesh.com/posts/rxjs-operators-in-depth-part-1/',
					text: 'What is an operator? Why do they exist? Observables are "sets" - Ben Lesh',
					category: '✍️',
				},
				{
					link: 'https://this-is-learning.github.io/rxjs-fundamentals-course',
					text: 'RxJS Fundamentals Course - This is Learning',
					category: '📖',
				},
			],
		},
		{
			title: 'Alternative documentation (with examples)',
			links: [
				{
					link: 'https://www.learnrxjs.io/',
					text: 'Learn RxJS',
					category: '📖',
				},
				{
					link: 'https://indepth.dev/reference/rxjs',
					text: 'indepth.dev RxJS Reference',
					category: '📖',
				},
			],
		},
		{
			title: 'Bonus material',
			links: [
				{
					link: 'https://www.youtube.com/channel/UCmvhqGbbqkhJ63V3g-l-5Gg',
					text: 'RxJS Live',
					category: '🎤',
				},
			],
		},
	];
</script>

<Head title="RxJS - Tim Deschryver" details={false} />

<svelte:head>
	<meta name="description" content="RxJS Resources I share a lot" />
	<meta name="image" content={`https://timdeschryver.dev/images/rxjs.png`} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={`https://timdeschryver.dev/images/rxjs.png`} />
	<meta name="twitter:image:alt" content="The RxJS Logo" />
	<meta name="twitter:title" content="RxJS Resources" />
	<meta name="twitter:description" content="RxJS Resources I share a lot" />
	<meta name="og:url" content={`https://timdeschryver.dev/resources/rxjs`} />
	<meta name="og:title" content="Resources: RxJS" />
	<meta name="og:description" content="RxJS Resources I share a lot" />
	<meta name="og:type" content="article" />
	<meta name="og:image" content={`https://timdeschryver.dev/images/rxjs.png`} />
</svelte:head>

<h1>RxJS Resources</h1>
<p>
	It took me a while to "get" RxJS, and the "click" came after using RxJS for a while. Here are some
	resources that helped me understand RxJS better.
</p>

<p>
	The recommendation that I can give you is to take it step-by-step, and first learn the most
	frequently used operators and ignore the rest. From my experience this includes:
</p>
<ul>
	<li><a href="https://rxjs.dev/api/operators/map">map</a></li>
	<li><a href="https://rxjs.dev/api/operators/concatMap">concatMap</a></li>
	<li><a href="https://rxjs.dev/api/operators/switchMap">switchMap</a></li>
	<li><a href="https://rxjs.dev/api/operators/exhaustMap">exhaustMap</a></li>
	<li><a href="https://rxjs.dev/api/operators/catchError">catchError</a></li>
	<li><a href="https://rxjs.dev/api/operators/debounce">debounce</a></li>
	<li><a href="https://rxjs.dev/api/operators/combineLatest">combineLatest</a></li>
	<li><a href="https://rxjs.dev/api/operators/merge">merge</a></li>
</ul>

<blockquote>
	To get a better idea which operators are the most frequently used in your own project run <code
		>npx rxjs-operator-counter</code
	> in your project.
</blockquote>

{#each resources as resource}
	<h2>{resource.title}</h2>

	<ul>
		{#each resource.links as link}
			<li class="mt-0"><a href={link.link}>{link.category} {link.text}</a></li>
		{/each}
	</ul>
{/each}
