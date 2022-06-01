import { writeFileSync } from 'fs';
import { ImagePool } from '@squoosh/lib';

const imagePool = new ImagePool();
const [img] = process.argv.slice(2);

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
await writeFileSync(img.replace(/\.(png|jpg|jpeg)$/, '.webp'), webp.binary);

await imagePool.close();
