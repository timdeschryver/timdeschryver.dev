import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { createHash } from 'crypto';
import { marked } from 'marked';
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
import type { BundledLanguage, ThemedToken, ThemeRegistrationRaw } from 'shiki';
import pallete from 'shiki/themes/rose-pine.mjs';
import { variables } from '$lib/variables';
import { codeGroup } from './code-block';
import { customBlock } from './custom-block';
import type { TOC } from './models';
import type { MarkdownMetadata } from './content';
import { extractFrontmatter } from './content';

marked.use({
	extensions: [codeGroup, customBlock],
});
const renderer = new marked.Renderer();
const omitFromTocMarker = '<!-- omit in toc -->';

const highlighter = await shiki.createHighlighter({
	themes: ['rose-pine', 'rose-pine-dawn'],
	langs: [
		'razor',
		'json',
		'typescript',
		'javascript',
		'html',
		'css',
		'xml',
		'shell',
		'yaml',
		'yml',
		'cs',
		'csharp',
		'svelte',
		'powershell',
		'http',
		'diff',
		'sql',
		'angular-html',
		'angular-ts',
		'md',
	],
});

const langToIcon: Partial<Record<string, string>> = {
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
export function parseFileToHtmlAndMeta(file: string): {
	html: string;
	metadata: MarkdownMetadata;
	assetsSrc: string;
} {
	if (!fs.existsSync(file)) {
		throw new Error(`Markdown file not found: ${file}`);
	}
	const markdown = fs.readFileSync(file, 'utf-8');
	const { content, metadata } = extractFrontmatter(markdown);
	metadata.outgoingSlugs = [] as string[];
	metadata.toc = [] as TOC[];
	const assetsSrc = path.dirname(file);
	const fragmentCounts = new Map<string, number>();

	// const tweetRegexp = /https:\/\/twitter\.com\/[A-Za-z0-9-_]*\/status\/[0-9]+/i;

	renderer.link = function (token) {
		const { href, title } = token;
		const text = this.parser.parseInline(token.tokens);

		const link = normalizeLink(href);
		const href_attr = `href="${appendCreatorId(link)}"`;
		const title_attr = title ? `title="${title}"` : '';
		const internal = link.startsWith('/');
		const rel_attr = internal || link.startsWith('#') ? `` : 'rel="external"';
		const svelteTags = internal ? `data-sveltekit-reload` : '';
		const attributes = [href_attr, title_attr, rel_attr, svelteTags];

		let style = '';
		if (internal) {
			const outgoingSlug = url.parse(link, false).pathname?.split('/').pop();
			if (outgoingSlug && metadata.slug !== outgoingSlug && outgoingSlug !== 'blog') {
				metadata.outgoingSlugs.push(outgoingSlug);
			}
		} else {
			try {
				style = `style='--favicon: url(https://v1.indieweb-avatar.11ty.dev/${encodeURIComponent(
					new URL(link).origin,
				)})'`;
				attributes.push('data-with-favicon');
			} catch {
				// noop
			}
		}

		const attributesString = attributes.filter(Boolean).join(' ');
		return `<a class="mark mark-hover" ${attributesString} ${style}>${text}</a>`;
	};

	renderer.image = function (token) {
		const { href, text } = token;
		const src = href.startsWith('http')
			? href
			: `/` +
				path
					.join(assetsSrc, href)
					.split(path.sep)
					.filter((_, index, { length }) => index >= length - 4)
					.join('/')
					.replace(/\.(png|jpg|jpeg)$/, '.webp');

		if (src.endsWith('.mp4')) {
			return `
				<figure>
					<video controls preload="metadata">
						<source src="${src}" type="video/mp4">
					</video>
					<figcaption>${text}</figcaption>
				</figure>`;
		}

		return `
			<figure>
				<img src="${src}" alt="" loading="lazy"/>
				<figcaption>${text}</figcaption>
			</figure>
		`;
	};

	renderer.table = function (token) {
		const table = marked.Renderer.prototype.table.call(this, token);
		return `<div class="table-scroll" role="region" aria-label="Scrollable table" tabindex="0">${table}</div>`;
	};

	renderer.paragraph = function (token) {
		const text = this.parser.parseInline(token.tokens);
		const trimmed = text.replace('👋', `<span class="wave">👋</span>`).trim();

		if (trimmed.startsWith('<figure>')) {
			return trimmed;
		}

		return `<p>${trimmed}</p>`;
	};

	renderer.code = function (token) {
		const source = token.text;
		let lang = token.lang || 'txt';

		let fileName = '';
		let sourceLink = '';
		const linesHighlight: number[] = [];

		// Check for [source=link] syntax
		const sourceMatch = lang.match(/\[source=([^\]]+)\]/);
		if (sourceMatch) {
			sourceLink = sourceMatch[1];
			lang = lang.replace(/\[source=[^\]]+\]/, '').trim();
		}

		// Check for [filename=name], [file=name], or [name=name] syntax
		const filenameMatch = lang.match(/\[(filename|file|name)=([^\]]+)\]/);
		if (filenameMatch) {
			fileName = filenameMatch[2];
			lang = lang.replace(/\[(filename|file|name)=[^\]]+\]/, '').trim();
		}

		// Check for [linenumber=1,2,3] syntax
		const linenumberMatch = lang.match(/\[(linenumber|highlight)=([^\]]+)\]/);
		if (linenumberMatch) {
			const parts = linenumberMatch[2].replace(/^["']|["']$/g, '').split(',');
			parts.forEach((p) => {
				const range = p.trim().split('-').map(Number);
				const min = range[0];
				const max = range[1] || min;
				for (let i = min; i <= max; i++) {
					linesHighlight.push(i);
				}
			});
			lang = lang.replace(/\[(linenumber|highlight)=[^\]]+\]/, '').trim();
		}

		// Backward compatibility: parse legacy syntax
		const lineIndex = lang.indexOf('{');
		const fileIndex = lang.indexOf(':') === -1 ? lang.indexOf(' ') : lang.indexOf(':');

		const language =
			lineIndex !== -1 || fileIndex !== -1
				? lang.substring(0, Math.min(...[lineIndex, fileIndex].filter((i) => i !== -1))).trim()
				: lang;

		// Legacy filename parsing (only if not already set by new syntax)
		if (!fileName && fileIndex !== -1) {
			const afterColon = lang
				.substr(fileIndex + 1)
				.trim()
				.replace(/\s?\{[^}]+\}/g, '');

			// Check if it's an HTML link (legacy format)
			const linkMatch = afterColon.match(/^<a\s+href="([^"]+)">([^<]+)<\/a>$/);
			if (linkMatch) {
				sourceLink = linkMatch[1];
				fileName = linkMatch[2]; // Use link text as filename display
			} else {
				fileName = afterColon;
			}
		}

		// Legacy line number parsing (only if not already set by new syntax)
		if (linesHighlight.length === 0) {
			const lineNumberRegExp = /{([^}]+)}/g;
			let curMatch;
			while ((curMatch = lineNumberRegExp.exec(lang))) {
				const parts = curMatch[1].split(',');
				parts.forEach((p) => {
					const range = p.trim().split('-').map(Number);
					const min = range[0];
					const max = range[1] || min;
					for (let i = min; i <= max; i++) {
						linesHighlight.push(i);
					}
				});
			}
		}

		const id = createHash('md5').update(source).digest('hex');

		const icon = langToIcon[language] || iconCodePurple;
		const headingParts = [
			icon,
			fileName ? `<span class="file-name">${fileName}</span>` : undefined,
			sourceLink
				? `<a href="${sourceLink}" class="icon align-text-top" target="_blank" rel="noopener noreferrer" title="View source"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg></a>`
				: undefined,
			`<button type="button" class="copy-code icon align-text-top" data-ref="${id}" data-status="${id}-copy-status" aria-label="Copy code"><span class="copy-code-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></span></button><span id="${id}-copy-status" class="screen-reader-only" aria-live="polite"></span>`,
		].filter(Boolean);
		const heading = headingParts.length
			? `<div class="code-heading">${headingParts.join(' ')}</div>`
			: '';

		const shikiLang = language.trim();

		function generateHTMLFromTokens(tokens: ThemedToken[][]): string {
			const codeClass = linesHighlight.length ? 'dim' : '';
			let html = `<code class="${shikiLang} ${codeClass}" tabindex="0">`;

			tokens.forEach((token, line) => {
				const lineClass = [
					linesHighlight.includes(line + 1) ? 'highlight' : '',
					token.length ? '' : 'empty',
				];

				let lineContent = '';
				if (token.length) {
					token.forEach((innertoken, index) => {
						const cssVar = replaceColorToCSSVariable(innertoken.color);
						let escaped = innertoken.content
							.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;');

						if (index === 0) {
							if (escaped[0] === '+') {
								lineClass.push('addition');
								escaped = escaped.substring(1).trim();
							} else if (escaped[0] === '-') {
								lineClass.push('removal');
								escaped = escaped.substring(1).trim();
							}
						}

						lineContent += `<span style="color: hsl(${cssVar})">${escaped}</span>`;
					});
				} else {
					lineContent += `<span> </span>`;
				}

				const clazz = lineClass.filter(Boolean).join(' ');
				html += `<div class="line ${clazz}">${lineContent}</div>`;
			});

			html += '</code>';
			return html;

			function replaceColorToCSSVariable(color?: string) {
				if (!color) {
					return `var(--syntax-unknown)`;
				}

				const scopeColors = normalizeScopeColors(pallete);

				const key = scopeColors.find((c) => c.color?.toLowerCase() === color.toLowerCase());
				if (!key) {
					return `var(--syntax-unknown)`;
				}
				return `var(--syntax-${key.scope})`;
			}
		}

		const tokens = highlighter.codeToTokens(source, {
			lang: shikiLang as BundledLanguage,
			theme: pallete,
		});
		const codeblock = generateHTMLFromTokens(tokens.tokens);
		return `<pre id="${id}">${heading}${codeblock}</pre>`;
	};

	renderer.codespan = function (token) {
		return `<code>${escapeHtml(token.text)}</code>`;
	};
	renderer.blockquote = function (token) {
		const source = this.parser.parse(token.tokens);
		return `<blockquote><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg></span>${source}</blockquote>`;
	};

	renderer.heading = function (token) {
		const level = token.depth;
		const omitFromToc = token.text.includes(omitFromTocMarker);
		const rawtext = token.text.replaceAll(omitFromTocMarker, '').trim();
		const text = this.parser.parseInline(token.tokens).replaceAll(omitFromTocMarker, '').trim();
		const headingText = text.includes('{') ? text.substring(0, text.indexOf('{') - 1) : text;
		const anchorRegExp = /{([^}]+)}/g;
		const anchorOverwrite = anchorRegExp.exec(rawtext);
		const fragment = anchorOverwrite
			? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
			: slugify(rawtext);

		if (!fragment || level === 1) {
			return `<h${level}>${headingText}</h${level}>`;
		}
		const uniqueFragment = getUniqueFragment(fragment, fragmentCounts);

		if (!omitFromToc) {
			const description = anchorOverwrite
				? rawtext.replace(anchorOverwrite[0], '').trim()
				: rawtext;
			metadata.toc.push({ description, level, slug: uniqueFragment });
		}

		return `
		<h${level} id="${uniqueFragment}">
		  <a href="#${uniqueFragment}" class="anchor mark-hover" tabindex="-1">${headingText}</a>
		  <span class="icon align-text-top"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
		</h${level}>`;
	};

	const html = marked.parse(
		content.replace(/^\t+/gm, (match) => match.split('\t').join('  ')),
		{ renderer },
	) as string;
	return { html, metadata, assetsSrc };
}

