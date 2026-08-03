import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

let initialValue: Theme = 'light';
let followsSystemTheme = true;

if (browser) {
	const themeStored = localStorage.getItem('theme');
	if (themeStored === 'light' || themeStored === 'dark') {
		initialValue = themeStored;
		followsSystemTheme = false;
	} else {
		initialValue =
			window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
	}
}

export const theme = writable(initialValue);

export function setTheme(value: Theme) {
	followsSystemTheme = false;
	if (browser) window.localStorage.setItem('theme', value);
	theme.set(value);
}

if (browser) {
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
		if (followsSystemTheme) theme.set(event.matches ? 'dark' : 'light');
	});
}
