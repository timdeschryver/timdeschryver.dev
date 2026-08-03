import type { Token, TokenizerAndRendererExtension, Tokens } from 'marked';

const admonitionTypes = ['danger', 'warning', 'info', 'success', 'note', 'ai', 'tip'] as const;
type AdmonitionType = (typeof admonitionTypes)[number];
type BlockDetail = readonly [className: string, title: string, icon: string];

interface CustomBlockToken extends Tokens.Generic {
	type: 'customBlock';
	icon: AdmonitionType;
	text: string;
	tokens: Token[];
}

const startReg = new RegExp(`^:::(${admonitionTypes.join('|')})$`);
const endReg = /^:::$/;
const iconAttributes =
	'xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const icons = {
	danger: `<svg ${iconAttributes}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
	warning: `<svg ${iconAttributes}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
	info: `<svg ${iconAttributes}><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>`,
	note: `<svg ${iconAttributes}><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>`,
	ai: `<svg ${iconAttributes}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
	success: `<svg ${iconAttributes}><path d="M20 6 9 17l-5-5"/></svg>`,
	tip: `<svg ${iconAttributes}><path d="M15 14c.2-1 .7-1.7 1.5-2.5A4.8 4.8 0 0 0 18 8 6 6 0 0 0 6 8c0 1.3.5 2.5 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
};
const blockDetails: Record<AdmonitionType, BlockDetail> = {
	danger: ['danger', 'Alert', icons.danger],
	warning: ['warning', 'Warning', icons.warning],
	info: ['info', 'Note', icons.info],
	note: ['info', 'Note', icons.note],
	ai: ['info-ai', 'AI Note', icons.ai],
	success: ['success', 'Congratulations', icons.success],
	tip: ['tip', 'Tip', icons.tip],
};

export const customBlock = {
	name: 'customBlock',
	level: 'block',
	childTokens: ['tokens'],
	start(src) {
		const index = src.match(new RegExp(`(^|[\\r\\n]):::(${admonitionTypes.join('|')})`))?.index;
		return index;
	},
	tokenizer(src) {
		const lines = src.split(/\n/);
		if (startReg.test(lines[0])) {
			const section = { x: -1, y: -1 };
			const sections = [];
			for (let i = 0, k = lines.length; i < k; i++) {
				if (startReg.test(lines[i])) {
					section.x = i;
				} else if (endReg.test(lines[i])) {
					section.y = i;
					if (section.x >= 0) {
						sections.push({ ...section });
						section.x = -1;
						section.y = -1;
					}
				}
			}

			if (sections.length) {
				const section = sections[0];
				const icon = startReg.exec(lines[section.x])?.[1];
				if (!isAdmonitionType(icon)) {
					return;
				}
				const text = lines.slice(section.x + 1, section.y).join('\n');
				const raw = lines.slice(section.x, section.y + 1).join('\n');
				const token: CustomBlockToken = {
					type: 'customBlock',
					raw,
					icon,
					text,
					tokens: [],
				};

				this.lexer.blockTokens(token.text, token.tokens);
				return token;
			}
		}
	},
	renderer(token) {
		const customBlockToken = token as CustomBlockToken;
		const [clazz, title, icon] = blockDetails[customBlockToken.icon];
		return `<div class="custom-block ${clazz}">
			<div class="custom-block-title"><span class="custom-block-icon">${icon}</span>${title}</div>
			${this.parser.parse(customBlockToken.tokens)}
		</div>`;
	},
} satisfies TokenizerAndRendererExtension;

function isAdmonitionType(value: string | undefined): value is AdmonitionType {
	return value !== undefined && (admonitionTypes as readonly string[]).includes(value);
}
