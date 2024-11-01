const admonitionTypes = ['danger', 'warning', 'info', 'success', 'note', 'ai', 'tip'];
const startReg = new RegExp(`^:::(${admonitionTypes.join('|')})$`);
const endReg = /^:::$/;

export const customBlock = {
	name: 'customBlock',
	level: 'block',
	start(this, src: string) {
		const index = src.match(new RegExp(`(^|[\\r\\n]):::(${admonitionTypes.join('|')})`))?.index;
		return index;
	},
	tokenizer(src: string, _tokens) {
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
				const [_, icon] = startReg.exec(lines[section.x]) || [];
				const text = lines.slice(section.x + 1, section.y).join('\n');
				const raw = lines.slice(section.x, section.y + 1).join('\n');
				const token = {
					type: 'customBlock',
					raw,
					icon,
					text,
					tokens: [],
					childTokens: ['title', 'text'],
				};

				this.lexer.blockTokens(token.text, token.tokens);
				return token;
			}
		}
	},
	renderer(this, token) {
		const [clazz, title] = {
			danger: ['danger', 'Alert'],
			warning: ['warning', 'Warning'],
			info: ['info', 'Note'],
			note: ['info', 'Note'],
			ai: ['info-ai', 'AI Note'],
			success: ['success', 'Congratulations'],
			tip: ['tip', 'Tip'],
		}[token.icon];
		return `<div class="custom-block ${clazz}">
			<div class="custom-block-title">${title}</div>
			${this.parser.parse(token.tokens)}
		</div>`;
	},
};
