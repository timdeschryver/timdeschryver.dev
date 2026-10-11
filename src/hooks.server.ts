import type { Handle } from '@sveltejs/kit/hooks';

// Only the body and heading fonts are used above the fold, code and italic fonts load on demand
const preloadedFonts = /(mona-sans|hubot-sans)-latin-wght-normal\.woff2$/;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		preload: (input) =>
			input.type === 'js' ||
			input.type === 'css' ||
			(input.type === 'font' && preloadedFonts.test(input.filename)),
	});
