<script lang="ts">
	import Head from '$lib/Head.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;
	const { bits, tags } = data;

	let copyButtons: HTMLElement[] = [];

	let query: string;
	let params: URLSearchParams;

	onMount(async () => {
		params = new URLSearchParams(window.location.search);
		// fallback, sometimes `query` seems to be undefined
		query = $page.url.searchParams.get('q') || params.get('q') || '';

		copyButtons = [...(document.querySelectorAll('.copy-code') as unknown as HTMLElement[])];
		copyButtons.forEach((pre) => pre.addEventListener('click', copyCodeOnClick));
	});

	onDestroy(() => {
		unRegisterCopyClick();
	});

	$: if (params) {
		if (query) {
			params.set('q', query);
			window.history.replaceState(window.history.state, '', `${location.pathname}?${params}`);
		} else {
			params.delete('q');
			window.history.replaceState(window.history.state, '', location.pathname);
		}
	}

	$: queryParts = (query || '').split(' ').filter(Boolean);

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

	function tagClicked(tag) {
		if (queryParts.includes(tag)) {
			query = queryParts.filter((q) => q !== tag).join(' ');
		} else {
			query = query ? `${query.trim()} ${tag}` : tag;
		}
	}

	function tagSelected(tag: string) {
		return queryParts.includes(tag);
	}
</script>

<Head title="Bits - Tim Deschryver" details={false} />

<svelte:head>
	<meta name="title" content={"Tim's Bits"} />
	<meta
		name="description"
		content={'A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="twitter:title" content={"Tim's Bits"} />
	<meta
		name="twitter:description"
		content={'A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped and/or impressed me.'}
	/>

	<meta name="og:title" content={"Tim's Bits"} />
	<meta
		name="og:description"
		content={'A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped and/or impressed me.'}
	/>
	<meta name="og:type" content="website" />
</svelte:head>

<header class="mt-normal">
	<h3>
		A new bit every Tuesday of a tool || feature || blog that I encountered recently that has helped
		and/or impressed me.
	</h3>

	<div class="mt-normal">
		{#each tags as tag}
			<button class:active={queryParts && tagSelected(tag)} on:click={() => tagClicked(tag)}>
				# {tag}
			</button>
		{/each}
	</div>
</header>

{#each bits as bit}
	{#if queryParts.length === 0 || bit.metadata.tags.some((tag) => tagSelected(tag))}
		{@html bit.html}
	{/if}
{/each}

<style>
	button {
		color: var(--text-color-light);
		transition: color 0.2s ease;
	}

	button:hover {
		color: var(--text-color);
	}

	button.active {
		border-color: currentColor;
		color: var(--text-color);
	}
</style>
