import { test, expect } from '@playwright/test';

test('flow test', async ({ page }) => {
	await page.goto('');
	await page.getByRole('link', { name: 'BLOG', exact: true }).click();

	await expect(page).toHaveURL(`/blog`);

	await page.getByRole('button', { name: 'Angular', exact: true }).click();
	await expect(page).toHaveURL(`/blog?q=Angular`);

	await page.getByRole('button', { name: 'Testing', exact: true }).click();
	await expect(page).toHaveURL(`/blog?q=Angular+Testing`);

	await page
		.getByRole('searchbox', { name: 'Search articles' })
		.fill('Angular Testing ngrx project');
	await page.getByRole('link', { name: /Testing an NgRx project/i }).click();

	await expect(page.getByRole('heading', { name: 'Actions' })).toBeDefined();
});

test('overlapping blog navigations do not leak view transition errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});

	await page.goto('/');
	await page.getByRole('link', { name: 'BLOG', exact: true }).click();
	await expect(page).toHaveURL('/blog');
	await page.locator('main article > a').first().click();
	await expect(page).toHaveURL(/\/blog\/.+/);
	await page.waitForTimeout(500);

	expect(errors.filter((error) => /view.?transition/i.test(error))).toEqual([]);
});

test('blog title participates in the view transition when navigating back', async ({ page }) => {
	await page.addInitScript(() => {
		const originalStartViewTransition = document.startViewTransition.bind(document);
		const transitions: { pseudoElements: string[] }[] = [];
		(
			window as unknown as {
				__viewTransitions: typeof transitions;
			}
		).__viewTransitions = transitions;

		document.startViewTransition = (update) => {
			const entry = { pseudoElements: [] as string[] };
			transitions.push(entry);
			const transition = originalStartViewTransition(update);
			void transition.ready.then(() => {
				entry.pseudoElements = document
					.getAnimations()
					.map((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement || '')
					.filter(Boolean);
			});
			return transition;
		};
	});

	await page.goto('/');
	await page.getByRole('link', { name: 'BLOG', exact: true }).click();
	await expect(page).toHaveURL('/blog');
	await page.waitForTimeout(400);
	const articleLink = page.locator('main article > a').first();
	const transitionName = await articleLink
		.getByRole('heading')
		.evaluate((heading) => getComputedStyle(heading).viewTransitionName);
	await articleLink.click();
	await expect(page).toHaveURL(/\/blog\/.+/);
	await page.waitForTimeout(400);

	await page.goBack();
	await expect(page).toHaveURL('/blog');
	await page.waitForTimeout(400);

	const transitions = await page.evaluate(
		() =>
			(
				window as unknown as {
					__viewTransitions: { pseudoElements: string[] }[];
				}
			).__viewTransitions,
	);
	const backTransition = transitions.at(-1);
	expect(backTransition?.pseudoElements.some((name) => name.includes(transitionName))).toBeTruthy();
});

test('browser back restores the blog overview scroll position', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'BLOG', exact: true }).click();
	await expect(page).toHaveURL('/blog');

	const articleLink = page.locator('main article > a').nth(40);
	await articleLink.scrollIntoViewIfNeeded();
	await page.waitForTimeout(100);
	const slug = await articleLink.evaluate((link) => link.closest('li')?.dataset.postSlug || '');
	const overviewTop = await articleLink.evaluate(
		(link) => link.closest('li')?.getBoundingClientRect().top,
	);
	await articleLink.click();
	await expect(page).toHaveURL(/\/blog\/.+/);
	await page.waitForTimeout(400);

	await page.goBack();
	await expect(page).toHaveURL('/blog');
	await page.waitForTimeout(500);
	const restoredTop = await page
		.locator(`[data-post-slug="${slug}"]`)
		.evaluate((article) => article.getBoundingClientRect().top);

	expect(Math.abs(restoredTop - (overviewTop || 0))).toBeLessThan(20);
});

