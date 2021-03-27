import { readdirSync, lstatSync, readFileSync } from 'fs';
import { join, extname, dirname, sep, normalize } from 'path';
import { execSync } from 'child_process';
import marked from 'marked/lib/marked.js';
import highlightCode from 'gatsby-remark-prismjs/highlight-code.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-textile.js';
import 'prismjs/components/prism-graphql.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-diff.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-sql.js';

import { ISODate } from '$lib/formatters';

const blogPath = 'content/blog';
const snippetsPath = 'content/snippets';
const langs = {
	bash: 'bash',
	html: 'markup',
	sv: 'markup',
	js: 'javascript',
	ts: 'typescript',
	json: 'json',
	css: 'css',
	txt: 'textile',
	graphql: 'graphql',
	yml: 'yaml',
	diff: 'diff',
	cs: 'csharp',
	sql: 'sql'
};

export const posts = readPosts();
export const snippets = readSnippets();

export function readPosts(): {
	html: string;
	metadata: {
		title: string;
		slug: string;
		description: string;
		author: string;
		date: string;
		modified: string;
		tags: string[];
		banner: string;
		bannerCredit: string;
		published: boolean;
		folder: string;
		canonical: string;
		edit: string;
	};
}[] {
	console.log('[generate] posts');

	const files = getFiles(blogPath, '.md');
	return files
		.map((file) => {
			const folder = dirname(file).split(sep).pop();
			const { html, metadata, assetsSrc } = parseFileToHtmlAndMeta(file, {
				createAnchorAndFragment: (_level, metadata, text) => {
					const anchorRegExp = /{([^}]+)}/g;
					const anchorOverwrite = anchorRegExp.exec(text);
					const fragment = anchorOverwrite
						? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
						: slugify(text);

					return { anchor: `#${fragment}`, fragment };
				}
			});

			const modified = getLastModifiedDate(file);
			const published = metadata.published === 'true';
			const tags = metadata.tags
				.split(',')
				.map((p) => (p ? p.trim().charAt(0).toUpperCase() + p.trim().slice(1) : p));
			const banner = normalize(
				join(import.meta.env.VITE_PUBLIC_BASE_PATH, assetsSrc, metadata.banner)
			)
				.replace(/\\/g, '/')
				.replace('/', '//');

			const canonical = normalize(
				join(import.meta.env.VITE_PUBLIC_BASE_PATH, 'blog', metadata.slug)
			)
				.replace(/\\/g, '/')
				.replace('/', '//');

			const edit = `https://github.com/timdeschryver/timdeschryver.dev/tree/main/content/blog/${metadata.slug}/index.md`;
			return {
				html,
				metadata: {
					...metadata,
					date: ISODate(metadata.date),
					modified: ISODate(modified),
					folder,
					published,
					tags,
					banner,
					canonical,
					edit
				}
			};
		})
		.sort(sortByDate);
}

export function readSnippets(): {
	html: string;
	metadata: {
		title: string;
		slug: string;
		author: string;
		date: string;
		tags: string[];
		url: string;
	};
}[] {
	console.log('[generate] snippets');
	const files = getFiles(snippetsPath, '.md');
	return files
		.map((file) => {
			const { html, metadata } = parseFileToHtmlAndMeta(file, {
				createAnchorAndFragment: (level, metadata) =>
					level == 2
						? {
								anchor: `snippets/${metadata.slug}`,
								fragment: metadata.slug
						  }
						: {},
				createHeadingParts: (metadata) => {
					return [
						metadata.image ? `<a href="${metadata.image}" download>Download</a>` : '',
						metadata.image
							? `<a
				target="_blank"
				rel="noopener noreferrer"
				href="https://twitter.com/intent/tweet?text=${metadata.title}&via=tim_deschryver&url=${
									import.meta.env.VITE_PUBLIC_BASE_PATH
							  }/snippets/${metadata.slug}">Share</a>`
							: ''
					];
				}
			});
			const tags = metadata.tags.split(',').map((p) => (p ? p.trim() : p));
			const image = `${import.meta.env.VITE_PUBLIC_BASE_PATH}/${metadata.image}`;
			const url = `/snippets/${metadata.slug}`;

			return {
				html,
				metadata: {
					...metadata,
					date: ISODate(metadata.date),
					tags,
					image,
					url
				}
			};
		})
		.sort(sortByDate);
}

