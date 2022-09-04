<script lang="ts">
	import { onMount } from 'svelte';

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
	});
</script>

<div bind:this={divElement} />
