import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { createHash } from 'crypto';
import { marked } from 'marked';
import frontmatter from 'front-matter';
import iconBracketsPurple from '../../static/images/languages/brackets-purple.svg?raw';
import iconCodePurple from '../../static/images/languages/code-purple.svg?raw';
import iconShell from '../../static/images/languages/shell.svg?raw';
import iconDatabase from '../../static/images/languages/database.svg?raw';
import iconTypescript from '../../static/images/languages/ts.svg?raw';
import iconText from '../../static/images/languages/text.svg?raw';
import iconYaml from '../../static/images/languages/yaml.svg?raw';
import iconCsharp from '../../static/images/languages/csharp.svg?raw';
import iconSvelte from '../../static/images/languages/svelte.svg?raw';
import iconMarkdown from '../../static/images/languages/markdown.svg?raw';
import * as shiki from 'shiki';
import type { IThemedToken } from 'shiki';
// @ts-ignore
import pallete from 'shiki/themes/rose-pine.json';
// @ts-ignore
import palleteDawn from 'shiki/themes/rose-pine-dawn.json';
import { variables } from '$lib/variables';
import { codeGroup } from './code-block';

fs.writeFileSync('src/routes/dark.theme.css', createStyle('dark', pallete));
fs.writeFileSync('src/routes/light.theme.css', createStyle('light', palleteDawn));

marked.setOptions({
	mangle: false,
	headerIds: false,
});
marked.use({
	extensions: [codeGroup],
});
const renderer = new marked.Renderer();

const highlighter = await shiki.getHighlighter({
	theme: 'rose-pine',
});

