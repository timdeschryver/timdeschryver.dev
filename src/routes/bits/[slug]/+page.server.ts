import { variables } from '$lib/variables';
import { readBits } from '../_bits';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const bits = await readBits();
	const bit = bits.find((p) => p.metadata.slug === params.slug);
	return {
		bit: {
			...bit,
			html: bit.html.replace(/<h1.*?>.*?<\/h1>/s, ''),
			metadata: {
				...bit.metadata,
				author: 'Tim Deschryver',
				canonical: `${variables.basePath}/bits/${bit.metadata.slug}`,
				description: bit.metadata.title,
				banner: `${variables.basePath}/bits/${bit.metadata.slug}/images/banner.webp`,
				edit: `https://github.com/timdeschryver/timdeschryver.dev/tree/main/bits/${bit.metadata.slug}/index.md`,
			},
		},
	};
}
