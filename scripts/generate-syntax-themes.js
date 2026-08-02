import * as fs from 'fs';
import palette from 'shiki/themes/rose-pine.mjs';
import paletteDawn from 'shiki/themes/rose-pine-dawn.mjs';

const usedEditorColors = new Set(['input.border', 'tab.activeBackground']);

fs.writeFileSync('src/routes/dark.theme.css', createStyle('dark', palette));
fs.writeFileSync('src/routes/light.theme.css', createStyle('light', paletteDawn));

function createStyle(scope, theme) {
	const scopeColors = (theme.tokenColors ?? theme.settings ?? []).flatMap(({ scope, settings }) => {
		const scopes = Array.isArray(scope) ? scope : scope ? [scope] : [];
		return scopes.map((tokenScope) => ({
			scope: tokenScope.replace(/\./g, '-'),
			color: settings.foreground,
		}));
	});

	let style = `html.${scope} {`;
	for (const color of scopeColors) {
		style += `\n\t--syntax-${color.scope}: ${hexToHsl(color.color)};`;
	}
	for (const [key, color] of Object.entries(theme.colors ?? {})) {
		if (!usedEditorColors.has(key)) continue;
		style += `\n\t--${key.replace(/\./g, '-')}: ${color};`;
	}
	return `${style}\n}\n`;
}

function hexToHsl(hex) {
	if (!hex) return '';

	let red = 0;
	let green = 0;
	let blue = 0;
	if (hex.length === 4) {
		red = parseInt(`0x${hex[1]}${hex[1]}`);
		green = parseInt(`0x${hex[2]}${hex[2]}`);
		blue = parseInt(`0x${hex[3]}${hex[3]}`);
	} else if (hex.length === 7) {
		red = parseInt(`0x${hex[1]}${hex[2]}`);
		green = parseInt(`0x${hex[3]}${hex[4]}`);
		blue = parseInt(`0x${hex[5]}${hex[6]}`);
	}

	red /= 255;
	green /= 255;
	blue /= 255;
	const minimum = Math.min(red, green, blue);
	const maximum = Math.max(red, green, blue);
	const delta = maximum - minimum;
	let hue = 0;
	if (delta !== 0) {
		if (maximum === red) hue = ((green - blue) / delta) % 6;
		else if (maximum === green) hue = (blue - red) / delta + 2;
		else hue = (red - green) / delta + 4;
	}
	hue = Math.round(hue * 60);
	if (hue < 0) hue += 360;

	const lightness = (maximum + minimum) / 2;
	const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
	return `${hue}, ${+(saturation * 100).toFixed(1)}%, ${+(lightness * 100).toFixed(1)}%`;
}
