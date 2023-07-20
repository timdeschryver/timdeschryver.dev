<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { onDestroy, onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;
	const { bits } = data;

	let copyButtons: HTMLElement[] = [];

	onDestroy(() => {
		unRegisterCopyClick();
	});

	onMount(async () => {
		copyButtons = [...(document.querySelectorAll('.copy-code') as unknown as HTMLElement[])];
		copyButtons.forEach((pre) => pre.addEventListener('click', copyCodeOnClick));
	});

	function unRegisterCopyClick() {
		if (typeof document !== 'undefined') {
			copyButtons.forEach((pre) => pre.removeEventListener('click', copyCodeOnClick));
		}
	}

	function copyCodeOnClick(e: PointerEvent) {
		if (e.target instanceof HTMLElement) {
			const target = e.target;
			const ref = target.getAttribute('data-ref');
			const code = document.querySelector(`[id="${ref}"] code`);
			if (code instanceof HTMLElement) {
				navigator.clipboard.writeText(code.innerText).then(() => {
					target.innerHTML = 'assignment_turned_in';
					target.classList.add('success');
					setTimeout(() => {
						target.classList.remove('success');
						target.innerHTML = 'content_paste';
					}, 1000);
				});
			}
		}
	}
</script>

<Head title="Bits - Tim Deschryver" details={false} />

<svelte:head>
	<meta name="title" content={"Tim's Bits"} />
	<meta
		name="description"
		content={'A new bit every Tuesday of a tool | feature | blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="twitter:title" content={"Tim's Bits"} />
	<meta
		name="twitter:description"
		content={'A new bit every Tuesday of a tool | feature | blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="og:title" content={"Tim's Bits"} />
	<meta
		name="og:description"
		content={'A new bit every Tuesday of a tool | feature | blog that I encountered recently that has helped and/or impressed me.'}
	/>
	<meta name="og:type" content="website" />
</svelte:head>

<header class="mt-normal" />

{#each bits as bit}
	<section>
		{@html bit.html}
	</section>
{/each}

<style>
	section:not(:last-child) {
		border-top: 1px solid;
	}
</style>
