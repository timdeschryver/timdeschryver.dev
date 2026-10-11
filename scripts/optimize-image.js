import { existsSync, statSync } from 'fs';
import { rename, unlink } from 'fs/promises';
import sharp from 'sharp';

const supportedImageExtensions = /\.(png|jpe?g|gif|webp)$/i;
const stillImageExtensions = ['png', 'jpg', 'jpeg'];
// Visually the same as 100 for screenshots, at a fraction of the size
const webpQuality = 82;
// Keep every frame of animated images, which easily exceed sharp's default pixel limit
const inputOptions = { animated: true, limitInputPixels: false };

export async function optimizeImage(img) {
	if (!existsSync(img)) {
		return;
	}

	if (!supportedImageExtensions.test(img)) {
		return;
	}

	const extension = img.split('.').at(-1).toLowerCase();
	const webpImage = img.replace(supportedImageExtensions, '.webp');

	// A WebP version is generated from its source image, re-encoding it would only lower its quality
	if (extension === 'webp' && hasSourceImage(img, [...stillImageExtensions, 'gif'])) {
		return;
	}

	if (extension === 'gif') {
		await convertGif(img, webpImage);
		return;
	}

	const isBanner = /[/\\]images[/\\]banner\.(png|jpe?g|webp)$/i.test(img);
	const optimizedImage = isBanner
		? sharp(img, inputOptions).resize({ width: 1200, withoutEnlargement: true })
		: sharp(img, inputOptions);

	if (extension === 'jpg' || extension === 'jpeg') {
		await writeOptimizedImage(img, optimizedImage.jpeg({ quality: 100, mozjpeg: true }), extension);
	} else if (extension === 'png') {
		await writeOptimizedImage(img, optimizedImage.png({ compressionLevel: 9 }), extension);
	} else if (extension === 'webp') {
		await writeOptimizedImage(img, optimizedImage.webp({ quality: webpQuality }), extension);
	}

	if (extension !== 'webp') {
		console.log(`Converting ${img} to WebP format`);
		await sharp(img).webp({ quality: webpQuality }).toFile(webpImage);
	}
}

/**
 * The GIF itself is kept, because the Markdown version of a post links to it.
 * The blog uses the animated WebP version when it's smaller (see getPublishedImage in src/lib/markdown.ts).
 */
async function convertGif(img, webpImage) {
	if (hasSourceImage(img, stillImageExtensions)) {
		console.log(`Skipping ${img}, ${webpImage} belongs to a still image with the same name`);
		return;
	}

	console.log(`Converting ${img} to an animated WebP`);
	await sharp(img, inputOptions).webp({ quality: webpQuality }).toFile(webpImage);

	if (statSync(webpImage).size >= statSync(img).size) {
		console.log(`Keeping ${img}, the animated WebP isn't smaller`);
		await unlink(webpImage);
	}
}

function hasSourceImage(img, extensions) {
	return extensions.some((extension) =>
		existsSync(img.replace(supportedImageExtensions, `.${extension}`)),
	);
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
