import { error } from '@sveltejs/kit';
import * as fs from 'node:fs';
import { readBits } from '../_bits';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = async () => {
	const bits = await readBits();
	return bits.map((bit) => ({ slug: bit.metadata.slug }));
};

export const GET: RequestHandler = ({ params }) => {
	const filePath = `bits/${params.slug}/index.md`;
	if (!/^[\w-]+$/.test(params.slug) || !fs.existsSync(filePath)) {
		error(404, `Bit ${params.slug} Not found`);
	}

	return new Response(fs.readFileSync(filePath, 'utf-8'), {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
		},
	});
};
