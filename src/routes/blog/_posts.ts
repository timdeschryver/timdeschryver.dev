import * as fs from 'fs';
import frontmatter from 'front-matter';
import { ISODate } from '$lib/formatters';
import { variables } from '$lib/variables';
import { parseFileToHtmlAndMeta, sortByDate, traverseFolder } from '$lib/markdown';
import { execSync } from 'child_process';
import { dev } from '$app/environment';
import type { TOC, SeriesPost, BlogSeries } from '$lib/models';

const blogPath = 'blog';

// TypeScript types for blog posts
export interface BlogPostMetadata {
	title: string;
	slug: string;
	description: string;
	date: string;
	modified: string | null;
	tags: string[];
	canonical: string;
	outgoingLinks: { slug: string; title: string }[];
	incomingLinks: { slug: string; title: string }[];
	outgoingSlugs?: string[];
	translations: { url: string; author: string; profile: string; language: string }[];
	toc?: TOC[];
	author: string;
	banner: string;
	series?: BlogSeries;
	seriesPosts?: SeriesPost[];
}

export interface BlogPost {
	html?: string;
	tldr?: string;
	metadata: BlogPostMetadata;
}

export interface BlogPostMetadataOnly {
	metadata: Omit<BlogPostMetadata, 'toc'>;
	tldr: boolean;
}

interface FrontmatterAttributes {
	title: string;
	slug: string;
	date: string;
	description: string;
	tags: string | string[];
	translations?: { url: string; author: string; profile: string; language: string }[];
	series?: BlogSeries;
}

// Cache for full posts
const posts: BlogPost[] = [];

/**
 * Process individual post files to extract full post data with HTML
 */
async function processFullPost(files: { file: string; path: string }[]): Promise<BlogPost | null> {
	const postPath = files.find((f) => f.file === 'index.md')?.path;
	const tldrPath = files.find((f) => f.file === 'tldr.md')?.path;

	if (!postPath) {
		return null;
	}

	// Full HTML processing
	const result = parseFileToHtmlAndMeta(postPath);
	const html = result.html;
	const tldr = tldrPath ? parseFileToHtmlAndMeta(tldrPath).html : '';

	const processedMetadata: ProcessedMetadata = {
		title: result.metadata.title,
		slug: result.metadata.slug,
		description: result.metadata.description,
		date: result.metadata.date,
		tags: result.metadata.tags,
		toc: result.metadata.toc,
		outgoingSlugs: result.metadata.outgoingSlugs,
		translations: result.metadata.translations,
		series: result.metadata.series,
	};

	const finalMetadata = createPostMetadata(processedMetadata);

	return {
		html,
		tldr,
		metadata: {
			...finalMetadata,
			toc: result.metadata.toc || [],
			outgoingSlugs: result.metadata.outgoingSlugs || [],
		},
	};
}

/**
 * Process individual post files to extract metadata only
 */
async function processMetadataOnly(
	files: { file: string; path: string }[],
): Promise<BlogPostMetadataOnly | null> {
	const postPath = files.find((f) => f.file === 'index.md')?.path;
	const tldrPath = files.find((f) => f.file === 'tldr.md')?.path;

	if (!postPath) {
		return null;
	}

	// Metadata-only processing
	const markdown = fs.readFileSync(postPath, 'utf-8');
	const { attributes } = frontmatter<FrontmatterAttributes>(markdown);

	const processedMetadata: ProcessedMetadata = {
		title: attributes.title,
		slug: attributes.slug,
		description: attributes.description,
		date: attributes.date,
		tags: normalizeTagsFromFrontmatter(attributes.tags),
		toc: [],
		outgoingSlugs: [],
		translations: attributes.translations,
		series: attributes.series,
	};

	const finalMetadata = createPostMetadata(processedMetadata);

	return {
		metadata: finalMetadata,
		tldr: Boolean(tldrPath),
	};
}

