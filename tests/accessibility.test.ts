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

test('code controls are keyboard accessible', async ({ browserName, context, page }) => {
	if (browserName === 'chromium') {
		await context.grantPermissions(['clipboard-write']);
	}
	await page.goto('/bits/switch-exhaustiveness');

	const themeToggle = page.getByRole('button', { name: 'Switch to dark theme' });
	await expect
		.poll(() =>
			themeToggle.evaluate((button) =>
				Object.getOwnPropertySymbols(button).some((symbol) => symbol.description === 'events'),
			),
		)
		.toBe(true);

	const code = page.locator('pre code').first();
	await expect(code).toBeVisible();
	await code.focus();
	await expect(code).toBeFocused();

	const copyButton = page.locator('.copy-code').first();
	await expect(copyButton).toHaveAccessibleName('Copy code');
	await copyButton.focus();
	await page.keyboard.press('Enter');
	await expect(copyButton).toHaveAttribute('aria-label', 'Code copied');

	const tabs = page.getByRole('tab');
	await tabs.first().focus();
	await page.keyboard.press('ArrowRight');
	await expect(tabs.nth(1)).toBeFocused();
	await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
});

for (const theme of ['light', 'dark']) {
	test(`reading mode controls have sufficient ${theme} theme contrast`, async ({ page }) => {
		await page.addInitScript(
			(selectedTheme) => localStorage.setItem('theme', selectedTheme),
			theme,
		);
		await page.goto('/blog/your-first-mcp-server-with-aspnet');
		await injectAxe(page);

		const detailedViolations = await getViolations(
			page,
			{ include: [['.tldr']] },
			{ runOnly: { type: 'rule', values: ['color-contrast'] } },
		);

		await page.getByRole('button', { name: 'Code only' }).click();
		const codeOnlyViolations = await getViolations(
			page,
			{ include: [['.tldr']] },
			{ runOnly: { type: 'rule', values: ['color-contrast'] } },
		);

		expect([...detailedViolations, ...codeOnlyViolations]).toEqual([]);
	});

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
				await expect(page.getByText('No articles found', { exact: true })).toBeVisible();
			}
			await injectAxe(page);

			const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
			const violations = [
				...(await getViolations(page, undefined, {
					runOnly: { type: 'tag', values: wcagTags },
					rules: { 'color-contrast': { enabled: false } },
				})),
				...(await getViolations(
					page,
					{ exclude: [['pre code']] },
					{
						runOnly: { type: 'rule', values: ['color-contrast'] },
					},
				)),
			];
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
