import type { PageServerLoad } from './$types';
import { readSnippets } from '../_posts';

export async function load(): Promise<PageServerLoad> {
	const snippets = await readSnippets();
	return { snippets };
}