interface ProcessedMetadata {
	title: string;
	slug: string;
	description: string;
	date: string;
	tags: string[];
	toc?: TOC[];
	outgoingSlugs?: string[];
	translations?: { url: string; author: string; profile: string; language: string }[];
	series?: BlogSeries;
}

/**
 * Create standardized post metadata
 */
function createPostMetadata(metadata: ProcessedMetadata): BlogPostMetadata {
	const banner = [variables.basePath, 'blog', metadata.slug, 'images', 'banner.png'].join('/');
	const canonical = [variables.basePath, 'blog', metadata.slug].join('/');
	const modified = getLastModifiedDate(metadata.slug);

	return {
		title: metadata.title,
		slug: metadata.slug,
		description: metadata.description,
		date: ISODate(metadata.date),
		modified: modified ? ISODate(modified) : null,
		tags: metadata.tags,
		banner,
		canonical,
		outgoingLinks: [],
		incomingLinks: [],
		outgoingSlugs: metadata.outgoingSlugs || [],
		translations: metadata.translations || [],
		toc: metadata.toc || [],
		author: 'Tim Deschryver',
		series: metadata.series,
	};
}

/**
 * Normalize tags from frontmatter format
 */
function normalizeTagsFromFrontmatter(tags: string | string[]): string[] {
	const tagArray =
		typeof tags === 'string'
			? tags.split(',').map((a) => (a ? a.trim().charAt(0).toUpperCase() + a.trim().slice(1) : a))
			: Array.isArray(tags)
				? tags
				: [];

	return tagArray.map((a) => {
		if (a.toLowerCase() === 'typescript') {
			return 'TypeScript';
		}
		if (a.toLowerCase() === 'ngrx') {
			return 'NgRx';
		}
		return a;
	});
}

/**
 * Add series information to posts
 */
function addSeriesInformation<T extends { metadata: BlogPostMetadata }>(posts: T[]): void {
	for (const post of posts) {
		if (post.metadata.series) {
			const seriesPosts = posts
				.filter((p) => p.metadata.series?.name === post.metadata.series?.name)
				.sort((a, b) => new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime());

			const metadataWithSeries = post.metadata as BlogPostMetadata & {
				seriesPosts: SeriesPost[];
			};
			metadataWithSeries.seriesPosts = seriesPosts.map((p, index) => ({
				slug: p.metadata.slug,
				title: p.metadata.title,
				date: p.metadata.date,
				order: index + 1,
				current: p.metadata.slug === post.metadata.slug,
			}));
		}
	}
}

/**
 * Add incoming/outgoing links to posts (only for full posts with HTML)
 */
function addPostLinks(posts: BlogPost[]): void {
	for (const post of posts) {
		const incomingLinks = new Set([
			...posts
				.filter((p) => p.metadata.outgoingSlugs?.includes(post.metadata.slug))
				.map((p) => ({
					slug: p.metadata.slug,
					title: p.metadata.title,
				})),
		]);

		const outgoingLinks = new Set([
			...posts
				.filter((p) => post.metadata.outgoingSlugs?.includes(p.metadata.slug))
				.map((p) => ({
					slug: p.metadata.slug,
					title: p.metadata.title,
				})),
		]);

		post.metadata.incomingLinks.push(...incomingLinks);
		post.metadata.outgoingLinks.push(...outgoingLinks);
	}
}

export async function readPosts(): Promise<BlogPost[]> {
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
		{} as Record<string, { file: string; path: string }[]>,
	);

	const promises = Object.values(directories).map(processFullPost);
	const results = await Promise.all(promises);
	const postsSorted = results
		.filter((result): result is BlogPost => result !== null)
		.sort(sortByDate);

	addPostLinks(postsSorted);
	addSeriesInformation(postsSorted);

	posts.push(...postsSorted);
	return postsSorted;
}

