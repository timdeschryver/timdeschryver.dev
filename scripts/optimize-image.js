import { existsSync } from 'fs';
import { rename, unlink } from 'fs/promises';
import sharp from 'sharp';

const supportedImageExtensions = /\.(png|jpe?g|webp)$/i;

export async function optimizeImage(img) {
	if (!existsSync(img)) {
		return;
	}

	if (!supportedImageExtensions.test(img)) {
		return;
	}

	const extension = img.split('.').at(-1).toLowerCase();
	const optimizedImage = sharp(img);

	if (extension === 'jpg' || extension === 'jpeg') {
		await writeOptimizedImage(img, optimizedImage.jpeg({ quality: 100, mozjpeg: true }), extension);
	} else if (extension === 'png') {
		await writeOptimizedImage(img, optimizedImage.png({ compressionLevel: 9 }), extension);
	} else if (extension === 'webp') {
		await writeOptimizedImage(img, optimizedImage.webp({ quality: 100 }), extension);
	}

	if (extension !== 'webp') {
		await sharp(img).webp({ quality: 100 }).toFile(img.replace(supportedImageExtensions, '.webp'));
	}
}

async function writeOptimizedImage(img, transformer, extension) {
	const temporaryFile = `${img}.${process.pid}.${Date.now()}.tmp.${extension}`;

	try {
		await transformer.toFile(temporaryFile);
		await rename(temporaryFile, img);
	} catch (error) {
		await unlink(temporaryFile).catch(() => {});
		throw error;
	}
}
