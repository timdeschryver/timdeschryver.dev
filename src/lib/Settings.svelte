<script lang="ts">
	import { onMount } from "svelte";
	let colorPrime;
	let colorBg;
	let codeTheme;
	$: dispatchColor("--prime-color", colorPrime);
	$: dispatchColor("--background-color", colorBg);
	$: dispatchCodeTheme("code-theme", codeTheme);
	onMount(() => {
		colorPrime = localStorage.getItem("--prime-color");
		colorBg = localStorage.getItem("--background-color");
		codeTheme = document.body.dataset.theme;
	});
	function dispatchColor(key, value) {
		if (!value) return;
		window.dispatchEvent(
			new CustomEvent("set-css-variable", {
				detail: {
					key,
					value,
				},
			})
		);
	}
	function dispatchCodeTheme(key, value) {
		if (!value) return;
		window.dispatchEvent(
			new CustomEvent("set-data-attribute", {
				detail: {
					key: "theme",
					value,
				},
			})
		);
	}
</script>

<style>
	input[type="color"] {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 40px;
		background: none;
	}
	input[type="color"]::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	input[type="color"]::-webkit-color-swatch {
		border: solid 1px transparent;
		border-radius: 40px;
	}
	.settings {
		width: 100%;
		max-width: 80ch;
		display: grid;
		grid-template-columns: 1fr 3fr;
		grid-template-rows: repeat(3, 1fr);
		align-items: center;
		padding: 1em 0;
	}
	* {
		margin-top: 0;
	}
</style>

<div class="settings">
	<label for="accent">Accent color</label>
	<input id="accent" type="color" bind:value={colorPrime} />

	<label for="bg">Background color</label>
	<input id="bg" type="color" bind:value={colorBg} />

	<label for="theme">Theme</label>
	<select id="theme" bind:value={codeTheme}>
		<option value="custom">Custom</option>
		<option value="night-owl">Night Owl</option>
		<option value="atom-dark">Atom Dark</option>
		<option value="dracula">Dracula</option>
		<option value="nord">Nord</option>
	</select>
</div>
