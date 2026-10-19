// Signs the Web Bot Auth key directory (see src/lib/web-bot-auth.js), runs after `pnpm build`.
//
// Azure Static Web Apps serves the prerendered directory as a static file, so it can't sign
// the response on request. The signature only covers the authority and its own parameters,
// which makes it possible to create it at build time and add it as static headers to the
// directory route in build/staticwebapp.config.json.
// Like security.txt, the signature is valid for a year and renewed with every deploy.
//
// Requires WEB_BOT_AUTH_PRIVATE_KEY (the private key as JWK) in the environment or .env,
// without it the directory is published without a signature.
import { readFileSync, writeFileSync } from 'fs';
import { createPrivateKey, createPublicKey } from 'crypto';
import dotEnv from 'dotenv-extended';
import { directoryPath, publicKeys, signDirectory } from '../src/lib/web-bot-auth.js';

dotEnv.load({ silent: true });
dotEnv.load({ path: '.env.local', silent: true });

const configPath = 'build/staticwebapp.config.json';
const privateKeyJwk = process.env.WEB_BOT_AUTH_PRIVATE_KEY;

if (!privateKeyJwk) {
	console.warn(
		`WEB_BOT_AUTH_PRIVATE_KEY is not set, ${directoryPath} is published without a signature`,
	);
	process.exit(0);
}

const privateKey = createPrivateKey({ key: JSON.parse(privateKeyJwk), format: 'jwk' });
const { x } = createPublicKey(privateKey).export({ format: 'jwk' });
if (!publicKeys.some((key) => key.x === x)) {
	throw new Error(`WEB_BOT_AUTH_PRIVATE_KEY doesn't belong to a key in src/lib/web-bot-auth.js`);
}

const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const route = config.routes.find((/** @type {{ route: string }} */ r) => r.route === directoryPath);
if (!route) {
	throw new Error(`${configPath} doesn't have a route for ${directoryPath}`);
}

const created = Math.floor(Date.now() / 1000);
const expires = created + 365 * 24 * 60 * 60;
const authority = new URL(process.env.VITE_PUBLIC_BASE_PATH || 'https://timdeschryver.dev').host;
route.headers = { ...route.headers, ...signDirectory(privateKey, { authority, created, expires }) };

writeFileSync(configPath, `${JSON.stringify(config, null, '\t')}\n`);
console.log(`Signed ${directoryPath} for ${authority}`);