// Optimized function to read only metadata without generating HTML
export async function readPostsMetadata(): Promise<BlogPostMetadataOnly[]> {
	console.log('\x1b[35m[posts] generate metadata only\x1b[0m');

	const folderContent = [...traverseFolder(blogPath, '.md')];
	const directories = folderContent.reduce(
		(dirs, file) => {
			dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
			return dirs;
		},
		{} as Record<string, { file: string; path: string }[]>,
	);

	const promises = Object.values(directories).map(processMetadataOnly);
	const results = await Promise.all(promises);
	const postMetadata = results
		.filter((result): result is BlogPostMetadataOnly => result !== null)
		.sort(sortByDate);

	addSeriesInformation(postMetadata);

	return postMetadata;
}

// Optimized function to read a single post by slug
export async function readPostBySlug(slug: string): Promise<BlogPost | null> {
	console.log(`\x1b[35m[post] generate single post: ${slug}\x1b[0m`);

	const folderContent = [...traverseFolder(blogPath, '.md')];
	const directories: Record<string, { file: string; path: string }[]> = folderContent.reduce(
		(dirs, file) => {
			dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
			return dirs;
		},
		{} as Record<string, { file: string; path: string }[]>,
	);

	// Find the directory containing the target slug
	const targetDirectory = Object.values(directories).find((files) => {
		const postPath = files.find((f) => f.file === 'index.md')?.path;
		if (postPath) {
			const markdown = fs.readFileSync(postPath, 'utf-8');
			const { attributes } = frontmatter<{ slug: string }>(markdown);
			return attributes.slug === slug;
		}
		return false;
	});

	if (!targetDirectory) {
		return null;
	}

	const result = await processFullPost(targetDirectory);
	if (!result) {
		return null;
	}

	// If this post is part of a series, get all posts in the series for navigation
	if (result.metadata.series) {
		const allPosts = await readPostsMetadata();
		const seriesPosts = allPosts
			.filter((p) => p.metadata.series?.name === result.metadata.series?.name)
			.sort((a, b) => new Date(a.metadata.date).getTime() - new Date(b.metadata.date).getTime());

		const metadataWithSeries = result.metadata as BlogPostMetadata & {
			seriesPosts: SeriesPost[];
		};
		metadataWithSeries.seriesPosts = seriesPosts.map((p, index) => ({
			slug: p.metadata.slug,
			title: p.metadata.title,
			date: p.metadata.date,
			order: index + 1,
			current: p.metadata.slug === result.metadata.slug,
		}));
	}

	// Compute outgoing links for this single post (efficient - just lookup metadata)
	if (result.metadata.outgoingSlugs && result.metadata.outgoingSlugs.length > 0) {
		const allPostsMetadata = await readPostsMetadata();

		const outgoingLinks = result.metadata.outgoingSlugs
			.map((targetSlug) => {
				const targetPost = allPostsMetadata.find((p) => p.metadata.slug === targetSlug);
				return targetPost
					? {
							slug: targetPost.metadata.slug,
							title: targetPost.metadata.title,
						}
					: null;
			})
			.filter((link): link is { slug: string; title: string } => link !== null);

		result.metadata.outgoingLinks = outgoingLinks;
	}

	// Note: Incoming links are not computed for single posts for performance reasons
	// They require parsing all other posts to check their outgoingSlugs
	// If needed, they can be computed separately or cached

	return result;
}

/**
 * Compute incoming links for a specific post (expensive operation)
 * This requires parsing all posts to check their outgoingSlugs
 */
export async function getIncomingLinksForPost(
	slug: string,
): Promise<{ slug: string; title: string }[]> {
	console.log(`\x1b[33m[links] computing incoming links for: ${slug}\x1b[0m`);

	const allPosts = await readPosts();
	return allPosts
		.filter((p) => p.metadata.outgoingSlugs?.includes(slug))
		.map((p) => ({
			slug: p.metadata.slug,
			title: p.metadata.title,
		}));
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
				{} as Record<string, number>,
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
