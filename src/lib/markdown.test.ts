import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';
import { parseFileToHtmlAndMeta } from './markdown';

describe('Markdown rendering', () => {
	let directory: string | undefined;

	afterEach(() => {
		if (directory) fs.rmSync(directory, { recursive: true, force: true });
	});

	it('escapes inline HTML and exposes accessible code controls', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'`<img src=x onerror="alert(1)">`',
				'',
				':::code-group',
				'```ts [title=TypeScript]',
				'const answer = 42;',
				'```',
				'```js [title=JavaScript]',
				'const answer = 42;',
				'```',
				':::',
			].join('\n'),
		);

		const { html } = parseFileToHtmlAndMeta(file);

		expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
		expect(html).not.toContain('<code><img');
		expect(html).not.toContain('aria-hidden="true" tabindex="-1"');
		expect(html).toContain('<code class="ts " tabindex="0">');
		expect(html).toContain('aria-label="Copy code"');
		expect(html).toContain('aria-live="polite"');
		expect(html).toContain('role="tablist"');
		expect(html).toContain('role="tab" aria-selected="true"');
		expect(html).toContain('role="tabpanel"');
	});

	it('treats a leading + or - as a diff marker only in diff blocks', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'```diff',
				'- const answer = 41;',
				'+ const answer = 42;',
				'```',
				'',
				'```yaml',
				'- task: UseDotNet@2',
				'```',
				'',
				'```md',
				'- [ ] Tests are added',
				'```',
				'',
				'```sql',
				'-- a comment',
				'```',
			].join('\n'),
		);

		const { html } = parseFileToHtmlAndMeta(file);
		const text = html.replace(/<[^>]+>/g, '');

		expect(html).toContain('<div class="line removal">');
		expect(html).toContain('<div class="line addition">');
		expect(html.match(/class="line (removal|addition)"/g)).toHaveLength(2);
		expect(text).toContain('const answer = 41;');
		expect(text).toContain('const answer = 42;');
		expect(text).not.toContain('- const answer');
		expect(text).not.toContain('+ const answer');
		expect(text).toContain('- task: UseDotNet@2');
		expect(text).toContain('- [ ] Tests are added');
		expect(text).toContain('-- a comment');
	});

	it('omits marked headings from the table of contents', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'## Included heading',
				'',
				'## Explicit heading {#explicit-heading}',
				'',
				'### Excluded heading <!-- omit in toc -->',
			].join('\n'),
		);

		const { html, metadata } = parseFileToHtmlAndMeta(file);

		expect(metadata.toc).toEqual([
			{ description: 'Included heading', level: 2, slug: 'included-heading' },
			{ description: 'Explicit heading', level: 2, slug: 'explicit-heading' },
		]);
		expect(html).toContain('<h3 id="excluded-heading">');
		expect(html).toContain('>Excluded heading</a>');
		expect(html).not.toContain('<!-- omit in toc -->');
	});

	it('normalizes empty descriptions', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description:',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'Content',
			].join('\n'),
		);

		const { metadata } = parseFileToHtmlAndMeta(file);

		expect(metadata.description).toBe('');
	});

	it('renders videos with controls and their description', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'![Running dotnet test in .NET 9](./images/video.mp4)',
			].join('\n'),
		);

		const { html } = parseFileToHtmlAndMeta(file);

		expect(html).toContain('<video controls preload="metadata">');
		expect(html).toContain('<figcaption>Running dotnet test in .NET 9</figcaption>');
		expect(html).not.toContain('autoplay');
	});

	it('renders a WebM recording as a video with its caption', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'![Adding a todo](./images/recording.webm)',
			].join('\n'),
		);

		const { html } = parseFileToHtmlAndMeta(file);

		expect(html).toContain('<video controls preload="metadata">');
		expect(html).toContain('type="video/webm"');
		expect(html).toContain('<figcaption>Adding a todo</figcaption>');
	});

	it('renders images with their dimensions to prevent layout shifts', async () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.mkdirSync(path.join(directory, 'images'));
		await sharp({ create: { width: 40, height: 20, channels: 3, background: '#000' } })
			.webp()
			.toFile(path.join(directory, 'images', 'screenshot.webp'));
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'![A screenshot](./images/screenshot.png)',
				'',
				'![A missing image](./images/missing.png)',
			].join('\n'),
		);

		const { html } = parseFileToHtmlAndMeta(file);

		expect(html).toMatch(
			/<img src="\/[^"]*\/images\/screenshot\.webp" alt="" width="40" height="20" loading="lazy" decoding="async"\/>/,
		);
		expect(html).toMatch(
			/<img src="\/[^"]*\/images\/missing\.webp" alt="" loading="lazy" decoding="async"\/>/,
		);
	});

	it('replaces GIFs with their animated WebP version only when it is smaller', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		const images = path.join(directory, 'images');
		fs.mkdirSync(images);
		const writeImage = (name: string, size: number) =>
			fs.writeFileSync(path.join(images, name), Buffer.alloc(size));
		writeImage('smaller.gif', 100);
		writeImage('smaller.webp', 50);
		writeImage('larger.gif', 100);
		writeImage('larger.webp', 150);
		writeImage('still.gif', 100);
		writeImage('still.png', 100);
		writeImage('still.webp', 50);
		writeImage('only.gif', 100);
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'![Smaller](./images/smaller.gif)',
				'',
				'![Larger](./images/larger.gif)',
				'',
				'![Still image with the same name](./images/still.gif)',
				'',
				'![Only a GIF](./images/only.gif)',
			].join('\n'),
		);

		const { html } = parseFileToHtmlAndMeta(file);

		expect(html).toMatch(/src="\/[^"]*\/images\/smaller\.webp"/);
		expect(html).toMatch(/src="\/[^"]*\/images\/larger\.gif"/);
		expect(html).toMatch(/src="\/[^"]*\/images\/still\.gif"/);
		expect(html).toMatch(/src="\/[^"]*\/images\/only\.gif"/);
	});

	it('normalizes relative links at every directory depth', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'[Blog post](../another-post/index.md)',
				'',
				'[Bit](../../bits/a-useful-bit/index.md#example)',
				'',
				'[Absolute post](https://timdeschryver.dev/blog/absolute-post?source=test#example)',
			].join('\n'),
		);

		const { html, metadata } = parseFileToHtmlAndMeta(file);

		expect(html).toContain('href="/blog/another-post"');
		expect(html).toContain('href="/bits/a-useful-bit#example"');
		expect(html).toContain('href="/blog/absolute-post?source=test#example"');
		expect(metadata.outgoingSlugs).toEqual(['another-post', 'a-useful-bit', 'absolute-post']);
	});

	it('decodes heading entities only once when creating slugs', () => {
		directory = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-renderer-'));
		const file = path.join(directory, 'index.md');
		fs.writeFileSync(
			file,
			[
				'---',
				'title: Test',
				'slug: test',
				'description: Test',
				'date: 2024-01-01',
				'tags: testing',
				'---',
				'',
				'## &amp;lt;script&amp;gt;',
			].join('\n'),
		);

		const { html, metadata } = parseFileToHtmlAndMeta(file);

		expect(metadata.toc[0]?.slug).toBe('and-lt-script-and-gt');
		expect(html).toContain('id="and-lt-script-and-gt"');
	});
});
