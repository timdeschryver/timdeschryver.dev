import { optimizeImage } from './optimize-image.js';
import { execSync } from 'child_process';

for (const filepath of getChangedFiles()) {
	if (
		!(
			filepath.endsWith('.png') ||
			filepath.endsWith('.jpg') ||
			filepath.endsWith('.jpeg') ||
			filepath.endsWith('.webp')
		)
	) {
		continue;
	}

	console.log('Optimizing image:', filepath);
	await optimizeImage(filepath);
}

function getChangedFiles() {
	const buffer = execSync(`git diff --name-only --staged`);
	if (!buffer) {
		return null;
	}
	return buffer.toString().trim().split('\n');
}
