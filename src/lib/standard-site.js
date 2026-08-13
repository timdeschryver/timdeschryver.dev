// https://standard.site — the site is published as AT Protocol records on the
// Bluesky PDS of @timdeschryver.dev by `pnpm standard-site` (scripts/standard-site.js).
// This module is shared between the site build and that script so both derive
// identical at:// URIs. The lexicons require record keys to be TIDs, so keys are
// deterministically derived from the post date instead of being randomly generated.

const did = 'did:plc:v7uubyblvslvage4cnlfcjip';

// The single publication record's key: a permutation of the author's name that
// happens to be a syntactically valid TID (it decodes to 2303-02-07). Never
// change it: it is the site's identity, embedded in every document record and
// referenced by static/.well-known/site.standard.publication.
const publicationRkey = 'deschryvertim';

export const standardSite = {
	did,
	publicationRkey,
	publication: `at://${did}/site.standard.publication/${publicationRkey}`,
	document: (slug, date) => `at://${did}/site.standard.document/${documentRkey(slug, date)}`,
};

// A TID is 13 base32-sortable characters encoding a 64-bit value:
// 0 bit + 53 bits of microseconds since the UNIX epoch + 10 bits of clock id.
// The date is truncated to UTC midnight so every date representation of the
// same day yields the same key, and the clock id is derived from the slug to
// keep posts published on the same day distinct.
export function documentRkey(slug, date) {
	const day = new Date(date).toISOString().split('T')[0];
	const micros = BigInt(Date.parse(day)) * 1000n;
	return encodeTid((micros << 10n) | BigInt(clockId(slug)));
}

const S32_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz';

function encodeTid(value) {
	let tid = '';
	for (let i = 0; i < 13; i++) {
		tid = S32_ALPHABET[Number(value & 31n)] + tid;
		value >>= 5n;
	}
	return tid;
}

function clockId(slug) {
	let hash = 0;
	for (const char of slug) {
		hash = (hash * 31 + char.codePointAt(0)) % 1024;
	}
	return hash;
}
