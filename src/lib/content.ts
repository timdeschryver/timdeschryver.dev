import * as fs from 'fs';
import * as path from 'path';
import frontmatter from 'front-matter';
import type { TOC, BlogSeries } from './models';

export interface MarkdownMetadata {
	outgoingSlugs: string[];
	title: string;
	slug: string;
	date: string;
	description: string;
	tags: string[];
	toc: TOC[];
	translations?: { url: string; author: string; profile: string; language: string }[];
	series?: BlogSeries;
	[key: string]: unknown;
}

export function readMarkdownMetadata(file: string): MarkdownMetadata | null {
	if (!fs.existsSync(file)) {
		return null;
	}

	const markdown = fs.readFileSync(file, 'utf-8');
	return extractFrontmatter(markdown).metadata;
}

export function extractFrontmatter(markdown: string): {
	content: string;
	metadata: MarkdownMetadata;
} {
	const result = frontmatter<{
		tags: string | string[];
		translations?: { url: string; author: string; profile: string; language: string }[];
		series?: {
			name: string;
			order: number;
		};
		title: string;
		slug: string;
		date: string;
		description: string;
	}>(markdown);

	const metadata: MarkdownMetadata = {
		...result.attributes,
		outgoingSlugs: [],
		toc: [],
		tags: [],
	};

	if (typeof result.attributes.tags === 'string') {
		metadata.tags = result.attributes.tags
			.split(',')
			.map((a) => (a ? a.trim().charAt(0).toUpperCase() + a.trim().slice(1) : a))
			.map((a) => {
				if (a.toLowerCase() === 'typescript') {
					return 'TypeScript';
				}

				if (a.toLowerCase() === 'ngrx') {
					return 'NgRx';
				}

				return a;
			});
	} else if (Array.isArray(result.attributes.tags)) {
		metadata.tags = result.attributes.tags;
	}

	if (Array.isArray(result.attributes.translations)) {
		for (const translation of result.attributes.translations) {
			const translationsMap = {
				es: 'Español',
				ru: 'Russian',
			};

			translation.language = translationsMap[translation.language] ?? translation.language;
		}

		metadata.translations = result.attributes.translations;
	}

	if (result.attributes.series) {
		metadata.series = result.attributes.series;
	}

	return { metadata, content: result.body };
}

export function* traverseFolder(
	folder: string,
	extension = '.md',
): Generator<{ folder: string; file: string; path: string }> {
	const folders = fs.readdirSync(folder, { withFileTypes: true }) as fs.Dirent[];

	for (const folderEntry of folders) {
		if (folderEntry.name.includes('node_modules')) {
			continue;
		}

		const entryPath = path.resolve(folder, folderEntry.name);
		if (folderEntry.isDirectory()) {
			yield* traverseFolder(entryPath, extension);
		} else if (path.extname(entryPath) === extension) {
			yield { folder, file: folderEntry.name, path: entryPath };
		}
	}
}

export function sortByDate<T extends { metadata: { date: string } }>(a: T, b: T) {
	return new Date(a.metadata.date) < new Date(b.metadata.date) ? 1 : -1;
}
