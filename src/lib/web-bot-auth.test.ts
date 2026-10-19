import { createPrivateKey, createPublicKey, verify } from 'crypto';
import { describe, expect, it } from 'vitest';
import { publicKeys, signDirectory, thumbprint } from './web-bot-auth';

// test-key-ed25519 from RFC 9421 appendix B.1.4, also used by Cloudflare's reference directory
const testKey = createPrivateKey(
	'-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIJ+DYvh6SEqVTm50DFtMDoQikTmiCqirVv9mWG9qfSnF\n-----END PRIVATE KEY-----\n',
);

describe('Web Bot Auth', () => {
	it('identifies keys by their JWK thumbprint', () => {
		// RFC 8037 appendix A.3
		expect(
			thumbprint({ kty: 'OKP', crv: 'Ed25519', x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo' }),
		).toBe('kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
	});

	it('signs the directory like the reference implementation', () => {
		// Cloudflare's directory at https://http-message-signatures-example.research.cloudflare.com/.well-known/http-message-signatures-directory
		// Ed25519 signatures are deterministic, so the same input yields the same signature
		const headers = signDirectory(testKey, {
			authority: 'http-message-signatures-example.research.cloudflare.com',
			created: 1792429763,
			expires: 1792430063,
		});

		expect(headers).toEqual({
			'Signature-Input':
				'sig1=("@authority";req);created=1792429763;keyid="poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U";alg="ed25519";expires=1792430063;tag="http-message-signatures-directory"',
			Signature:
				'sig1=:ZK6M/38s2VFNCTXe4xClL1XzobPWxoma9udqjVm2kt5NtLrBS1XTyRgejYFASAS3iYVwDeBsanntXuG8ZpuLAg==:',
		});

		const signatureBase = `"@authority";req: http-message-signatures-example.research.cloudflare.com\n"@signature-params": ${headers['Signature-Input'].replace('sig1=', '')}`;
		const signature = Buffer.from(headers.Signature.slice('sig1=:'.length, -1), 'base64');
		expect(verify(null, Buffer.from(signatureBase), createPublicKey(testKey), signature)).toBe(
			true,
		);
	});

	it('only publishes public Ed25519 keys', () => {
		expect(publicKeys.length).toBeGreaterThan(0);
		for (const key of publicKeys) {
			expect(key).toEqual({ kty: 'OKP', crv: 'Ed25519', x: expect.any(String) });
		}
	});
});
