<script lang="ts">
	import { onMount } from 'svelte';
	let ad: HTMLDivElement;

	onMount(() => {
		const script = document.createElement('script');
		script.async = true;
		script.type = 'text/javascript';
		script.src =
			'//cdn.carbonads.com/carbon.js?serve=CW7DV237&placement=timdeschryverdev&format=responsive';
		script.id = '_carbonads_js';
		ad.appendChild(script);
	});
</script>

<div bind:this={ad}></div>
