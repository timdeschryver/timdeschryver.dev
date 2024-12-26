import { goto } from '$app/navigation';

interface Blog {
	title: string;
	state: 'tldr' | 'detailed' | 'single';
}

function createBlog() {
	let blog = $state<Blog | null>(null);

	const tldrQueryString = () => (blog.state === 'tldr' ? '?tldr=true' : '?');
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
			goto(tldrQueryString(), {
				noScroll: true,
				replaceState: true,
			});
		},
		tldrQueryString,
		reset: () => {
			blog = null;
		},
	};
}

export const blog = createBlog();
