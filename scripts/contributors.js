import { execSync } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs';

const content = './blog';
const contributorsCache = new Map();
const visited = [];

(async () => {
	const posts = fs.readdirSync(content);
	for (const slug of posts) {
		const contributors = await getContributors(slug);
		fs.writeFileSync(`${content}/${slug}/contributors.json`, JSON.stringify(contributors));
	}
})();

async function getContributors(slug) {
	const buffer = execSync(`git log --follow --format=%an ${content}/${slug}/index.md`);
	if (!buffer) {
		return [];
	}

	const authors = buffer
		.toString()
		.trim()
		.split('\n')
		.filter((a) => !a.toLowerCase().includes('deschryver'));
	if (authors.length === 0) {
		return [];
	}

	const contributors = new Map();

	const browser = await chromium.launch();
	try {
		const page = await browser.newPage();
		const navigation = await page.goto(
			`https://github.com/timdeschryver/timdeschryver.dev/commits/main/blog/${slug}/index.md`,
			{ waitUntil: 'networkidle' },
		);

		if (!navigation.ok()) {
			return;
		}

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (visited.includes(page.url())) {
				// we ended up in a loop
				console.log('Loop detected');
				break;
			}

			visited.push(page.url());
			const authors = await page.locator('a.commit-author').elementHandles();
			for (const author of authors) {
				try {
					const username = await author.textContent();
					if (username === 'timdeschryver') {
						// ignore
					} else if (contributorsCache.has(username)) {
						console.log('[cache hit]', username);
						contributors.set(username, contributorsCache.get(username));
					} else if (!contributors.has(username)) {
						console.log('[lookup]', username);

						const userPage = await browser.newPage();
						await userPage.goto(`https://github.com/${username}`);

						const name = await userPage.locator('.p-name').innerText();
						contributors.set(username, name);
						contributorsCache.set(username, name);
						await userPage.close();
					}
				} catch (err) {
					console.error(err);
				}
			}

			await page.waitForTimeout(300);
			if (await page.locator('text=End of commit history for this file').isVisible()) {
				break;
			}

			await page.locator('text=/Browse History/i').last().click();
			await page.waitForNavigation({ waitUntil: 'networkidle' });
		}

		await browser.close();
		return [...contributors.entries()];
	} catch (err) {
		console.error(err);
		await browser.close();
		return [];
	}
}
