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
import type { BundledLanguage, ThemedToken } from 'shiki';
import pallete from 'shiki/themes/rose-pine.mjs';
import palleteDawn from 'shiki/themes/rose-pine-dawn.mjs';
import { variables } from '$lib/variables';
import { codeGroup } from './code-block';
import { customBlock } from './custom-block';
import type { TOC, BlogSeries } from './models';
import { extractFrontmatter } from './content';

fs.writeFileSync('src/routes/dark.theme.css', createStyle('dark', pallete));
fs.writeFileSync('src/routes/light.theme.css', createStyle('light', palleteDawn));

marked.use({
	extensions: [codeGroup, customBlock],
});
const renderer = new marked.Renderer();

const highlighter = await shiki.getHighlighter({
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
	metadata: {
		outgoingSlugs: string[];
		title: string;
		slug: string;
		date: string;
		description: string;
		tags: string[];
		toc: TOC[];
		translations?: { url: string; author: string; profile: string; language: string }[];
		series?: BlogSeries;
	};
	assetsSrc: string;
} {
	if (!fs.existsSync(file)) {
		return null;
	}
	const markdown = fs.readFileSync(file, 'utf-8');
	const { content, metadata } = extractFrontmatter(markdown);
	metadata.outgoingSlugs = [] as string[];
	metadata.toc = [] as TOC[];
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
			} catch {
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

		if (src.endsWith('.mp4')) {
			return `
				<video loading="lazy" autoplay>
					<source src="${src}" type="video/mp4">
				</video>`;
		}

		return `
			<figure>
				<img src="${src}" alt="" loading="lazy"/>
				<figcaption>${text}</figcaption>
			</figure>
		`;
	};

	renderer.paragraph = (text) => {
		const trimmed = text.replace('👋', `<span class="wave">👋</span>`).trim();

		if (trimmed.startsWith('<figure>')) {
			return trimmed;
		}

		return `<p>${trimmed}</p>`;
	};

	renderer.code = (source, lang) => {
		lang = lang || 'txt';

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
			`<button class="copy-code icon align-text-top" data-ref="${id}" tabindex="-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg></button>`,
		].filter(Boolean);
		const heading = headingParts.length
			? `<div class="code-heading">${headingParts.join(' ')}</div>`
			: '';

		const shikiLang = language.trim();

		function generateHTMLFromTokens(tokens: ThemedToken[][]): string {
			const codeClass = linesHighlight.length ? 'dim' : '';
			let html = `<code class="${shikiLang} ${codeClass}">`;

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

			function replaceColorToCSSVariable(color: string) {
				const scopeColors = pallete.tokenColors
					.filter((p) => p.scope)
					.map((tc) => {
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

		const tokens = highlighter.codeToTokens(source, {
			lang: shikiLang as BundledLanguage,
			theme: pallete,
		});
		const codeblock = generateHTMLFromTokens(tokens.tokens);
		return `<pre id="${id}" aria-hidden="true" tabindex="-1">${heading}${codeblock}</pre>`;
	};

	renderer.codespan = (source) => {
		return `<code>${source}</code>`;
	};
	renderer.blockquote = (source) => {
		return `<blockquote><span class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg></span>${source}</blockquote>`;
	};

	renderer.heading = (text, level, rawtext) => {
		const headingText = text.includes('{') ? text.substring(0, text.indexOf('{') - 1) : text;
		const anchorRegExp = /{([^}]+)}/g;
		const anchorOverwrite = anchorRegExp.exec(rawtext);
		const fragment = anchorOverwrite
			? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
			: slugify(rawtext);

		if (!fragment || level === 1) {
			return `<h${level}>${headingText}</h${level}>`;
		}

		metadata.toc.push({ description: rawtext, level, slug: fragment });

		return `
		<h${level} id="${fragment}">
		  <a href="#${fragment}" class="anchor mark-hover" tabindex="-1">${headingText}</a>
		  <span class="icon align-text-top"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></span>
		</h${level}>`;
	};

	const html = marked.parse(
		content.replace(/^\t+/gm, (match) => match.split('\t').join('  ')),
		{ renderer },
	) as string;
	return { html, metadata, assetsSrc };
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
		.replace(/'/g, '') // Remove single quote
		.replace(/&#39;/g, '') // Remove single quote
		.replace(/"/g, '') // Remove double quote
		.replace(/\s+/g, '-') // Replace spaces with -
		.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
		.replace(/&/g, '-and-') // Replace & with 'and'
		.replace(/[^\w-]+/g, '') // Remove all non-word characters
		.replace(/--+/, '-') // Replace multiple - with single -
		.replace(/^-+/, '') // Trim - from start of text
		.replace(/-+$/, ''); // Trim - from end of text
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
	const scopeColors = theme.tokenColors
		.filter((p) => p.scope)
		.map((tc) => {
			return {
				scope: (Array.isArray(tc.scope) ? tc.scope : [tc.scope]).map((c) => c.replace(/\./g, '-')),
				color: tc.settings.foreground,
			};
		});

	let style = `html.${scope} {`;

	for (const color of scopeColors) {
		for (const scope of color.scope) {
			style += '\n\t' + `--syntax-${scope}: ${hexToHSL(color.color)};`;
		}
	}

	for (const [key, color] of Object.entries(theme.colors)) {
		style += '\n\t' + `--${key.replace(/\./g, '-')}: ${color};`;
	}

	style += '\n' + `}`;

	return style;
}

// https://css-tricks.com/converting-color-spaces-in-javascript/#aa-hex-to-hsl
function hexToHSL(H: string | null | undefined): string {
	if (!H) {
		return '';
	}
	// Convert hex to RGB first
	let r = 0,
		g = 0,
		b = 0;
	if (H.length == 4) {
		r = parseInt('0x' + H[1] + H[1]);
		g = parseInt('0x' + H[2] + H[2]);
		b = parseInt('0x' + H[3] + H[3]);
	} else if (H.length == 7) {
		r = parseInt('0x' + H[1] + H[2]);
		g = parseInt('0x' + H[3] + H[4]);
		b = parseInt('0x' + H[5] + H[6]);
	}
	// Then to HSL
	r /= 255;
	g /= 255;
	b /= 255;
	const cmin = Math.min(r, g, b),
		cmax = Math.max(r, g, b),
		delta = cmax - cmin;
	let h = 0,
		s = 0,
		l = 0;

	if (delta == 0) h = 0;
	else if (cmax == r) h = ((g - b) / delta) % 6;
	else if (cmax == g) h = (b - r) / delta + 2;
	else h = (r - g) / delta + 4;

	h = Math.round(h * 60);

	if (h < 0) h += 360;

	l = (cmax + cmin) / 2;
	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1);

	return h + ',' + s + '%,' + l + '%';
}
