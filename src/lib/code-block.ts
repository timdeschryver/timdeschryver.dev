import type { TokenizerAndRendererExtension, Tokens } from 'marked';

interface CodeGroupCode extends Tokens.Code {
	title: string;
	id: number;
}

interface CodeGroupToken extends Tokens.Generic {
	type: 'codeGroup';
	text: string;
	codeblocks: CodeGroupCode[];
}

let codeBlockId = 0;
export const codeGroup = {
	name: 'codeGroup',
	level: 'block',
	childTokens: ['codeblocks'],
	start(src) {
		return src.match(/^:::code-group$/)?.index;
	},
	tokenizer(src, _tokens) {
		const lines = src.split(/\n/);
		if (/^:::code-group$/.test(lines[0])) {
			const section = { x: -1, y: -1 };
			const sections = [];
			for (let i = 0, k = lines.length; i < k; i++) {
				if (/^:::code-group$/.test(lines[i])) {
					section.x = i;
				} else if (/^:::$/.test(lines[i])) {
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
				const text = lines.slice(section.x + 1, section.y).join('\n');
				const raw = lines.slice(section.x, section.y + 1).join('\n');

				const codeblocks = text.trim().match(/```.*?```$/gms) ?? [];
				const token: CodeGroupToken = {
					type: 'codeGroup',
					raw,
					text: text.trim(),
					codeblocks: codeblocks.map((c) => {
						const codeLines = c.split('\n');
						const first = (codeLines.shift() ?? '').replace(/```/, '');
						const titleMatch = first.match(/\[title=([^\]]+)\]/);
						const title = titleMatch?.[1] ?? '';
						const lang = first.replace(/\[title=[^\]]+\]/, '').trim();
						codeLines.pop();

						return {
							type: 'code',
							raw: c,
							lang,
							text: codeLines.join('\n'),
							title,
							id: codeBlockId++,
						};
					}),
				};
				return token;
			}
		}
	},
	renderer(token) {
		const { codeblocks } = token as CodeGroupToken;
		return `
        <div class="code-group">
			<div class="code-group-tabs" role="tablist" aria-label="Code examples"> ${codeblocks
				.map(
					(c, i) =>
						`<button type="button" id="code-tab-${c.id}" data-id="${c.id}" class="code-group-tab ${i === 0 ? 'active' : ''}" role="tab" aria-selected="${i === 0}" aria-controls="code-panel-${c.id}" tabindex="${i === 0 ? '0' : '-1'}">${
							c.title
						}</button>`,
				)
				.join('')}</div>
			${codeblocks
				.map(
					(c, i) =>
						`<div id="code-panel-${c.id}" data-id="${c.id}" class="code-group-code" role="tabpanel" aria-labelledby="code-tab-${c.id}" ${i === 0 ? '' : 'hidden'}>${this.parser.renderer.code(
							c,
						)}</div>`,
				)
				.join('')}
		</div>`;
	},
} satisfies TokenizerAndRendererExtension;
