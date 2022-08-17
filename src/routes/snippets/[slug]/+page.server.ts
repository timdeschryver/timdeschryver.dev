import type { PageServerLoad } from './$types';
import { readSnippets } from '../../_posts';

export async function load({ params }): Promise<PageServerLoad> {
	const snippets = await readSnippets();
	const snippet = snippets.find((s) => s.metadata.slug === params.slug);

	return { snippet };
}
