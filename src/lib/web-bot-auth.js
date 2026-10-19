// Web Bot Auth (https://datatracker.ietf.org/wg/webbotauth/about/) — the key directory
// at /.well-known/http-message-signatures-directory publishes the public keys that sign
// requests sent on behalf of timdeschryver.dev, so receiving sites can verify them.
// This module is shared between the site build, which serves the directory, and
// scripts/sign-web-bot-auth-directory.js, which signs the directory response after the build.
import { createHash, createPublicKey, sign } from 'node:crypto';

export const directoryPath = '/.well-known/http-message-signatures-directory';

// The matching private key is the WEB_BOT_AUTH_PRIVATE_KEY secret (a JWK), it's never committed.
// To rotate, add the new key here before using it, and only remove the old key when it's no longer used.
/** @type {import('node:crypto').JsonWebKey[]} */
export const publicKeys = [
	{ kty: 'OKP', crv: 'Ed25519', x: '31y-zt16miX1d-eJB5Yq3fDMlYl3hq4d21-Xber51jY' },
];

// The base64url JWK SHA-256 thumbprint (RFC 7638, RFC 8037 appendix A.3) identifies a key
/** @param {import('node:crypto').JsonWebKey} jwk */
export function thumbprint({ crv, kty, x }) {
	// The required members in lexicographic order, without whitespace
	return createHash('sha256').update(JSON.stringify({ crv, kty, x })).digest('base64url');
}

// The RFC 9421 signature that binds the directory to the authority serving it,
// so it can't be mirrored by someone else (draft-meunier-http-message-signatures-directory, section 5.2)
/**
 * @param {import('node:crypto').KeyObject} privateKey
 * @param {{ authority: string, created: number, expires: number }} options
 */
export function signDirectory(privateKey, { authority, created, expires }) {
	const keyid = thumbprint(createPublicKey(privateKey).export({ format: 'jwk' }));
	const params = `("@authority";req);created=${created};keyid="${keyid}";alg="ed25519";expires=${expires};tag="http-message-signatures-directory"`;
	const signatureBase = `"@authority";req: ${authority}\n"@signature-params": ${params}`;
	const signature = sign(null, Buffer.from(signatureBase), privateKey).toString('base64');

	return {
		'Signature-Input': `sig1=${params}`,
		Signature: `sig1=:${signature}:`,
	};
}
