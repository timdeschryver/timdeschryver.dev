import { goto } from '$app/navigation';

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

			const queryParams = new URLSearchParams(location.search);
			if (blog.state === 'tldr') {
				queryParams.set('tldr', 'true');
			} else {
				queryParams.delete('tldr');
			}
			const queryParamsString = queryParams.size ? `?${queryParams.toString()}` : '?';
			goto(queryParamsString, {
				noScroll: true,
				replaceState: true,
			});
		},
		reset: () => {
			blog = null;
		},
	};
}

export const blog = createBlog();
