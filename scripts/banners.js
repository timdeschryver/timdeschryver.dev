import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { chromium } from 'playwright';

const content = './blog';
const regenerateAll = process.argv.includes('--all');
const banner = { width: 1200, height: 627 };

(async () => {
	const generateBanners = [];
	const posts = fs.readdirSync(content);
	for (const post of posts) {
		const bannerPath = path.join(content, post, 'images', 'banner.webp');
		const bannerExists = fs.existsSync(bannerPath);
		if (regenerateAll || !bannerExists) {
			generateBanners.push({ post, bannerPath });
		}
	}

	if (generateBanners.length) {
		const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'timdeschryver-banners-'));
		const serve = exec('npm run dev');
		let generating = false;

		serve.stdout.on('data', async (data) => {
			console.log('[banner] ', data.toString());
			if (data.toString().includes('Local') && !generating) {
				generating = true;
				console.log('[banner] Starting to generate banners');
				let browser;

				try {
					browser = await chromium.launch({ headless: true });
					const page = await browser.newPage({
						colorScheme: 'dark',
					});

					await page.setViewportSize(banner);

					await page.goto(`http://localhost:5173/blog/`);

					let first = true;
					for (const { post } of generateBanners) {
						console.log(`[banner] Generating banner for ${post}`);

						await page.goto(`http://localhost:5173/blog/${post}`);
						if (first) {
							// to hide BMC message
							await page.goto(`http://localhost:5173/blog/${post}`);
							first = false;
						}

						await page.waitForSelector('main > header');
						await page.evaluate(() => document.fonts.ready);

						await page.evaluate(({ width, height }) => {
							const main = document.querySelector('main');
							const postHeader = main.querySelector(':scope > header');

							// only keep the post header (title, logos and profile) in view
							for (const element of document.querySelectorAll('body > div > *')) {
								if (element !== main) {
									element.style.display = 'none';
								}
							}
							for (const element of main.children) {
								if (element !== postHeader) {
									element.style.display = 'none';
								}
							}

							// reclaim the scrollbar gutter and the space of the (hidden) site header
							document.documentElement.style.scrollbarGutter = 'auto';
							document.documentElement.style.overflow = 'hidden';
							document.body.style.overflow = 'hidden';
							document.body.style.margin = '0';
							document.body.style.padding = '0';
							main.style.margin = '0';

							// let the post header cover the whole banner
							postHeader.style.position = 'fixed';
							postHeader.style.top = '0';
							postHeader.style.left = '0';
							postHeader.style.margin = '0';
							postHeader.style.width = `${width}px`;
							postHeader.style.height = `${height}px`;
							postHeader.style.minHeight = `${height}px`;
							postHeader.style.borderBottom = 'none';

							postHeader.querySelector('.published-at').style.display = 'none';
							postHeader.querySelector('.logos').style.display = 'flex';
							postHeader.querySelector('.author-source').style.display = 'block';
							postHeader.querySelector('.author').style.textDecoration = 'none';

							window.scrollTo({ top: 0 });
						}, banner);

						await page.screenshot({
							type: 'webp',
							quality: 100,
							path: path.join(temporaryDirectory, `${post}.webp`),
						});
					}

					for (const { post, bannerPath } of generateBanners) {
						fs.copyFileSync(path.join(temporaryDirectory, `${post}.webp`), bannerPath);
					}
				} catch (error) {
					console.error('[banner] Failed to generate banners', error);
					process.exitCode = 1;
				} finally {
					await browser?.close();
					serve.kill('SIGINT');
					fs.rmSync(temporaryDirectory, { recursive: true, force: true });
				}
			}
		});
	}
})();
