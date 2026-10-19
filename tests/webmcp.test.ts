import { test, expect, type Page } from '@playwright/test';

type Tool = { name: string; execute: (input?: object) => Promise<unknown> };

declare global {
	interface Window {
		webMcpTools: Map<string, Tool>;
	}
}

test.beforeEach(async ({ page }) => {
	// a stand-in for the browser's WebMCP implementation (document.modelContext)
	await page.addInitScript(() => {
		const tools = new Map<string, Tool>();
		window.webMcpTools = tools;
		Object.defineProperty(document, 'modelContext', {
			value: {
				async registerTool(tool: Tool, { signal }: { signal?: AbortSignal } = {}) {
					if (tools.has(tool.name)) throw new Error(`Duplicate tool ${tool.name}`);
					tools.set(tool.name, tool);
					signal?.addEventListener('abort', () => tools.delete(tool.name));
				},
			},
		});
	});
});

test('registers the WebMCP tools on page load', async ({ page }) => {
	await page.goto('/');
	await expect
		.poll(() => page.evaluate(() => [...window.webMcpTools.keys()]))
		.toEqual(['search_content', 'get_content', 'navigate']);
});

test('searches and reads the content', async ({ page }) => {
	await page.goto('/');
	await waitForTools(page);

	const search = (await execute(page, 'search_content', {
		query: 'promptfoo',
		type: 'blog',
	})) as { total: number; results: { type: string; slug: string; markdownUrl: string }[] };
	expect(search.total).toBeGreaterThan(0);
	expect(search.results[0]).toMatchObject({
		type: 'blog',
		slug: 'testing-ai-prompts-and-comparing-models-with-promptfoo',
	});
	expect(search.results[0].markdownUrl).toMatch(/\.md$/);

	const bits = (await execute(page, 'search_content', { type: 'bit', limit: 3 })) as {
		total: number;
		results: { type: string }[];
	};
	expect(bits.total).toBeGreaterThan(3);
	expect(bits.results).toHaveLength(3);
	expect(bits.results.every((result) => result.type === 'bit')).toBeTruthy();

	const post = (await execute(page, 'get_content', {
		type: 'blog',
		slug: search.results[0].slug,
	})) as { markdown: string };
	expect(post.markdown).toContain('title: ');

	await expect(
		execute(page, 'get_content', { type: 'bit', slug: 'does-not-exist' }),
	).rejects.toThrow('There is no bit with the slug "does-not-exist"');
});

test('reads the open bit', async ({ page }) => {
	await page.goto('/bits/http-files');
	await waitForTools(page);

	const bit = (await execute(page, 'get_content')) as { type: string; slug: string };
	expect(bit).toMatchObject({ type: 'bit', slug: 'http-files' });
});

test('navigates to pages', async ({ page }) => {
	await page.goto('/');
	await waitForTools(page);

	await execute(page, 'navigate', { page: 'blog', query: 'angular' });
	await expect(page).toHaveURL(/\/blog\?q=angular$/);
	await expect(page.getByLabel('Search articles')).toHaveValue('angular');

	// filtering the overview while it's open
	await execute(page, 'navigate', { page: 'blog', query: 'testing' });
	await expect(page.getByLabel('Search articles')).toHaveValue('testing');

	const result = (await execute(page, 'navigate', { page: 'bit', slug: 'http-files' })) as {
		url: string;
	};
	await expect(page).toHaveURL(/\/bits\/http-files$/);
	expect(result.url).toMatch(/\/bits\/http-files$/);
});

async function waitForTools(page: Page) {
	await expect.poll(() => page.evaluate(() => window.webMcpTools.size)).toBe(3);
}

function execute(page: Page, name: string, input?: object) {
	return page.evaluate(
		([name, input]) => window.webMcpTools.get(name as string)!.execute(input as object),
		[name, input] as const,
	);
}
