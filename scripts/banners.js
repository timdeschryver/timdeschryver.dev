import fs from 'fs';
import path from 'path';
import { execSync, exec } from 'child_process';
import { chromium } from 'playwright';

const content = './content/blog';

(async () => {
	const generateBanners = [];
	const posts = fs.readdirSync(content);

	for (const post of posts) {
		const bannerPath = path.join(content, post, 'images', 'banner.jpg');
		const bannerExists = fs.existsSync(bannerPath);

		if (!bannerExists) {
			generateBanners.push({ post, bannerPath });
		}
	}

	if (generateBanners.length) {
		// execSync('npm run build', { stdio: 'inherit' });
		const serve = exec('npm run start');
		serve.stdout.on('data', async (data) => {
			console.log(data.toString());
			if (data.toString().includes('Listening on http://localhost:3000')) {
				const browser = await chromium.launch({ headless: true });
				const page = await browser.newPage({
					colorScheme: 'dark',
					viewport: {
						width: 940,
						height: 470
					}
				});
				let first = true;
				for (const { post, bannerPath } of generateBanners) {
					console.log(`[banner] Generating banner for ${post}`);

					await page.goto(`http://localhost:3000/blog/${post}`);
					if (first) {
						// to hide BMC message
						await page.goto(`http://localhost:3000/blog/${post}`);
						first = false;
					}

					const header = await page.$('main > header');
					await header.$eval('.published-at', (el) => {
						el.style.display = 'none';
					});

					await page.screenshot({
						type: 'jpeg',
						path: bannerPath
					});
				}
				browser.close();
				serve.kill();
				process.exit();
			}
		});
	}
})();
