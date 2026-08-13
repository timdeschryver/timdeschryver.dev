// Publishes the site as https://standard.site records on the AT Protocol PDS:
// - one site.standard.publication record
// - one site.standard.document record per blog post
//
// Record keys are TIDs (required by the lexicons), deterministically derived in
// src/lib/standard-site.js — shared with the site build so the at:// URIs in
// static/.well-known/site.standard.publication and the link tags rendered by
// src/lib/Head.svelte always match the published records.
//
// Usage:
//   node ./scripts/standard-site.js [slug] [--dry-run] [--prune]
//
// --prune deletes records that no longer correspond to a blog post (renamed or
// removed posts, or keys from an older key scheme).
//
// Requires BLUESKY_APP_PASSWORD (create one at https://bsky.app/settings/app-passwords)
// in the environment or .env, except with --dry-run which only reads public records.
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import fm from 'front-matter';
import dotEnv from 'dotenv-extended';
import { standardSite, documentRkey } from '../src/lib/standard-site.js';

dotEnv.load({ silent: true });
dotEnv.load({ path: '.env.local', silent: true });

const siteUrl = 'https://timdeschryver.dev';
const identifier = process.env.BLUESKY_IDENTIFIER || 'timdeschryver.dev';
const password = process.env.BLUESKY_APP_PASSWORD;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const prune = args.includes('--prune');
const onlySlug = args.find((arg) => !arg.startsWith('--'));

const publicationRecord = {
	$type: 'site.standard.publication',
	url: siteUrl,
	name: 'Tim Deschryver',
	description: 'Articles about .NET, Angular, testing, and developer tooling.',
};

(async () => {
	const posts = readPosts();
	if (onlySlug && !posts.some((post) => post.slug === onlySlug)) {
		console.error(`Post '${onlySlug}' not found in ./blog`);
		process.exit(1);
	}

	if (!dryRun && !password) {
		console.error(
			'BLUESKY_APP_PASSWORD is not set, get one at https://bsky.app/settings/app-passwords (or use --dry-run)',
		);
		process.exit(1);
	}

	const records = [
		{
			collection: 'site.standard.publication',
			rkey: standardSite.publicationRkey,
			record: publicationRecord,
		},
		...posts.map((post) => ({
			collection: 'site.standard.document',
			rkey: documentRkey(post.slug, post.date),
			slug: post.slug,
			record: toDocumentRecord(post),
		})),
	];
	assertUniqueRkeys(records);

	const pds = await resolvePds(standardSite.did);
	const session = dryRun ? null : await createSession(pds);

	const totals = { created: 0, updated: 0, unchanged: 0, pruned: 0 };
	for (const { collection, rkey, slug, record } of records) {
		if (onlySlug && slug !== onlySlug) {
			continue;
		}

		const existing = await getRecord(pds, collection, rkey);
		if (existing && stableStringify(existing) === stableStringify(record)) {
			totals.unchanged++;
			continue;
		}

		const action = existing ? 'update' : 'create';
		totals[`${action}d`]++;
		console.log(
			`${dryRun ? `would ${action}` : action}: at://${standardSite.did}/${collection}/${rkey}${slug ? ` (${slug})` : ''}`,
		);
		if (!dryRun) {
			await putRecord(pds, session, collection, rkey, record);
		}
	}

	if (prune && !onlySlug) {
		const expected = new Set(records.map(({ collection, rkey }) => `${collection}/${rkey}`));
		for (const collection of ['site.standard.publication', 'site.standard.document']) {
			for (const rkey of await listRkeys(pds, collection)) {
				if (expected.has(`${collection}/${rkey}`)) {
					continue;
				}
				totals.pruned++;
				console.log(
					`${dryRun ? 'would prune' : 'prune'}: at://${standardSite.did}/${collection}/${rkey}`,
				);
				if (!dryRun) {
					await deleteRecord(pds, session, collection, rkey);
				}
			}
		}
	}

	console.log(
		`${dryRun ? '[dry-run] ' : ''}${totals.created} created, ${totals.updated} updated, ${totals.unchanged} unchanged, ${totals.pruned} pruned`,
	);
})();

