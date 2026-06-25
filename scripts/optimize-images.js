import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { optimizeImage } from './optimize-image.js';

for (const filepath of getChangedFiles()) {
	try {
		if (!existsSync(filepath)) {
			continue;
		}

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
	} catch (error) {
		console.error(error);
	}
}

function getChangedFiles() {
	const staged = execSync(`git diff --name-only --staged`)?.toString() ?? '';
	const unstaged = execSync(`git diff --name-only`)?.toString() ?? '';
	const untracked = execSync(`git ls-files --others --exclude-standard`)?.toString() ?? '';

	return [...new Set([staged, unstaged, untracked].join('\n').trim().split('\n').filter(Boolean))];
}
