import { publicUrl } from '#lib/variables.js';

export const prerender = true;

// The RFC 9116 security.txt, served at /.well-known/security.txt
// Expires is required and must be less than a year away,
// so it's set relative to the build date and renewed with every deploy
export function GET() {
	const expires = new Date();
	expires.setUTCFullYear(expires.getUTCFullYear() + 1);
	expires.setUTCDate(expires.getUTCDate() - 1);

	const content = [
		'Contact: https://github.com/timdeschryver/timdeschryver.dev/security/advisories/new',
		`Expires: ${expires.toISOString()}`,
		'Preferred-Languages: en',
		`Canonical: ${publicUrl('/.well-known/security.txt')}`,
	].join('\n');

	return new Response(`${content}\n`, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
