import { variables } from '$lib/variables';
import { error } from '@sveltejs/kit';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { readBits } from '../_bits';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
	const bits = await readBits();
	const bit = bits.find((p) => p.metadata.slug === params.slug);
	if (!bit) {
		error(404, `Bit ${params.slug} not found`);
	}

	const bannerPath = `bits/${bit.metadata.slug}/images/banner.webp`;
	const banner = existsSync(bannerPath)
		? {
				url: `${variables.basePath}/bits/${bit.metadata.slug}/images/banner.webp`,
				...(await sharp(bannerPath).metadata()),
			}
		: null;
	return {
		bit: {
			...bit,
			html: bit.html.replace(/<h1.*?>.*?<\/h1>/s, ''),
			metadata: {
				...bit.metadata,
				author: 'Tim Deschryver',
				canonical: `${variables.basePath}/bits/${bit.metadata.slug}`,
				description: bit.metadata.description,
				banner: banner?.url,
				bannerWidth: banner?.width,
				bannerHeight: banner?.height,
				edit: `https://github.com/timdeschryver/timdeschryver.dev/tree/main/bits/${bit.metadata.slug}/index.md`,
			},
			beehiivId: bit.metadata.tags.some((x) => x.toLowerCase() == 'dotnet')
				? '8429a039-a5f6-4056-92f8-b6a53f7b28a3'
				: bit.metadata.tags.some((x) => x.toLowerCase() == 'angular' || x.toLowerCase() == 'ngrx')
					? '39e02e8e-88c3-460e-92d6-616cc8740c5b'
					: '6e82f6ae-d456-4c88-8cda-8ceb01587e01',
		},
	};
}
