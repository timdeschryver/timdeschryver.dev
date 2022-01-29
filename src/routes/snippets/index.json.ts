import { snippets } from '../_posts';

export function get() {
	return {
		body: { snippets },
		headers: {
			'Cache-Control': `max-age=300`
		}
	};
}
