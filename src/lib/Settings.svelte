<script lang="ts">
	import { onMount } from 'svelte';
	let colorBg;
	let codeTheme;
	$: dispatchColor('--background-color', colorBg);
	$: dispatchCodeTheme(codeTheme);
	onMount(() => {
		colorBg = localStorage.getItem('--background-color');
		codeTheme = document.body.dataset.theme;
	});
	function dispatchColor(key, value) {
		if (!value) return;
		window.dispatchEvent(
			new CustomEvent('set-css-variable', {
				detail: {
					key,
					value,
				},
			}),
		);
	}
	function dispatchCodeTheme(value) {
		if (!value) return;
		window.dispatchEvent(
			new CustomEvent('set-data-attribute', {
				detail: {
					key: 'theme',
					value,
				},
			}),
		);
	}
</script>

<div class="settings">
	<label for="bg">Background</label>
	<input id="bg" type="color" bind:value={colorBg} />

	<label for="theme">Theme</label>
	<select id="theme" bind:value={codeTheme}>
		<option value="rose-pine-moon">Rosé Pine Moon</option>
		<option value="rose-pine-dark">Rosé Pine Dark</option>
		<option value="rose-pine-dawn">Rosé Pine Dawn</option>
		<option value="night-owl">Night Owl</option>
		<option value="atom-dark">Atom Dark</option>
		<option value="dracula">Dracula</option>
		<option value="nord">Nord</option>
	</select>
</div>

<style>
	input[type='color'] {
		width: 40px;
		height: 40px;
		border: 1px solid;
		border-radius: 40px;
		background: none;
	}
	input[type='color']::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	input[type='color']::-webkit-color-swatch {
		border: solid 1px transparent;
		border-radius: 40px;
	}
	.settings {
		width: 100%;
		max-width: 80ch;
		display: grid;
		grid-template-columns: 1fr 2fr;
		grid-template-rows: repeat(3, 1fr);
		align-items: center;
		padding: 1em 0;
	}
	* {
		margin-top: 0;
	}
</style>
