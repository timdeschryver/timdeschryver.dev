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
		const serve = exec('npm run preview -- --port=3000');

		serve.stderr.on('data', (data) => {
			console.error(data.toString());
		});

		serve.stdout.on('data', async (data) => {
			console.log('[banner] Preview server started');
			console.log(data.toString());
			if (data.toString().includes('Local:')) {
				console.log('[banner] Starting to generate banners');
				const browser = await chromium.launch({ headless: true });
				const page = await browser.newPage({
					colorScheme: 'dark',
				});

				await page.setViewportSize({
					width: 2048,
					height: 2048 / 2,
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

					await page.$eval('header', (el) => {
						el.style.display = 'none';
					});
					await page.$eval('.published-at', (el) => {
						el.style.display = 'none';
					});
					await page.$eval('.logos', (el) => {
						const logos = el.querySelectorAll('img');
						if (logos.length) {
							el.style.display = 'flex';
							logos.forEach((logo) => {
								logo.height = '128';
							});
						}
					});

					await page.$eval('.details', (el) => {
						el.style['justify-content'] = 'space-around';
						el.style['font-size'] = '5rem';
					});

					await page.$eval('body', (el) => {
						el.style['overflow'] = 'hidden';
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
