<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from './theme.store';

	let divElement: HTMLElement;

	onMount(() => {
		const scriptElm = document.createElement('script');
		scriptElm.setAttribute('repo', 'timdeschryver/timdeschryver.dev');
		scriptElm.setAttribute('issue-term', 'og:title');
		scriptElm.setAttribute('theme', 'preferred-color-scheme');
		scriptElm.setAttribute('label', '💬 Utterences');
		scriptElm.setAttribute('crossorigin', 'anonymous');

		scriptElm.src = 'https://utteranc.es/client.js';

		divElement.appendChild(scriptElm);

		theme.subscribe((theme) => {
			const message = {
				type: 'set-theme',
				theme: theme === 'dark' ? 'github-dark' : 'github-light',
			};
			const utterances = document.querySelector('iframe.utterances-frame') as HTMLFrameElement;
			utterances?.contentWindow.postMessage(message, 'https://utteranc.es');
		});
	});
</script>

<div bind:this={divElement} />
