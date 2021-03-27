import { snippets } from '../_posts';

export function get() {
	return {
		body: { snippets },
		headers: {
			'Cache-Control': `max-age=0, s-max-age=${600}` // 10 minutes
		}
	};
}
