import { browser } from '$app/environment';
import { writable } from 'svelte/store';

let initialValue = '';

if (browser) {
	const themeStored = localStorage.getItem('theme');
	if (themeStored) {
		initialValue = themeStored;
	} else {
		initialValue =
			window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
	}
}

export const theme = writable(initialValue);
theme.subscribe((value) => {
	if (browser) {
		window.localStorage.setItem('theme', value);
	}
});

if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
		theme.set(event.matches ? 'dark' : 'light');
	});
}
