<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from './theme.store';

	let divElement: HTMLElement = $state();

	onMount(() => {
		const scriptElm = document.createElement('script');
		scriptElm.setAttribute('data-repo', 'timdeschryver/timdeschryver.dev');
		scriptElm.setAttribute('data-repo-id', 'MDEwOlJlcG9zaXRvcnkxNzg3MjYyMDg=');
		scriptElm.setAttribute('data-category', 'Announcements');
		scriptElm.setAttribute('data-category-id', 'DIC_kwDOCqclQM4CYFDh');
		scriptElm.setAttribute('data-mapping', 'og:title');
		scriptElm.setAttribute('data-strict', '0');
		scriptElm.setAttribute('data-reactions-enabled', '1');
		scriptElm.setAttribute('data-emit-metadata', '0');
		scriptElm.setAttribute('data-input-position', 'top');
		scriptElm.setAttribute('data-theme', $theme === 'dark' ? 'dark' : 'light');
		scriptElm.setAttribute('data-lang', 'en');
		scriptElm.setAttribute('data-loading', 'lazy');

		scriptElm.src = 'https://giscus.app/client.js';
		divElement.appendChild(scriptElm);

		theme.subscribe((theme) => {
			const message = {
				setConfig: {
					theme: theme === 'dark' ? 'dark' : 'light',
				},
			};
			const frame = document.querySelector('iframe.giscus-frame') as HTMLFrameElement;
			frame?.contentWindow.postMessage({ giscus: message }, 'https://giscus.app');
		});
	});
</script>

<div bind:this={divElement} class="mt-0"></div>
