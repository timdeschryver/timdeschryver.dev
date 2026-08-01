import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { SvelteURLSearchParams } from 'svelte/reactivity';

interface Blog {
	title: string;
	slug: string;
	state: 'tldr' | 'detailed' | 'single';
}

function createBlog() {
	let blog = $state<Blog | null>(null);

	return {
		get blog() {
			return blog;
		},
		loadBlog: (title: string, slug: string, state: 'tldr' | 'detailed' | 'single') => {
			blog = {
				slug,
				state,
				title,
			};
		},
		toggleTldr: () => {
			const currentBlog = blog;
			if (!currentBlog) return;

			currentBlog.state = currentBlog.state === 'tldr' ? 'detailed' : 'tldr';

			const queryParams = new SvelteURLSearchParams(location.search);
			if (currentBlog.state === 'tldr') {
				queryParams.set('tldr', 'true');
			} else {
				queryParams.delete('tldr');
			}
			const route = queryParams.size
				? (`/blog/[slug]?${queryParams.toString()}` as `/blog/[slug]?${string}`)
				: '/blog/[slug]';
			goto(resolve(route, { slug: currentBlog.slug }), {
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
