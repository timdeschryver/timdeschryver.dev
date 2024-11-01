interface Blog {
	title: string;
	state: 'tldr' | 'detailed' | 'single';
}

function createBlog() {
	let blog = $state<Blog | null>(null);

	return {
		get blog() {
			return blog;
		},
		loadBlog: (title: string, state: 'tldr' | 'detailed' | 'single') => {
			blog = {
				state,
				title,
			};
		},
		toggleTldr: () => {
			const params = new URLSearchParams(window.location.search);
			blog.state = blog.state === 'tldr' ? 'detailed' : 'tldr';
			if (blog.state === 'tldr') {
				params.set('tldr', '1');
			} else if (blog.state === 'detailed') {
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
		},
		reset: () => {
			blog = null;
		},
	};
}

export const blog = createBlog();
