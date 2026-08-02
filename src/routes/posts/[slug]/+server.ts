import { redirect } from '@sveltejs/kit';
import { readPostSummaries } from '../../blog/_posts';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () =>
	(await readPostSummaries()).map(({ metadata }) => ({ slug: metadata.slug }));

export const GET: RequestHandler = ({ params }) => {
	redirect(301, `/blog/${encodeURIComponent(params.slug)}`);
};
