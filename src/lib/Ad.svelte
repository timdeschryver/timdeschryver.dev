<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	let ad: HTMLDivElement = $state();

	onMount(() => {
		if (dev) {
			return;
		}
		const script = document.createElement('script');
		script.async = true;
		script.type = 'text/javascript';
		script.src =
			'//cdn.carbonads.com/carbon.js?serve=CW7DV237&placement=timdeschryverdev&format=responsive';
		script.id = '_carbonads_js';
		// eslint-disable-next-line svelte/no-dom-manipulating -- Carbon Ads requires injecting its script into the ad container.
		ad.appendChild(script);
	});
</script>

<div bind:this={ad}></div>
