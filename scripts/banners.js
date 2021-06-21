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
		execSync('npm run build', { stdio: 'inherit' });
		const serve = exec('npm run preview');

		serve.stderr.on('data', (data) => {
			console.error(data.toString());
		});

		serve.stdout.on('data', async (data) => {
			if (data.toString().includes('http://localhost:3000')) {
				const browser = await chromium.launch({ headless: true });
				const page = await browser.newPage({
					colorScheme: 'dark',
				});
				let first = true;
				for (const { post, bannerPath } of generateBanners) {
					console.log(`[banner] Generating banner for ${post}`);

					await page.setViewportSize({
						width: 940,
						height: post.length > 50 ? 700 : 570,
					});

					await page.goto(`http://localhost:3000/blog/${post}`);
					if (first) {
						// to hide BMC message
						await page.goto(`http://localhost:3000/blog/${post}`);
						first = false;
					}

					await page.$eval('main > header .published-at', (el) => {
						el.style.display = 'none';
					});

					await page.$eval('.details', (el) => {
						el.style['justify-content'] = 'space-around';
						el.style['font-size'] = '1.2rem';
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
				serve.kill();
				process.exit(0);
			}
		});
	}
})();
