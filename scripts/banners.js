import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { chromium } from 'playwright';

const content = './blog';

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
		const serve = exec('npm run dev');

		serve.stdout.on('data', async (data) => {
			console.log('[banner] ', data.toString());
			if (data.toString().includes('Local')) {
				console.log('[banner] Starting to generate banners');
				const browser = await chromium.launch({ headless: true });
				const page = await browser.newPage({
					colorScheme: 'dark',
				});

				await page.setViewportSize({
					width: 1200,
					height: 627,
				});

				let first = true;
				for (const { post, bannerPath } of generateBanners) {
					console.log(`[banner] Generating banner for ${post}`);

					await page.goto(`http://localhost:5173/blog/${post}`);
					if (first) {
						// to hide BMC message
						await page.goto(`http://localhost:5173/blog/${post}`);
						first = false;
					}

					await page.$eval('header', (el) => {
						el.style.display = 'none';
					});
					await page.$eval('.published-at', (el) => {
						el.style.display = 'none';
					});
					await page.$eval('.logos', (el) => {
						el.style.display = 'flex';
					});
					await page.$eval('.author-source', (el) => {
						el.style.display = 'block';
					});
					await page.$eval('body', (el) => {
						el.style['overflow'] = 'hidden';
					});

					await page.$eval('.author', (el) => {
						el.style['text-decoration'] = 'none';
					});

					await page.evaluate(() => {
						window.scrollTo({ top: document.querySelector('header').clientHeight });
					});

					await page.screenshot({
						quality: 100,
						type: 'jpeg',
						path: bannerPath,
					});
				}
				await browser.close();
				serve.kill('SIGINT');
				process.exit(0);
			}
		});
	}
})();
