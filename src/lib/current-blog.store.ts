import { writable } from 'svelte/store';

interface Blog {
	title: string;
	state: 'tldr' | 'detailed' | 'single';
}

function createBlog() {
	const { subscribe, set, update } = writable<Blog | null>(null);

	return {
		subscribe,
		loadBlog: (title: string, state: 'tldr' | 'detailed' | 'single') =>
			set({
				state,
				title,
			}),
		toggleTldr: () =>
			update((b) => {
				const params = new URLSearchParams(window.location.search);
				const newState = b.state === 'tldr' ? 'detailed' : 'tldr';
				if (newState === 'tldr') {
					params.set('tldr', '1');
				} else if (newState === 'detailed') {
					params.delete('tldr');
				}

				const paramsAsString = params.toString();
				if (paramsAsString) {
					window.history.replaceState(
						window.history.state,
						'',
						`${location.pathname}?${paramsAsString}`,
					);
				} else {
					window.history.replaceState(window.history.state, '', `${location.pathname}`);
				}

				return {
					...b,
					state: newState,
				};
			}),
		reset: () => set(null),
	};
}

export const blog = createBlog();