function readPosts() {
	return readdirSync('./blog')
		.map((slug) => ({ slug, path: join('./blog', slug, 'index.md') }))
		.filter(({ path }) => existsSync(path))
		.map(({ slug, path }) => {
			const { attributes } = fm(readFileSync(path, 'utf-8'));
			return { ...attributes, slug };
		})
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function toDocumentRecord(post) {
	const tags = (post.tags || '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean);

	return {
		$type: 'site.standard.document',
		site: standardSite.publication,
		path: `/blog/${post.slug}`,
		title: post.title,
		description: post.description,
		publishedAt: new Date(post.date).toISOString(),
		...(post.modified ? { updatedAt: new Date(post.modified).toISOString() } : {}),
		...(tags.length ? { tags } : {}),
	};
}

function assertUniqueRkeys(records) {
	const seen = new Map();
	for (const { collection, rkey, slug } of records) {
		const key = `${collection}/${rkey}`;
		if (seen.has(key)) {
			throw new Error(`TID collision between '${seen.get(key)}' and '${slug}' (${key})`);
		}
		seen.set(key, slug);
	}
}

async function resolvePds(did) {
	const doc = await request(`https://plc.directory/${did}`);
	const service = doc.service?.find((s) => s.id === '#atproto_pds');
	if (!service) {
		throw new Error(`No PDS service found in DID document of ${did}`);
	}
	return service.serviceEndpoint;
}

async function createSession(pds) {
	const session = await request(`${pds}/xrpc/com.atproto.server.createSession`, {
		method: 'post',
		body: JSON.stringify({ identifier, password }),
		headers: { 'Content-Type': 'application/json' },
	});
	if (session.did !== standardSite.did) {
		throw new Error(
			`Signed in as ${session.did}, but the site links point to ${standardSite.did}. Update src/lib/standard-site.js and static/.well-known/site.standard.publication together.`,
		);
	}
	return session;
}

async function getRecord(pds, collection, rkey) {
	const params = new URLSearchParams({ repo: standardSite.did, collection, rkey });
	const response = await fetch(`${pds}/xrpc/com.atproto.repo.getRecord?${params}`);
	if (!response.ok) {
		return null;
	}
	const { value } = await response.json();
	return value;
}

async function listRkeys(pds, collection) {
	const rkeys = [];
	let cursor;
	do {
		const params = new URLSearchParams({ repo: standardSite.did, collection, limit: '100' });
		if (cursor) {
			params.set('cursor', cursor);
		}
		const page = await request(`${pds}/xrpc/com.atproto.repo.listRecords?${params}`);
		rkeys.push(...page.records.map((record) => record.uri.split('/').at(-1)));
		cursor = page.cursor;
	} while (cursor);
	return rkeys;
}

async function putRecord(pds, session, collection, rkey, record) {
	return await request(`${pds}/xrpc/com.atproto.repo.putRecord`, {
		method: 'post',
		body: JSON.stringify({ repo: session.did, collection, rkey, record }),
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session.accessJwt}`,
		},
	});
}

async function deleteRecord(pds, session, collection, rkey) {
	return await request(`${pds}/xrpc/com.atproto.repo.deleteRecord`, {
		method: 'post',
		body: JSON.stringify({ repo: session.did, collection, rkey }),
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session.accessJwt}`,
		},
	});
}

async function request(url, options) {
	const response = await fetch(url, options);
	if (!response.ok) {
		throw new Error(
			`${options?.method || 'get'} ${url} failed (${response.status}): ${await response.text()}`,
		);
	}
	return await response.json();
}

function stableStringify(value) {
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(',')}]`;
	}
	if (value && typeof value === 'object') {
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
			.join(',')}}`;
	}
	return JSON.stringify(value);
}
