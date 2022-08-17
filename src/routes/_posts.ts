import fs from 'fs';
import path from 'path';
import url from 'url';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { marked } from 'marked';
import frontmatter from 'front-matter';
import highlightCode from 'gatsby-remark-prismjs/highlight-code.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-textile.js';
import 'prismjs/components/prism-graphql.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-diff.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-powershell.js';
import 'prismjs/components/prism-sql.js';

import { ISODate } from '$lib/formatters';
import { variables } from '$lib/variables';

const blogPath = 'blog';
const snippetsPath = 'snippets';
const langs = {
	bash: 'bash',
	sh: 'bash',
	html: 'markup',
	sv: 'markup',
	js: 'javascript',
	ts: 'typescript',
	json: 'json',
	css: 'css',
	txt: 'textile',
	graphql: 'graphql',
	yml: 'yaml',
	yaml: 'yaml',
	diff: 'diff',
	cs: 'csharp',
	sql: 'sql',
	svelte: 'svelte',
	ps: 'powershell',
	xml: 'html',
	md: 'markdown',
};

const posts:
	| {
			html: string;
			tldr: string;
			metadata: any;
	  }[] = [];

export async function readPosts(): Promise<
	{
		html: string;
		tldr: string;
		metadata: {
			title: string;
			slug: string;
			description: string;
			author: string;
			date: string;
			modified: string;
			tags: string[];
			canonical: string;
			edit: string;
			outgoingLinks: { slug: string; title: string }[];
			incomingLinks: { slug: string; title: string }[];
			translations: { url: string; author: string; profile: string }[];
		};
	}[]
> {
	if (posts.length) {
		return posts;
	}
	console.log('\x1b[35m[posts] generate\x1b[0m');

	const folderContent = [...traverseFolder(blogPath, '.md')];
	const directories = folderContent.reduce((dirs, file) => {
		dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
		return dirs;
	}, {} as { [directory: string]: { file: string; path: string }[] });

	const postsSorted = Object.values(directories)
		.map((files) => {
			const postPath = files.find((f) => f.file === 'index.md').path;
			const tldrPath = files.find((f) => f.file === 'tldr.md')?.path;

			const { html, metadata } = parseFileToHtmlAndMeta(postPath, {
				createAnchorAndFragment: (_level, _metadata, text) => {
					const anchorRegExp = /{([^}]+)}/g;
					const anchorOverwrite = anchorRegExp.exec(text);
					const fragment = anchorOverwrite
						? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
						: slugify(text);

					return { anchor: `#${fragment}`, fragment };
				},
			});
			const { html: tldr } = tldrPath
				? parseFileToHtmlAndMeta(tldrPath, {
						createAnchorAndFragment: (_level, _metadata, text) => {
							const anchorRegExp = /{([^}]+)}/g;
							const anchorOverwrite = anchorRegExp.exec(text);
							const fragment = anchorOverwrite
								? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
								: slugify(text);

							return { anchor: `#${fragment}`, fragment };
						},
				  })
				: { html: null };

			const modified = getLastModifiedDate(postPath);
			const tags = metadata.tags;
			const banner = path
				.normalize(
					path.join(
						import.meta.env.VITE_PUBLIC_BASE_PATH,
						'blog',
						metadata.slug,
						'images',
						'banner.webp',
					),
				)
				.replace(/\\/g, '/')
				.replace('/', '//');

			const canonical = path
				.normalize(path.join(import.meta.env.VITE_PUBLIC_BASE_PATH, 'blog', metadata.slug))
				.replace(/\\/g, '/')
				.replace('/', '//');

			const edit = `https://github.com/timdeschryver/timdeschryver.dev/tree/main/blog/${metadata.slug}/index.md`;
			return {
				html,
				tldr,
				metadata: {
					...metadata,
					date: ISODate(metadata.date),
					modified: ISODate(modified),
					tags,
					banner,
					canonical,
					edit,
					outgoingLinks: [],
					incomingLinks: [],
				},
			};
		})
		.sort(sortByDate);

	for (const post of postsSorted) {
		const incomingLinks = new Set([
			...postsSorted
				.filter((p) => p.metadata.outgoingSlugs.includes(post.metadata.slug))
				.map((p) => ({
					slug: p.metadata.slug,
					title: p.metadata.title,
				})),
		]);

		const outgoingLinks = new Set([
			...postsSorted
				.filter((p) => post.metadata.outgoingSlugs.includes(p.metadata.slug))
				.map((p) => ({
					slug: p.metadata.slug,
					title: p.metadata.title,
				})),
		]);

		post.metadata.incomingLinks.push(...incomingLinks);
		post.metadata.outgoingLinks.push(...outgoingLinks);
	}

	posts.push(...postsSorted);
	return postsSorted;
}

