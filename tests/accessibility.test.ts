import { expect, test } from '@playwright/test';
import { getViolations, injectAxe } from 'axe-playwright';

const pages = [
	{ name: 'homepage', path: '/' },
	{ name: 'blog index', path: '/blog' },
	{ name: 'empty blog search', path: '/blog?q=a-query-that-cannot-match-any-post' },
	{ name: 'bits index', path: '/bits' },
	{
		name: 'blog article',
		path: '/blog/testing-ai-prompts-and-comparing-models-with-promptfoo',
	},
	{ name: 'developer bit', path: '/bits/playwright-v145-makes-you-a-time-wizard' },
];

test('skip link moves keyboard focus to the main content', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab');

	const skipLink = page.getByRole('link', { name: 'Skip to content' });
	await expect(skipLink).toBeFocused();
	await expect(skipLink).toBeVisible();

	await page.keyboard.press('Enter');
	await expect(page.locator('#main-content')).toBeFocused();
});

test('fixed header remains flush with the viewport edge', async ({ page }) => {
	await page.goto('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo');
	await page.evaluate(() => window.scrollTo(0, 500));

	await expect(page.locator('body > div > header')).toHaveCSS('margin-top', '0px');
	const headerTop = await page
		.locator('body > div > header')
		.evaluate((header) => Math.round(header.getBoundingClientRect().top));
	expect(headerTop).toBe(0);
});

for (const theme of ['light', 'dark']) {
	for (const pageUnderTest of pages) {
		test(`${pageUnderTest.name} has no ${theme} theme accessibility violations`, async ({
			page,
		}) => {
			await page.addInitScript(
				(selectedTheme) => localStorage.setItem('theme', selectedTheme),
				theme,
			);
			await page.goto(pageUnderTest.path);
			if (pageUnderTest.name === 'empty blog search') {
				await expect(page.getByText('No posts found', { exact: true })).toBeVisible();
			}
			await injectAxe(page);

			const violations = await getViolations(page, undefined, {
				runOnly: {
					type: 'tag',
					values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
				},
			});
			const details = violations
				.map(
					(violation) =>
						`${violation.id}: ${violation.help}\n${violation.nodes
							.map((node) => `  ${node.target.join(' ')}: ${node.failureSummary}`)
							.join('\n')}`,
				)
				.join('\n\n');

			expect(violations, details).toEqual([]);
		});
	}
}