test('blog header links the current article and aligns its controls', async ({ page }) => {
	await page.goto('/blog/your-first-mcp-server-with-aspnet');

	const currentArticle = page.locator('.current-blog-link');
	await expect(currentArticle).toBeVisible();
	await expect(currentArticle).toContainText('Your first MCP server with ASP.NET');
	await expect(currentArticle).toHaveAttribute('href', '/blog/your-first-mcp-server-with-aspnet');
	await expect(page.getByRole('button', { name: 'Switch to TLDR version' })).toBeVisible();

	const alignment = await page.locator('.blog-context').evaluate((context) => {
		const header = context.closest('header')?.getBoundingClientRect();
		const bounds = context.getBoundingClientRect();
		return header
			? Math.abs(bounds.top + bounds.height / 2 - (header.top + header.height / 2))
			: 100;
	});
	expect(alignment).toBeLessThan(2);
});

test('blog detail includes the author photo on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/blog/your-first-mcp-server-with-aspnet');

	const authorPhoto = page.locator('.author-img');
	await expect(authorPhoto).toBeVisible();
	await expect(authorPhoto).toHaveCSS('width', '36px');

	const rightEdgeOffset = await page.locator('.author').evaluate((author) => {
		const authorBounds = author.getBoundingClientRect();
		const detailsBounds = author.parentElement!.getBoundingClientRect();
		return detailsBounds.right - authorBounds.right;
	});
	expect(Math.abs(rightEdgeOffset)).toBeLessThan(1);

	const metadataCenterOffset = await page.locator('.details').evaluate((details) => {
		const dateBounds = details.querySelector('.published-at')!.getBoundingClientRect();
		const authorBounds = details.querySelector('.author')!.getBoundingClientRect();
		return dateBounds.top + dateBounds.height / 2 - (authorBounds.top + authorBounds.height / 2);
	});
	expect(Math.abs(metadataCenterOffset)).toBeLessThan(1);

	const titleCenterOffset = await page.locator('main > header h1').evaluate((title) => {
		const titleBounds = title.getBoundingClientRect();
		const headerBounds = title.parentElement!.getBoundingClientRect();
		return titleBounds.top + titleBounds.height / 2 - (headerBounds.top + headerBounds.height / 2);
	});
	expect(Math.abs(titleCenterOffset)).toBeLessThan(1);
});

test('blog tags wrap on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/blog');

	const tags = page.locator('.filters button');
	const firstTagTop = await tags.first().evaluate((tag) => tag.getBoundingClientRect().top);
	const lastTagTop = await tags.last().evaluate((tag) => tag.getBoundingClientRect().top);

	expect(lastTagTop).toBeGreaterThan(firstTagTop);
});

test('empty blog searches provide a clear recovery action', async ({ page }) => {
	await page.goto('/blog?q=a-query-that-cannot-match-any-post');
	const search = page.getByRole('searchbox', { name: 'Search articles' });

	await expect(page.getByText('No posts found', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Nothing matched this search.' })).toBeVisible();
	await page.getByRole('button', { name: 'Clear all filters' }).click();

	await expect(search).toHaveValue('');
	await expect(search).toBeFocused();
	await expect(page.locator('main article').first()).toBeVisible();
});

test('blog overview actions align below the publication date', async ({ page }) => {
	await page.goto('/blog');
	const firstPost = page.locator('main article').first();
	const date = firstPost.locator('time');
	const readMore = firstPost.getByRole('link', { name: 'Read more' });

	const [dateBox, readMoreBox] = await Promise.all([date.boundingBox(), readMore.boundingBox()]);
	expect(dateBox).not.toBeNull();
	expect(readMoreBox).not.toBeNull();
	expect(readMoreBox!.y).toBeGreaterThan(dateBox!.y + dateBox!.height);
	expect(Math.abs(readMoreBox!.x - dateBox!.x)).toBeLessThan(2);
});

test('blog article side navigation has a wider reading rail', async ({ page }) => {
	await page.goto('/blog/testing-ai-prompts-and-comparing-models-with-promptfoo');
	await page.evaluate(() => window.scrollTo(0, 1500));
	const sideNav = page.locator('aside.left-nav');

	await expect(sideNav).toBeVisible();
	const width = await sideNav.evaluate((element) => element.getBoundingClientRect().width);
	expect(width).toBeGreaterThanOrEqual(319);
});
