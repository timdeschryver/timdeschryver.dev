import { readBits } from '../bits/_bits';
import { readPostSummaries } from '../blog/_posts';

export const prerender = true;

// The index of all blog posts and bits, used by the WebMCP tools (src/lib/webmcp.ts) to search the content
export async function GET() {
	const [posts, bits] = await Promise.all([readPostSummaries(), readBits()]);
	const index = {
		posts: posts.map(({ metadata }) => summary(metadata)),
		bits: bits.map(({ metadata }) => summary(metadata)),
	};

	return new Response(JSON.stringify(index), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

function summary({
	title,
	slug,
	description,
	date,
	tags,
}: {
	title: string;
	slug: string;
	description: string;
	date: string;
	tags: string[];
}) {
	return { title, slug, description, date, tags };
}
