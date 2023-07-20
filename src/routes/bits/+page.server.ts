import { readBits } from './_bits';

/** @type {import('./$types').PageLoad} */
export async function load() {
	const bits = await readBits();
	return { bits };
}
