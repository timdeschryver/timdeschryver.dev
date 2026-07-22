<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	let ad: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (dev || !ad) {
			return;
		}
		const adElement = ad;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;

				observer.disconnect();
				const script = document.createElement('script');
				script.async = true;
				script.src =
					'https://cdn.carbonads.com/carbon.js?serve=CW7DV237&placement=timdeschryverdev&format=responsive';
				script.id = '_carbonads_js';
				adElement.appendChild(script);
			},
			{ rootMargin: '300px' },
		);
		observer.observe(adElement);

		return () => observer.disconnect();
	});
</script>

<div bind:this={ad}></div>
