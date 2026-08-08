import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const markdown = vi.hoisted(() => ({
	parseFileToHtmlAndMeta: vi.fn(),
}));

vi.mock('$app/environment', () => ({ dev: true }));
vi.mock('$lib/markdown', () => markdown);

interface TestPost {
	title: string;
	slug: string;
	date: string;
	modified?: string;
	html?: string;
	outgoingSlugs?: string[];
	series?: { name: string };
}

describe.sequential('blog post cache', () => {
	const originalWorkingDirectory = process.cwd();
	let workingDirectory: string;

	beforeEach(() => {
		vi.resetModules();
		workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-post-cache-'));
		process.chdir(workingDirectory);
		fs.mkdirSync('blog');
		markdown.parseFileToHtmlAndMeta.mockReset().mockImplementation((file: string) => {
			const source = JSON.parse(fs.readFileSync(file, 'utf-8')) as TestPost;
			return {
				html: source.html ?? `<p>${source.title}</p>`,
				metadata: {
					title: source.title,
					slug: source.slug,
					description: `${source.title} description`,
					date: source.date,
					modified: source.modified,
					tags: [],
					toc: [],
					outgoingSlugs: source.outgoingSlugs ?? [],
					translations: [],
					series: source.series,
				},
				assetsSrc: path.dirname(file),
			};
		});
		vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	afterEach(() => {
		process.chdir(originalWorkingDirectory);
		fs.rmSync(workingDirectory, { recursive: true, force: true });
		vi.restoreAllMocks();
	});

	it('returns identical relationships for single and collection reads in either cache order', async () => {
		writePost({
			title: 'First',
			slug: 'first',
			date: '2024-01-01',
			outgoingSlugs: ['second'],
			series: { name: 'Example series' },
		});
		writePost({
			title: 'Second',
			slug: 'second',
			date: '2024-01-02',
			series: { name: 'Example series' },
		});

		const { clearPostsCache, readPostBySlug, readPosts } = await import('./_posts');
		const singleFirst = await readPostBySlug('first');
		const collectionAfter = await readPosts();
		expect(singleFirst?.metadata).toEqual(
			collectionAfter.find((post) => post.metadata.slug === 'first')?.metadata,
		);
		expect(singleFirst?.metadata.outgoingLinks).toEqual([{ slug: 'second', title: 'Second' }]);
		expect(singleFirst?.metadata.seriesPosts).toEqual([
			{ slug: 'first', title: 'First', date: '2024-01-01', order: 1, current: true },
			{ slug: 'second', title: 'Second', date: '2024-01-02', order: 2, current: false },
		]);

		clearPostsCache();
		const collectionFirst = await readPosts();
		const singleAfter = await readPostBySlug('first');
		expect(singleAfter?.metadata).toEqual(
			collectionFirst.find((post) => post.metadata.slug === 'first')?.metadata,
		);
	});

	it('rebuilds relationships when another post changes while reusing unaffected parses', async () => {
		writePost({
			title: 'First',
			slug: 'first',
			date: '2024-01-01',
			outgoingSlugs: ['second'],
		});
		writePost({ title: 'Second', slug: 'second', date: '2024-01-02' });

		const { readPostBySlug } = await import('./_posts');
		await readPostBySlug('first');
		markdown.parseFileToHtmlAndMeta.mockClear();

		writePost({
			title: 'Second updated',
			slug: 'second',
			date: '2024-01-02',
			outgoingSlugs: ['first'],
		});
		const first = await readPostBySlug('first');

		expect(first?.metadata.outgoingLinks).toEqual([{ slug: 'second', title: 'Second updated' }]);
		expect(first?.metadata.incomingLinks).toEqual([{ slug: 'second', title: 'Second updated' }]);
		expect(markdown.parseFileToHtmlAndMeta).toHaveBeenCalledTimes(1);
		expect(markdown.parseFileToHtmlAndMeta.mock.calls[0][0]).toContain('second/index.md');
	});

	it('invalidates a post when its optional TLDR is added, edited, or removed', async () => {
		writePost({ title: 'First', slug: 'first', date: '2024-01-01' });

		const { readPostBySlug } = await import('./_posts');
		expect((await readPostBySlug('first'))?.tldr).toBe('');

		writeTldr('first', 'TLDR one');
		expect((await readPostBySlug('first'))?.tldr).toBe('TLDR one');

		writeTldr('first', 'TLDR two, updated');
		expect((await readPostBySlug('first'))?.tldr).toBe('TLDR two, updated');

		fs.rmSync(path.join('blog', 'first', 'tldr.md'));
		expect((await readPostBySlug('first'))?.tldr).toBe('');
	});

	it('invalidates parsed output when the processor fingerprint changes', async () => {
		writePost({ title: 'First', slug: 'first', date: '2024-01-01' });

		const { readPostBySlug } = await import('./_posts');
		await readPostBySlug('first');
		const cachePath = path.join('.blog-cache', 'first', 'cache.json');
		const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
		cache.processorHash = 'stale';
		fs.writeFileSync(cachePath, JSON.stringify(cache));
		markdown.parseFileToHtmlAndMeta.mockClear();

		await readPostBySlug('first');

		expect(markdown.parseFileToHtmlAndMeta).toHaveBeenCalledTimes(1);
	});

	it('only exposes explicit editorial modification dates', async () => {
		writePost({
			title: 'Updated',
			slug: 'updated',
			date: '2024-01-01',
			modified: '2024-02-01',
		});
		writePost({ title: 'Unchanged', slug: 'unchanged', date: '2024-01-01' });

		const { readPostBySlug } = await import('./_posts');

		expect((await readPostBySlug('updated'))?.metadata.modified).toBe('2024-02-01');
		expect((await readPostBySlug('unchanged'))?.metadata.modified).toBeNull();
	});
});

function writePost(post: TestPost): void {
	const directory = path.join('blog', post.slug);
	fs.mkdirSync(directory, { recursive: true });
	fs.writeFileSync(path.join(directory, 'index.md'), JSON.stringify(post));
}

function writeTldr(slug: string, html: string): void {
	fs.writeFileSync(
		path.join('blog', slug, 'tldr.md'),
		JSON.stringify({ title: 'TLDR', slug, date: '2024-01-01', html }),
	);
}