const snippets: {
	html: string;
	metadata: {
		title: string;
		slug: string;
		date: string;
		tags: string[];
		url: string;
	};
}[] = [];

export function readSnippets(): {
	html: string;
	metadata: {
		title: string;
		slug: string;
		date: string;
		tags: string[];
		url: string;
	};
}[] {
	if (snippets.length) {
		return snippets;
	}

	console.log('\x1b[35m[snippets] generate\x1b[0m');

	const folderContent = [...traverseFolder(snippetsPath, '.md')];
	return folderContent
		.map(({ path }) => {
			const { html, metadata } = parseFileToHtmlAndMeta(path, {
				createAnchorAndFragment: (level, metadata) =>
					level == 2
						? {
								anchor: `snippets/${metadata.slug}`,
								fragment: metadata.slug,
						  }
						: {},
				createHeadingParts: (metadata) => {
					return [
						metadata.image ? `<a href="/${metadata.image}" download>Download</a>` : '',
						metadata.image
							? `<a
				target="_blank"
				rel="external"
				href="https://twitter.com/intent/tweet?text=${metadata.title}&via=tim_deschryver&url=${
									import.meta.env.VITE_PUBLIC_BASE_PATH
							  }/snippets/${metadata.slug}">Share</a>`
							: '',
					];
				},
			});
			const image = `/${metadata.image}`;
			const url = `/snippets/${metadata.slug}`;

			return {
				html,
				metadata: {
					...metadata,
					date: ISODate(metadata.date),
					image,
					url,
				},
			};
		})
		.sort(sortByDate);
}

function parseFileToHtmlAndMeta(
	file,
	{
		createAnchorAndFragment = () => {
			// noop
		},
		createHeadingParts = () => [],
	}: any,
): { html: string; metadata: any & { outgoingSlugs: string[] }; assetsSrc: string } {
	const markdown = fs.readFileSync(file, 'utf-8');
	const { content, metadata } = extractFrontmatter(markdown);
	metadata.outgoingSlugs = [] as string[];
	const assetsSrc = path.dirname(file);
	const renderer = new marked.Renderer();
	const tweetRegexp = /https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+/i;
	renderer.link = (href, title, text) => {
		if (text === href && tweetRegexp.test(href)) {
			return `::${href}::`;
		}

		const link = href.replace('../', '/blog/').replace('/index.md', '');
		const href_attr = `href="${appendCreatorId(link)}"`;
		const title_attr = title ? `title="${title}"` : '';
		const internal = link.startsWith('/');
		const rel_attr = internal || link.startsWith('#') ? `` : 'rel="external"';
		const attributes = [href_attr, title_attr, rel_attr].filter(Boolean).join(' ');

		if (internal) {
			const outgoingSlug = url.parse(link, false).pathname.split('/').pop();
			if (metadata.slug !== outgoingSlug && outgoingSlug !== 'blog') {
				metadata.outgoingSlugs.push(outgoingSlug);
			}
		}

		return `<a ${attributes}>${text}</a>`;
	};

	renderer.image = (href, _title, text) => {
		const src = href.startsWith('http')
			? href
			: `/` +
			  path
					.join(assetsSrc, href)
					.split(path.sep)
					.filter((_, index, { length }) => index >= length - 4)
					.join('/')
					.replace(/\.(png|jpg|jpeg)$/, '.webp');

		return `
			<figure>
				<img src="${src}" alt="" loading="lazy"/>
				<figcaption>${text}</figcaption>
			</figure>
		`;
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

		const id = createHash('md5').update(source).digest('hex');

		if (!prismLanguage) {
			console.warn('did not found a language for: ' + language);
			return `<pre id="${id}" class='language-text' aria-hidden="true" tabindex="-1"><code>${source}</code></pre>`;
		}

		const highlightedLines = highlightCode(prismLanguage, source, {}, linesHighlight);

		const highlighted = highlightedLines
			.replace(/gatsby-highlight-code-line/g, 'line-highlight')
			// add space to render the line
			.replace(/<span class="line-highlight"><\/span>/g, '<span class="line-highlight"> </span>');

		const codeBlock = `<code>${highlighted}</code>`;
		const headingParts = [
			file ? `<span class="file">${file}</span>` : undefined,
			...createHeadingParts(metadata),
		].filter(Boolean);
		const heading = headingParts.length
			? `<div class="code-heading">${headingParts.join(' • ')}</div>`
			: '';
		return `<pre id="${id}" class='language-${prismLanguage}' aria-hidden="true" tabindex="-1">${heading}${codeBlock}</pre>`;
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
		{ renderer },
	);

	return { html, metadata, assetsSrc };
}

