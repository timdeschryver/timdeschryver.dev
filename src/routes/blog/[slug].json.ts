import { posts } from '../_posts';

export function get(req) {
	const post = posts.find((p) => p.metadata.slug === req.params.slug);
	
	if (!post) {
		return {
			status: 404,
		};
	}
	
	return {
		body: { post },
		headers: {
			'Cache-Control': `max-age=300`
		}
	};
}