function getUniqueFragment(fragment: string, fragmentCounts: Map<string, number>) {
	const count = fragmentCounts.get(fragment) ?? 0;
	fragmentCounts.set(fragment, count + 1);

	return count ? `${fragment}-${count + 1}` : fragment;
}

function slugify(string: string) {
	const a = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;';
	const b = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------';
	const p = new RegExp(a.split('').join('|'), 'g');
	const entities: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&#39;': '',
	};

	return string
		.toString()
		.replace(/&(?:amp|lt|gt|#39);/g, (entity) => entities[entity])
		.replace(/<code>/g, '`')
		.replace(/<\/code>/g, '`')
		.toLowerCase()
		.replace(/,/g, '') // Remove commas
		.replace(/\./g, '') // Remove dots
		.replace(/'/g, '') // Remove single quote
		.replace(/"/g, '') // Remove double quote
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w-]+/g, '') // Remove all non-word characters
		.replace(/--+/, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
}

function normalizeLink(href: string) {
	if (!href.startsWith('../')) {
		return href.replace(/\/index\.md(?=[?#]|$)/, '');
	}

	const resolved = new URL(href, 'https://internal.invalid/blog/current/');
	return `${resolved.pathname.replace(/\/index\.md$/, '')}${resolved.search}${resolved.hash}`;
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

function normalizeScopeColors(theme: ThemeRegistrationRaw) {
	return (theme.tokenColors ?? theme.settings ?? []).flatMap(({ scope, settings }) => {
		const scopes = Array.isArray(scope) ? scope : scope ? [scope] : [];
		return scopes.map((scope) => ({
			scope: scope.replace(/\./g, '-'),
			color: settings.foreground,
		}));
	});
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}