const langToIcon = {
	bash: iconShell,
	sh: iconShell,
	html: iconCodePurple,
	sv: iconCodePurple,
	js: iconCodePurple,
	ts: iconTypescript,
	json: iconBracketsPurple,
	css: iconCodePurple,
	txt: iconText,
	graphql: iconCodePurple,
	yml: iconYaml,
	yaml: iconYaml,
	diff: iconText,
	cs: iconCsharp,
	sql: iconDatabase,
	svelte: iconSvelte,
	ps: iconShell,
	xml: iconBracketsPurple,
	md: iconMarkdown,
};
export function parseFileToHtmlAndMeta(file): {
	html: string;
	metadata: unknown & {
		outgoingSlugs: string[];
		title: string;
		slug: string;
		date: string;
		tags: string[];
	};
	assetsSrc: string;
} {
	const markdown = fs.readFileSync(file, 'utf-8');
	const { content, metadata } = extractFrontmatter(markdown);
	metadata.outgoingSlugs = [] as string[];
	const assetsSrc = path.dirname(file);

	// const tweetRegexp = /https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+/i;

	renderer.link = (href, title, text) => {
		// if (text === href && tweetRegexp.test(href)) {
		// 	return `::${href}::`;
		// }

		const link = href.replace('../', '/blog/').replace('/index.md', '');
		const href_attr = `href="${appendCreatorId(link)}"`;
		const title_attr = title ? `title="${title}"` : '';
		const internal = link.startsWith('/');
		const rel_attr = internal || link.startsWith('#') ? `` : 'rel="external"';
		const svelteTags = internal ? `data-sveltekit-reload` : '';
		const attributes = [href_attr, title_attr, rel_attr, svelteTags];

		let style = '';
		if (internal) {
			const outgoingSlug = url.parse(link, false).pathname.split('/').pop();
			if (metadata.slug !== outgoingSlug && outgoingSlug !== 'blog') {
				metadata.outgoingSlugs.push(outgoingSlug);
			}
		} else {
			try {
				style = `style='--favicon: url(https://v1.indieweb-avatar.11ty.dev/${encodeURIComponent(
					new URL(link).origin,
				)})'`;
				attributes.push('data-with-favicon');
			} catch (err) {
				// noop
			}
		}

		const attributesString = attributes.filter(Boolean).join(' ');
		return `<a class="mark mark-hover" ${attributesString} ${style}>${text}</a>`;
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

	renderer.paragraph = (text) => {
		const trimmed = text.replace('👋', `<span class="wave">👋</span>`).trim();
		if (trimmed.startsWith(':::')) {
			const [clazz, ...txt] = trimmed
				.split('\n')
				.map((t) => (t.startsWith(':::') ? t.substring(3) : t))
				.map((t) => t.trim())
				.filter(Boolean);

			return `<div class="custom-block ${clazz}">${txt.map((t) => `<p>${t}</p>`).join('')}</div>`;
		}

		if (trimmed.startsWith('<figure>') || trimmed.startsWith('::')) {
			return trimmed;
		}

		return `<p>${trimmed}</p>`;
	};

	renderer.code = (source, lang) => {
		lang = lang || 'txt';

		const lineIndex = lang.indexOf('{');
		const fileIndex = lang.indexOf(':');

		const language =
			lineIndex !== -1 || fileIndex !== -1
				? lang.substring(0, Math.min(...[lineIndex, fileIndex].filter((i) => i !== -1))).trim()
				: lang;
		const file = fileIndex !== -1 ? lang.substr(lang.indexOf(':') + 1).trim() : '';

		const linesHighlight: number[] = [];
		const lineNumberRegExp = /{([^}]+)}/g;
		let curMatch;
		while ((curMatch = lineNumberRegExp.exec(lang))) {
			const parts = curMatch[1].split(',');
			parts.forEach((p) => {
				let [min, max]: [number, number] = p.split('-').map(Number);
				max = max || min;
				while (min <= max) {
					linesHighlight.push(min++);
				}
			});
		}

		const id = createHash('md5').update(source).digest('hex');

		const icon = langToIcon[language] || iconCodePurple;
		const headingParts = [
			icon,
			file ? `<span class="file-name">${file}</span>` : undefined,
			`<button class="copy-code material-symbols-outlined" data-ref="${id}">content_paste</button>`,
		].filter(Boolean);
		const heading = headingParts.length
			? `<div class="code-heading">${headingParts.join(' ')}</div>`
			: '';

		let shikiLang = language.trim();
		if (shikiLang === 'cs') {
			shikiLang = 'csharp';
		}
		if (shikiLang === 'yml') {
			shikiLang = 'yaml';
		}

		function generateHTMLFromTokens(tokens: IThemedToken[][]): string {
			const codeClass = linesHighlight.length ? 'dim' : '';
			let html = `<code class="${codeClass}">`;

			tokens.forEach((token, line) => {
				const lineClass = [
					linesHighlight.includes(line + 1) ? 'highlight' : '',
					token.length ? '' : 'empty',
				]
					.filter(Boolean)
					.join(' ');
				html += `<div class="${lineClass}">`;

				if (token.length) {
					token.forEach((innertoken) => {
						const cssVar = replaceColorToCSSVariable(innertoken.color);
						const escaped = innertoken.content
							.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;');
						html += `<span style="color: ${cssVar}">${escaped}</span>`;
					});
				} else {
					html += `<span> </span>`;
				}

				html += `</div>`;
			});

			html += '</code>';
			return html;

			function replaceColorToCSSVariable(color: string) {
				const scopeColors = pallete.tokenColors.map((tc) => {
					return {
						scope: (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).map((c) =>
							c.replace(/\./g, '-'),
						),
						color: tc.settings.foreground,
					};
				});

				const key = scopeColors.find((c) => c.color?.toLowerCase() === color?.toLowerCase());
				if (!key) {
					return `var(--syntax-unknown)`;
				}
				return `var(--syntax-${key.scope[0]})`;
			}
		}

		const tokens = highlighter.codeToThemedTokens(source, shikiLang, 'rose-pine', {
			includeExplanation: false,
		});
		const codeblock = generateHTMLFromTokens(tokens);
		return `<pre id="${id}" aria-hidden="true" tabindex="-1">${heading}${codeblock}</pre>`;
	};

	renderer.codespan = (source) => {
		return `<code>${source}</code>`;
	};

	renderer.heading = (text, level, rawtext) => {
		const headingText = text.includes('{') ? text.substring(0, text.indexOf('{') - 1) : text;

		const anchorRegExp = /{([^}]+)}/g;
		const anchorOverwrite = anchorRegExp.exec(rawtext);
		const fragment = anchorOverwrite
			? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
			: slugify(text);

		if (!fragment || level === 1) {
			return `<h${level}>${headingText}</h${level}>`;
		}

		return `
		<h${level} id="${fragment}">
		  <a href="#${fragment}" class="anchor mark-hover" tabindex="-1">${headingText}</a>
		  <span class="material-symbols-outlined">
		  link
		  </span>
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

function extractFrontmatter(markdown): { content: string; metadata: unknown } {
	const result = frontmatter<{ tags: string | string[]; translations?: Record<string, string> }>(
		markdown,
	);
	if (typeof result.attributes.tags === 'string') {
		result.attributes.tags = result.attributes.tags
			.split(',')
			.map((a) => (a ? a.trim().charAt(0).toUpperCase() + a.trim().slice(1) : a))
			.map((a) => {
				if (a.toLowerCase() === 'typescript') {
					return 'TypeScript';
				}
				if (a.toLowerCase() === 'ngrx') {
					return 'NgRx';
				}
				return a;
			});
	} else {
		result.attributes.tags = [];
	}
	if (Array.isArray(result.attributes.translations)) {
		for (const translation of result.attributes.translations) {
			const translationsMap = {
				es: 'Español',
				ru: 'Russian',
			};
			translation.language = translationsMap[translation.language] ?? translation.language;
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
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/<code>/g, '`')
		.replace(/<\/code>/g, '`')
		.toLowerCase()
		.replace(/,/g, '') // Remove commas
		.replace(/\./g, '') // Remove dots
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w-]+/g, '') // Remove all non-word characters
		.replace(/--+/, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

export function sortByDate(a, b) {
	return new Date(a.metadata.date) < new Date(b.metadata.date) ? 1 : -1;
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
		'learn.microsoft.com',
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

function createStyle(scope: string, theme) {
	const scopeColors = theme.tokenColors.map((tc) => {
		return {
			scope: (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).map((c) => c.replace(/\./g, '-')),
			color: tc.settings.foreground,
		};
	});

	let style = `html.${scope} {`;

	for (const color of scopeColors) {
		for (const scope of color.scope) {
			style += '\n\t' + `--syntax-${scope}: ${color.color};`;
		}
	}

	for (const [key, color] of Object.entries(theme.colors)) {
		style += '\n\t' + `--${key.replace(/\./g, '-')}: ${color};`;
	}

	style += '\n' + `}`;

	return style;
}
