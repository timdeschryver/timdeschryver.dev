import { readBits } from './_bits';

/** @type {import('./$types').PageLoad} */
export async function load() {
	const bits = await readBits();
	const tags = [...new Set(bits.map((bit) => bit.metadata.tags).flat())];
	return {
		bits: bits.map((b) => {
			return {
				...b,
				html: b.html.replace(/<h1.*?>.*?<\/h1>/s, '').replace(/<video.*?>.*?<\/video>/s, ''),
			};
		}),
		tags,
	};
}
