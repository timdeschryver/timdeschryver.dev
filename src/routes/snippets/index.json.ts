import { snippets } from '../_posts';

export function GET() {
	return {
		body: { snippets },
		headers: {
			'Cache-Control': `max-age=300`,
		},
	};
}