export function* traverseFolder(
	folder: string,
	extension = '.md',
): Generator<{ folder: string; file: string; path: string }> {
	const folders = fs.readdirSync(folder, { withFileTypes: true }) as fs.Dirent[];
	for (const folderEntry of folders) {
		if (folderEntry.name.includes('node_modules')) {
			// ignore folder
			continue;
		}
		const entryPath = path.resolve(folder, folderEntry.name);
		if (folderEntry.isDirectory()) {
			yield* traverseFolder(entryPath, extension);
		} else if (path.extname(entryPath) === extension) {
			yield { folder, file: folderEntry.name, path: entryPath };
		}
	}
}

function extractFrontmatter(markdown): { content: string; metadata: any } {
	const result = frontmatter<{ tags: string | string[]; translations?: Record<string, string> }>(
		markdown,
	);
	if (typeof result.attributes.tags === 'string') {
		result.attributes.tags = result.attributes.tags
			.split(',')
			.map((a) => (a ? a.trim().charAt(0).toUpperCase() + a.trim().slice(1) : a));
	}
	if (Array.isArray(result.attributes.translations)) {
		for (const translation of result.attributes.translations) {
			translation.language = translation.language === 'es' ? 'Español' : translation.language;
		}
	}
	return { metadata: result.attributes, content: result.body };
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
		.replace(/[^\w-]+/g, '') // Remove all non-word characters
		.replace(/--+/g, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

function sortByDate(a, b) {
	return new Date(a.metadata.date) < new Date(b.metadata.date) ? 1 : -1;
}

function getLastModifiedDate(filePath: string) {
	// disable in dev because this slows down 😪
	if (import.meta.env.DEV) {
		return '';
	}

	const buffer = execSync(`git log -1 --pretty="format:%ci" ${filePath}`);
	if (!buffer) {
		return null;
	}

	return buffer.toString().trim();
}

function appendCreatorId(link: string) {
	const allowedSites = [
		`docs.microsoft.com`,
		`social.technet.microsoft.com`,
		`azure.microsoft.com`,
		`techcommunity.microsoft.com`,
		`social.msdn.microsoft.com`,
		`devblogs.microsoft.com`,
		`developer.microsoft.com`,
		`channel9.msdn.com`,
		`gallery.technet.microsoft.com`,
		`cloudblogs.microsoft.com`,
		`technet.microsoft.com`,
		`msdn.microsoft.com`,
		`blogs.msdn.microsoft.com`,
		`blogs.technet.microsoft.com`,
		`microsoft.com/handsonlabs`,
	];

	try {
		const u = new URL(link);
		if (allowedSites.includes(u.hostname)) {
			u.searchParams.append('WT.mc_id', variables.creator_id);
		}
		return u.toString();
	} catch {
		return link;
	}
}
