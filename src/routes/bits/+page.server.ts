import { readBits } from './_bits';

/** @type {import('./$types').PageLoad} */
export async function load() {
	const bits = await readBits();
	const tags = [...new Set(bits.map((bit) => bit.metadata.tags).flat())];
	return { bits, tags };
}
