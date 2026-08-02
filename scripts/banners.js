import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { chromium } from 'playwright';

const content = './blog';
const regenerateAll = process.argv.includes('--all');

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

					await page.setViewportSize({
						width: 1200,
						height: 627,
					});

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

						await page.waitForSelector('header');
						await page.evaluate(() => document.fonts.ready);
						await page.$eval('header', (el) => {
							el.style.display = 'none';
						});

						await page.$eval('main', (el) => {
							el.style.marginTop = '.4em';
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
							el.style.overflow = 'hidden';
						});

						await page.$eval('.author', (el) => {
							el.style.textDecoration = 'none';
						});

						await page.evaluate(() => {
							window.scrollTo({ top: document.querySelector('header').clientHeight });
						});

						await page.screenshot({
							type: 'webp',
							quality: 82,
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