function parseFileToHtmlAndMeta(
	file,
	{ createAnchorAndFragment = () => {}, createHeadingParts = () => [] }: any
): any {
	const markdown = readFileSync(file, 'utf-8');
	const { content, metadata } = extractFrontmatter(markdown);
	const assetsSrc = dirname(file.replace('content', ''));
	const renderer = new marked.Renderer();
	// const tweetRegexp = /https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+/i;

	renderer.link = (href, title, text) => {
		// TODO: twitter links
		// if (tweetRegexp.test(href)) {
		//   const fetchResult = require("sync-fetch")(
		//     `https://publish.twitter.com/oembed?url=${href}&align=center`
		//   ).json();
		//   return `<div>${fetchResult.html}</div>`;
		// }

		const href_attr = `href="${href}"`;
		const title_attr = title ? `title="${title}"` : '';
		const prefetch_attr = href.startsWith('/') ? `prefetch="true"` : '';
		const rel_attr =
			href.startsWith('/') || href.startsWith('#') ? `` : 'rel="nofollow noreferrer"';
		const attributes = [href_attr, title_attr, prefetch_attr, rel_attr].filter(Boolean).join(' ');

		return `<a ${attributes}>${text}</a>`;
	};

	renderer.image = function (href, _title, text) {
		const src = href.startsWith('http') ? href : join(assetsSrc, href);
		return `<figure>
	  <img src="${src}" alt="" loading="lazy"/>
	  <figcaption>${text}</figcaption>
	</figure>`;
	};

	renderer.code = (source, lang) => {
		lang = lang || 'txt';

		const lineIndex = lang.indexOf('{');
		const fileIndex = lang.indexOf(':');

		const language =
			lineIndex !== -1 || fileIndex !== -1
				? lang.substring(0, Math.min(...[lineIndex, fileIndex].filter((i) => i !== -1))).trim()
				: lang;
		const prismLanguage = langs[language];
		const file = fileIndex !== -1 ? lang.substr(lang.indexOf(':') + 1).trim() : '';

		const lineNumberRegExp = /{([^}]+)}/g;
		const linesHighlight = [];
		let curMatch;
		while ((curMatch = lineNumberRegExp.exec(lang))) {
			const parts = curMatch[1].split(',');
			parts.forEach((p) => {
				let [min, max] = p.split('-').map(Number);
				max = max || min;
				while (min <= max) {
					linesHighlight.push(min++);
				}
			});
		}

		if (!prismLanguage) {
			console.warn('did not found a language for: ' + language);
			return `<pre class='language-text' aria-hidden="true" tabindex="-1"><code>${source}</code></pre>`;
		}

		const highlightedLines = highlightCode(prismLanguage, source, {}, linesHighlight);

		const highlighted = highlightedLines
			.replace(/gatsby-highlight-code-line/g, 'line-highlight')
			// add space to render the line
			.replace(/<span class="line-highlight"><\/span>/g, '<span class="line-highlight"> </span>');

		const codeBlock = `<code tabindex="0">${highlighted}</code>`;
		const headingParts = [
			file ? `<span class="file">${file}</span>` : undefined,
			...createHeadingParts(metadata)
		].filter(Boolean);
		const heading = headingParts.length
			? `<div class="code-heading">${headingParts.join(' • ')}</div>`
			: '';
		return `<pre class='language-${prismLanguage}' aria-hidden="true" tabindex="-1">${heading}${codeBlock}</pre>`;
	};

	renderer.codespan = (source) => {
		return `<code class="language-text">${source}</code>`;
	};

	renderer.heading = (text, level, rawtext) => {
		const headingText = text.includes('{') ? text.substring(0, text.indexOf('{') - 1) : text;

		const { fragment } = createAnchorAndFragment(level, metadata, rawtext);
		if (!fragment) {
			return `<h${level}>${headingText}</h${level}>`;
		}

		return `
		<h${level} id="${fragment}">
		  <a href="#${fragment}" class="anchor" tabindex="-1">${headingText}</a>
		</h${level}>`;
	};

	const html = marked(
		content.replace(/^\t+/gm, (match) => match.split('\t').join('  ')),
		{ renderer }
	);

	return { html, metadata, assetsSrc };
}

function getFiles(dir, extension, files = []) {
	const dirFiles = readdirSync(dir);

	dirFiles.forEach((path) => {
		const file = join(dir, path);
		const isDirectory = lstatSync(file).isDirectory();

		if (isDirectory) {
			return getFiles(file, extension, files);
		}

		if (extname(file) === extension) {
			files.push(file);
		}
	});

	return files;
}

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

function slugify(string) {
	const a = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;';
	const b = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------';
	const p = new RegExp(a.split('').join('|'), 'g');

	return string
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w\-]+/g, '') // Remove all non-word characters
		.replace(/\-\-+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

function sortByDate(a, b) {
	return new Date(a.metadata.date) < new Date(b.metadata.date) ? 1 : -1;
}

function getLastModifiedDate(filePath) {
	const buffer = execSync(`git log -1 --pretty="format:%ci" ${filePath}`);

	if (!buffer) {
		return null;
	}

	return buffer.toString().trim();
}
