import { publicKeys, thumbprint } from '#lib/web-bot-auth.js';

export const prerender = true;

// The Web Bot Auth key directory, served at /.well-known/http-message-signatures-directory
// Azure Static Web Apps derives the content type from the file extension,
// so the directory is prerendered as a .jwks file and rewritten (see staticwebapp.config.json and hooks.ts)
// The response signature is added to staticwebapp.config.json after the build (see scripts/sign-web-bot-auth-directory.js)
export function GET() {
	const directory = {
		keys: publicKeys.map((key) => ({ ...key, kid: thumbprint(key) })),
	};

	return new Response(JSON.stringify(directory, null, '\t'), {
		headers: {
			'Content-Type': 'application/http-message-signatures-directory+json',
		},
	});
}
