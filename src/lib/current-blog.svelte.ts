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
			blog.state = blog.state === 'tldr' ? 'detailed' : 'tldr';
		},
		reset: () => {
			blog = null;
		},
	};
}

export const blog = createBlog();
