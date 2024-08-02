import * as path from 'path';
import { ISODate } from '$lib/formatters';
import { variables } from '$lib/variables';
import { parseFileToHtmlAndMeta, sortByDate, traverseFolder } from '$lib/markdown';
import { execSync } from 'child_process';
import { dev } from '$app/environment';
import type { TOC } from '$lib/models';

const blogPath = 'blog';

const posts: {
	html: string;
	tldr: string;
	metadata: {
		title: string;
		slug: string;
		description: string;
		date: string;
		modified: string | null;
		tags: string[];
		canonical: string;
		outgoingLinks: { slug: string; title: string }[];
		incomingLinks: { slug: string; title: string }[];
		translations: { url: string; author: string; profile: string }[];
		toc: TOC[];
	};
}[] = [];

export async function readPosts(): Promise<
	{
		html: string;
		tldr: string;
		metadata: {
			title: string;
			slug: string;
			description: string;
			date: string;
			modified: string | null;
			tags: string[];
			canonical: string;
			outgoingLinks: { slug: string; title: string }[];
			incomingLinks: { slug: string; title: string }[];
			translations: { url: string; author: string; profile: string }[];
			toc: TOC[];
		};
	}[]
> {
	if (posts.length) {
		return posts;
	}
	console.log('\x1b[35m[posts] generate\x1b[0m');

	const folderContent = [...traverseFolder(blogPath, '.md')];
	const directories = folderContent.reduce(
		(dirs, file) => {
			dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
			return dirs;
		},
		{} as { [directory: string]: { file: string; path: string }[] },
	);

	const postsSorted = Object.values(directories)
		.map((files) => {
			const postPath = files.find((f) => f.file === 'index.md').path;
			const tldrPath = files.find((f) => f.file === 'tldr.md')?.path;

			const { html, metadata } = parseFileToHtmlAndMeta(postPath);
			const { html: tldr } = tldrPath ? parseFileToHtmlAndMeta(tldrPath) : { html: null };
			const tags = metadata.tags;
			const banner = path
				.normalize(path.join(variables.basePath, 'blog', metadata.slug, 'images', 'banner.png'))
				.replace(/\\/g, '/')
				.replace('/', '//');

			const canonical = path
				.normalize(path.join(variables.basePath, 'blog', metadata.slug))
				.replace(/\\/g, '/')
				.replace('/', '//');

			const modified = getLastModifiedDate(metadata.slug);
			return {
				html,
				tldr,
				metadata: {
					...metadata,
					date: ISODate(metadata.date),
					modified: modified ? ISODate(modified) : null,
					tags,
					banner,
					canonical,
					outgoingLinks: [],
					incomingLinks: [],
					toc: metadata.toc,
				},
			};
		})
		.sort(sortByDate);

	for (const post of postsSorted) {
		const incomingLinks = new Set([
			...postsSorted
				.filter((p) => p.metadata.outgoingSlugs.includes(post.metadata.slug))
				.map((p) => ({
					slug: p.metadata.slug,
					title: p.metadata.title,
				})),
		]);

		const outgoingLinks = new Set([
			...postsSorted
				.filter((p) => post.metadata.outgoingSlugs.includes(p.metadata.slug))
				.map((p) => ({
					slug: p.metadata.slug,
					title: p.metadata.title,
				})),
		]);

		post.metadata.incomingLinks.push(...incomingLinks);
		post.metadata.outgoingLinks.push(...outgoingLinks);
	}

	posts.push(...postsSorted);
	return postsSorted;
}

function getLastModifiedDate(slug: string) {
	if (dev) {
		return null;
	}
	const buffer = execSync(`git log -1 --format=%ci ./blog/${slug}/index.md`);
	if (!buffer) {
		return null;
	}

	return buffer.toString().trim();
}

export function orderTags(tags: string[]) {
	return Object.entries<number>(
		tags
			.filter(
				(tag) =>
					tag.toLowerCase() !== 'redux' &&
					tag.toLowerCase() !== 'developerexperience' &&
					tag.toLowerCase() !== 'csharp',
			)
			.map((tag) => (tag.toLowerCase() === 'dotnet' ? '.NET' : tag))
			.reduce(
				(acc, tag) => {
					acc[tag] = (acc[tag] || 0) + 1;
					return acc;
				},
				{} as { [tag: string]: number },
			),
	)
		.sort(([v1, c1], [v2, c2]) => c2 - c1 || v2.localeCompare(v1))
		.slice(0, 15)
		.map(([v]) => v);
}

export const TAG_COLORS = {
	typescript: 'typescript',
	angular: 'angular',
	dotnet: 'dotnet',
	'.net': 'dotnet',
	ngrx: 'ngrx',
	playwright: 'playwright',
	rxjs: 'rxjs',
	azure: 'azure',
	'azure devops': 'azure',
	zod: 'zod',
	svelte: 'svelte',
	cypress: 'cypress',
	javascript: 'javascript',
	vue: 'vue',
};
