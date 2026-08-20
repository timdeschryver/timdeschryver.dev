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

						// use a stylesheet with !important rules instead of inline styles,
						// otherwise Svelte hydration can revert the changes before the screenshot is taken
						await page.addStyleTag({
							content: `
								/* only keep the post header (title, logos and profile) in view */
								body > *:not(:has(main)),
								body > div > :not(main),
								main > :not(header) {
									display: none !important;
								}

								/* reclaim the scrollbar gutter and the space of the (hidden) site header */
								html {
									scrollbar-gutter: auto !important;
									overflow: hidden !important;
								}
								body {
									overflow: hidden !important;
									margin: 0 !important;
									padding: 0 !important;
								}
								main {
									margin: 0 !important;
								}

								/* let the post header cover the whole banner */
								main > header {
									position: fixed !important;
									top: 0 !important;
									left: 0 !important;
									margin: 0 !important;
									width: ${banner.width}px !important;
									height: ${banner.height}px !important;
									min-height: ${banner.height}px !important;
									border-bottom: none !important;
								}

								main > header .published-at {
									display: none !important;
								}
								main > header .logos {
									display: flex !important;
								}
								main > header .author-source {
									display: block !important;
								}
								main > header .author {
									text-decoration: none !important;
								}
							`,
						});

						await page.evaluate(() => {
							window.scrollTo({ top: 0 });
						});

						// the post header anchors its content to the bottom, so a long title
						// overflows at the top and gets clipped; shrink it until it fits
						for (let fontSize = 80; fontSize >= 40; fontSize -= 5) {
							const titleTop = await page.evaluate(
								() => document.querySelector('main > header h1').getBoundingClientRect().top,
							);
							if (titleTop >= 40) {
								break;
							}
							await page.addStyleTag({
								content: `main > header h1 { font-size: ${fontSize}px !important; }`,
							});
						}

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
