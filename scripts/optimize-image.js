import { writeFile, readFile } from 'fs/promises';
import { ImagePool } from '@squoosh/lib';
import { cpus } from 'os';

export async function optimizeImage(img) {
	const imagePool = new ImagePool(cpus().length);

	const file = await readFile(img);
	const image = imagePool.ingestImage(file);
	await image.encode({
		mozjpeg: {},
		webp: {},
	});

	if (!img.endsWith('.webp')) {
		const mozjpeg = await image.encodedWith.mozjpeg;
		await writeFile(img, mozjpeg.binary);
	}

	const webp = await image.encodedWith.webp;
	await writeFile(img.replace(/\.(png|jpg|jpeg|jpeg)$/, '.webp'), webp.binary);

	await imagePool.close();
}
