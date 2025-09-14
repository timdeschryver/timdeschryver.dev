import * as fs from 'fs';
import * as path from 'path';
import { ISODate } from '$lib/formatters';
import { variables } from '$lib/variables';
import { parseFileToHtmlAndMeta, sortByDate, traverseFolder } from '$lib/markdown';
import { execSync } from 'child_process';
import { dev } from '$app/environment';
import type { TOC, SeriesPost, BlogSeries } from '$lib/models';

const blogPath = 'blog';
const cacheDir = '.blog-cache';

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

interface CachedPost {
	post: BlogPost;
	lastModified: number;
	cacheTimestamp: number;
}

/**
 * Process individual post files to extract full post data with HTML
 */
async function processFullPost(files: { file: string; path: string }[]): Promise<BlogPost | null> {
	const postPath = files.find((f) => f.file === 'index.md')?.path;
	const tldrPath = files.find((f) => f.file === 'tldr.md')?.path;

	if (!postPath) {
		return null;
	}

	// Parse main post and TLDR in parallel for better CI/CD performance
	const [result, tldrResult] = await Promise.all([
		Promise.resolve(parseFileToHtmlAndMeta(postPath)),
		tldrPath ? Promise.resolve(parseFileToHtmlAndMeta(tldrPath)) : Promise.resolve(null),
	]);

	const html = result.html;
	const tldr = tldrResult?.html || '';

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
	const folderContent = [...traverseFolder(blogPath, '.md')];
	const directories = folderContent.reduce(
		(dirs, file) => {
			dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
			return dirs;
		},
		{} as Record<string, { file: string; path: string }[]>,
	);

	// Check if we can use cached posts for all directories
	const cachedPosts = getAllValidCachedPosts();
	if (cachedPosts.length === Object.keys(directories).length) {
		console.log('\x1b[35m[posts] using cached posts\x1b[0m');
		return cachedPosts.sort(sortByDate);
	}

	const startTime = performance.now();
	console.log('\x1b[35m[posts] generate \x1b[0m');
	const promises = Object.values(directories).map(processFullPost);
	const results = await Promise.all(promises);
	const postsSorted = results
		.filter((result): result is BlogPost => result !== null)
		.sort(sortByDate);

	addPostLinks(postsSorted);
	addSeriesInformation(postsSorted);

	// Cache all posts to file system
	for (const post of postsSorted) {
		const postPath = `blog/${post.metadata.slug}/index.md`;
		const lastModified = getFileModificationTime(postPath);
		writeCachedPost(post.metadata.slug, post, lastModified);
	}

	const endTime = performance.now();
	console.log(
		`\x1b[35m[posts] generated ${postsSorted.length} posts in ${Math.round(endTime - startTime)}ms\x1b[0m`,
	);

	return postsSorted;
}

// Optimized function to read a single post by slug with caching
export async function readPostBySlug(slug: string): Promise<BlogPost | null> {
	const postPath = `blog/${slug}/index.md`;
	const tldrPath = `blog/${slug}/tldr.md`;

	const currentModified = getFileModificationTime(postPath);

	// Check if we have a cached version and if it's still valid
	if (isCacheValid(slug, currentModified)) {
		const cached = readCachedPost(slug);
		if (cached) {
			console.log(`\x1b[35m[posts] using cached post: ${slug}\x1b[0m`);
			return cached.post;
		}
	}

	const startTime = performance.now();
	console.log(`\x1b[35m[posts] generate single post: ${slug}\x1b[0m`);

	const result = await processFullPost([
		{ file: 'index.md', path: postPath },
		{ file: 'tldr.md', path: tldrPath },
	]);
	if (!result) {
		return null;
	}

	// Update cache with the new/updated post
	writeCachedPost(slug, result, currentModified);

	const endTime = performance.now();
	console.log(
		`\x1b[35m[posts] generated post '${slug}' in ${Math.round(endTime - startTime)}ms\x1b[0m`,
	);

	return result;
}

/**
 * Clear the posts cache - useful for development or when posts are updated externally
 */
export function clearPostsCache(): void {
	try {
		if (fs.existsSync(cacheDir)) {
			fs.rmSync(cacheDir, { recursive: true, force: true });
			console.log('\x1b[35m[posts] cleared cache directory\x1b[0m');
		}
	} catch (error) {
		console.warn('Failed to clear posts cache:', error);
	}
}

function getLastModifiedDate(slug: string) {
	if (dev) {
		return null;
	}
	const buffer = execSync(`git log -1 --format=%ci ./blog/${slug}/index.md`);
	if (!buffer) {
		return null;
	}
}

/**
 * Get file modification time for cache invalidation
 */
function getFileModificationTime(filePath: string): number {
	try {
		const stats = fs.statSync(filePath);
		return stats.mtime.getTime();
	} catch {
		return 0;
	}
}

/**
 * Get cache file path for a given slug
 */
function getCacheFilePath(slug: string): string {
	return path.join(cacheDir, slug, 'cache.json');
}

/**
 * Ensure cache directory exists for a given slug
 */
function ensureCacheDir(slug: string): void {
	const cachePath = path.join(cacheDir, slug);
	try {
		fs.mkdirSync(cachePath, { recursive: true });
	} catch (error) {
		console.warn(`Failed to create cache directory for ${slug}:`, error);
	}
}

/**
 * Read cached post from file system
 */
function readCachedPost(slug: string): CachedPost | null {
	try {
		const cacheFilePath = getCacheFilePath(slug);
		if (!fs.existsSync(cacheFilePath)) {
			return null;
		}

		const cacheContent = fs.readFileSync(cacheFilePath, 'utf-8');
		const cached: CachedPost = JSON.parse(cacheContent);
		return cached;
	} catch (error) {
		console.warn(`Failed to read cache for ${slug}:`, error);
		return null;
	}
}

/**
 * Write cached post to file system
 */
function writeCachedPost(slug: string, post: BlogPost, lastModified: number): void {
	try {
		ensureCacheDir(slug);
		const cacheFilePath = getCacheFilePath(slug);
		const cached: CachedPost = {
			post,
			lastModified,
			cacheTimestamp: Date.now(),
		};

		fs.writeFileSync(cacheFilePath, JSON.stringify(cached, null, 2));
	} catch (error) {
		console.warn(`Failed to write cache for ${slug}:`, error);
	}
}

/**
 * Check if cached post is still valid
 */
function isCacheValid(slug: string, currentModified: number): boolean {
	const cached = readCachedPost(slug);
	if (!cached) {
		return false;
	}

	// Check if the source file has been modified since the cache was created
	return cached.lastModified >= currentModified && currentModified > 0;
}

/**
 * Get all cached posts that are still valid
 */
function getAllValidCachedPosts(): BlogPost[] {
	const cachedPosts: BlogPost[] = [];

	try {
		if (!fs.existsSync(cacheDir)) {
			return cachedPosts;
		}

		const slugDirs = fs
			.readdirSync(cacheDir, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		for (const slug of slugDirs) {
			const postPath = `blog/${slug}/index.md`;
			const currentModified = getFileModificationTime(postPath);

			if (isCacheValid(slug, currentModified)) {
				const cached = readCachedPost(slug);
				if (cached) {
					cachedPosts.push(cached.post);
				}
			}
		}
	} catch (error) {
		console.warn('Failed to read cached posts:', error);
	}

	return cachedPosts;
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
