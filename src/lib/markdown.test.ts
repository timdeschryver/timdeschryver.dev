import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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
});
