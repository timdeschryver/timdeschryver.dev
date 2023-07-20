import { execSync } from 'child_process';
import { optimizeImage } from './optimize-image.js';

for (const filepath of getChangedFiles()) {
	if (!filepath.includes('blog') && !filepath.includes('bits')) {
		continue;
	}

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
	const staged = execSync(`git diff --name-only --staged`)?.toString() ?? '';
	const unstaged = execSync(`git diff --name-only`)?.toString() ?? '';

	return staged.concat(unstaged).trim().split('\n');
}
