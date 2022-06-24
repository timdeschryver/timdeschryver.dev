import { writeFileSync } from 'fs';
import { ImagePool } from '@squoosh/lib';

export async function optimizeImage(img) {
	const imagePool = new ImagePool();

	const image = imagePool.ingestImage(img);
	await image.encode({
		mozjpeg: {},
		webp: {},
	});

	if (!img.endsWith('.webp')) {
		const mozjpeg = await image.encodedWith.mozjpeg;
		await writeFileSync(img, mozjpeg.binary);
	}

	const webp = await image.encodedWith.webp;
	await writeFileSync(img.replace(/\.(png|jpg|jpeg|jpeg)$/, '.webp'), webp.binary);

	await imagePool.close();
}
