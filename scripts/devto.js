import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import dotEnv from 'dotenv-extended';

const [slug] = process.argv.slice(2);
dotEnv.load({
	path: '.env.local',
});

(async () => {
	try {
		const url = `https://timdeschryver.dev/blog/${slug}`;
		const file = readFileSync(join('./content/blog', slug, 'index.md'), 'utf-8')
			.replace(/\.\/images\//g, `${url}/images/`)
			.replace(/\(\/blog\//g, `(https://timdeschryver.dev/blog/`);
		const { metadata, content } = extractFrontmatter(file);

		const hasTLDR = existsSync(join('./content/blog', slug, 'tldr.md'));
		const tldr = hasTLDR ? `[Read the TLDR version on timdeschryver.dev](${url}?tldr=true)` : '';

		const devToContent = content
			.split('\n')
			.map((line) => {
				if (line.startsWith('```')) {
					const a = line.includes(':') ? line.indexOf(':') : line.length;
					const b = line.includes('{') ? line.indexOf('{') : line.length;
					return line.substring(0, Math.min(a, b));
				}
				return line;
			})
			.join('\n')
			.replace(/<!-- omit in toc -->/g, '');

		const devToMeta = {
			title: metadata.title,
			description: metadata.description,
			tags: metadata.tags
				.split(',')
				.filter((_, i) => i < 4)
				.map((t) => t.trim().replace(' ', '').toLowerCase())
				.map((t) => {
					switch (t.toLowerCase()) {
						case '.net':
							return 'dotnet';

						default:
							return t;
					}
				}),
			cover_image: metadata.banner,
			canonical_url: url,
			published: true,
		};

		const devToMarkdown = `---
${Object.entries(devToMeta)
	.map(([key, value]) => `${key}: ${value}`)
	.join('\n')}
---

Follow me on Twitter at [@tim_deschryver](https://timdeschryver.dev/twitter) | Subscribe to the [Newsletter](https://timdeschryver.dev/newsletter) | Originally published on [timdeschryver.dev](${url}).

-------

${tldr}

${devToContent}

-------

Follow me on Twitter at [@tim_deschryver](https://timdeschryver.dev/twitter) | Subscribe to the [Newsletter](https://timdeschryver.dev/newsletter) | Originally published on [timdeschryver.dev](${url}).
`;

		const article = {
			article: {
				title: devToMeta.title,
				body_markdown: devToMarkdown,
				description: devToMeta.description,
				published: true,
				tags: devToMeta.tags,
				main_image: devToMeta.cover_image,
				canonical_url: url,
			},
		};

		const result = await postArticle(article);
		console.log(result);
	} catch (err) {
		console.log(err);
	}
})();

function extractFrontmatter(markdown) {
	const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
	const frontMatter = match[1];
	const content = markdown.slice(match[0].length);

	const metadata = frontMatter.split('\n').reduce((data, pair) => {
		const colonIndex = pair.indexOf(':');
		data[pair.slice(0, colonIndex).trim()] = pair.slice(colonIndex + 1).trim();
		return data;
	}, {});

	return { metadata, content };
}

async function postArticle(article) {
	return await fetch('https://dev.to/api/articles', {
		method: 'post',
		body: JSON.stringify(article),
		headers: {
			'Content-Type': 'application/json',
			'api-key': process.env.DEVTO_TOKEN,
		},
	}).then((res) => res.json());
}
