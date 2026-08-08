import * as fs from 'fs';
import * as path from 'path';
import { readMarkdownMetadata, sortByDate, traverseFolder } from '$lib/content';
import { ISODate } from '$lib/formatters';
import { publicUrl } from '$lib/variables';
import { createHash } from 'crypto';
import type { TOC, SeriesPost, BlogSeries } from '$lib/models';

const blogPath = 'blog';
const cacheDir = '.blog-cache';
const postProcessorHash = createPostProcessorHash();

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
	outgoingSlugs: string[];
	translations: { url: string; author: string; profile: string; language: string }[];
	toc: TOC[];
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

export interface BlogPostSummary {
	hasTldr: boolean;
	metadata: BlogPostMetadata;
}

interface CachedPost {
	post: BlogPost;
	sourceState: PostSourceState;
	cacheTimestamp: number;
	processorHash: string;
}

interface PostSourceState {
	index: FileState;
	tldr: FileState | null;
}

interface FileState {
	modified: number;
	size: number;
}

interface PostFile {
	file: string;
	path: string;
}

let markdownModulePromise: Promise<typeof import('$lib/markdown')> | undefined;

function getMarkdownModule() {
	markdownModulePromise ??= import('$lib/markdown');
	return markdownModulePromise;
}

/**
 * Process individual post files to extract full post data with HTML
 */
async function processFullPost(files: PostFile[]): Promise<BlogPost | null> {
	const { parseFileToHtmlAndMeta } = await getMarkdownModule();
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
		modified: result.metadata.modified,
		tags: result.metadata.tags,
		toc: result.metadata.toc,
		outgoingSlugs: result.metadata.outgoingSlugs,
		translations: result.metadata.translations ?? [],
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
	modified?: string;
	tags: string[];
	toc: TOC[];
	outgoingSlugs: string[];
	translations: { url: string; author: string; profile: string; language: string }[];
	series?: BlogSeries;
}

/**
 * Create standardized post metadata
 */
function createPostMetadata(metadata: ProcessedMetadata): BlogPostMetadata {
	const banner = publicUrl(`/blog/${metadata.slug}/images/banner.webp`);
	const canonical = publicUrl(`/blog/${metadata.slug}`);

	return {
		title: metadata.title,
		slug: metadata.slug,
		description: metadata.description,
		date: ISODate(metadata.date),
		modified: metadata.modified ? ISODate(metadata.modified) : null,
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

export async function readPostSummaries(): Promise<BlogPostSummary[]> {
	const directories = getPostDirectories();

	const summaries = Object.values(directories)
		.map((files) => {
			const postPath = files.find((file) => file.file === 'index.md')?.path;
			if (!postPath) {
				return null;
			}

			const metadata = readMarkdownMetadata(postPath);
			if (!metadata) {
				return null;
			}

			const finalMetadata = createPostMetadata({
				title: metadata.title,
				slug: metadata.slug,
				description: metadata.description,
				date: metadata.date,
				modified: metadata.modified,
				tags: metadata.tags,
				toc: metadata.toc,
				outgoingSlugs: metadata.outgoingSlugs,
				translations: metadata.translations || [],
				series: metadata.series,
			});

			return {
				hasTldr: files.some((file) => file.file === 'tldr.md'),
				metadata: finalMetadata,
			};
		})
		.filter((summary): summary is BlogPostSummary => summary !== null)
		.sort(sortByDate);

	addSeriesInformation(summaries);

	return summaries;
}

export async function readPosts(): Promise<BlogPost[]> {
	const directories = getPostDirectories();
	const startTime = performance.now();
	let cacheHits = 0;
	const promises = Object.values(directories).map(async (files) => {
		const postPath = files.find((file) => file.file === 'index.md')?.path;
		if (!postPath) {
			return null;
		}

		const slug = path.basename(path.dirname(postPath));
		const sourceState = getPostSourceState(files);
		const cached = readCachedPost(slug);
		if (cached && isCacheValid(cached, sourceState)) {
			cacheHits++;
			return cached.post;
		}

		const post = await processFullPost(files);
		if (post) {
			writeCachedPost(slug, post, sourceState);
		}
		return post;
	});
	const results = await Promise.all(promises);
	const postsSorted = results
		.filter((result): result is BlogPost => result !== null)
		.sort(sortByDate);

	if (cacheHits === postsSorted.length) {
		console.log('\x1b[35m[posts] using cached posts\x1b[0m');
	} else {
		const endTime = performance.now();
		console.log(
			`\x1b[35m[posts] generated ${postsSorted.length - cacheHits} of ${postsSorted.length} posts in ${Math.round(endTime - startTime)}ms\x1b[0m`,
		);
	}

	return addPostRelationships(postsSorted);
}

// Optimized function to read a single post by slug with caching
export async function readPostBySlug(slug: string): Promise<BlogPost | null> {
	const posts = await readPosts();
	return posts.find((post) => post.metadata.slug === slug) ?? null;
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

function getPostDirectories(): Record<string, PostFile[]> {
	return [...traverseFolder(blogPath, '.md')].reduce(
		(directories, file) => {
			directories[file.folder] = [
				...(directories[file.folder] || []),
				{ path: file.path, file: file.file },
			];
			return directories;
		},
		{} as Record<string, PostFile[]>,
	);
}

function addPostRelationships(posts: BlogPost[]): BlogPost[] {
	const finalizedPosts = posts.map((post) => {
		const { seriesPosts: _, ...metadata } = post.metadata;
		return {
			...post,
			metadata: {
				...metadata,
				incomingLinks: [],
				outgoingLinks: [],
			},
		};
	});

	addPostLinks(finalizedPosts);
	addSeriesInformation(finalizedPosts);
	return finalizedPosts;
}

function getPostSourceState(files: PostFile[]): PostSourceState {
	const postPath = files.find((file) => file.file === 'index.md')?.path;
	if (!postPath) {
		throw new Error('Cannot cache a post without index.md');
	}

	const tldrPath = files.find((file) => file.file === 'tldr.md')?.path;
	return {
		index: getFileState(postPath),
		tldr: tldrPath ? getFileState(tldrPath) : null,
	};
}

function getFileState(filePath: string): FileState {
	try {
		const stats = fs.statSync(filePath);
		return { modified: stats.mtimeMs, size: stats.size };
	} catch {
		return { modified: 0, size: 0 };
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
		// URLs depend on the current build environment and must not be restored from the cache.
		cached.post.metadata.canonical = publicUrl(`/blog/${slug}`);
		cached.post.metadata.banner = publicUrl(`/blog/${slug}/images/banner.webp`);
		return cached;
	} catch (error) {
		console.warn(`Failed to read cache for ${slug}:`, error);
		return null;
	}
}

/**
 * Write cached post to file system
 */
function writeCachedPost(slug: string, post: BlogPost, sourceState: PostSourceState): void {
	try {
		ensureCacheDir(slug);
		const cacheFilePath = getCacheFilePath(slug);
		const cached: CachedPost = {
			post,
			sourceState,
			cacheTimestamp: Date.now(),
			processorHash: postProcessorHash,
		};

		fs.writeFileSync(cacheFilePath, JSON.stringify(cached, null, 2));
	} catch (error) {
		console.warn(`Failed to write cache for ${slug}:`, error);
	}
}

/**
 * Check if cached post is still valid
 */
function isCacheValid(cached: CachedPost, sourceState: PostSourceState): boolean {
	return (
		cached.processorHash === postProcessorHash &&
		cached.sourceState.index.modified === sourceState.index.modified &&
		cached.sourceState.index.size === sourceState.index.size &&
		cached.sourceState.tldr?.modified === sourceState.tldr?.modified &&
		cached.sourceState.tldr?.size === sourceState.tldr?.size &&
		sourceState.index.modified > 0
	);
}

function createPostProcessorHash(): string {
	const hash = createHash('sha256');
	const inputs = [
		'pnpm-lock.yaml',
		'src/routes/blog/_posts.ts',
		'src/lib/content.ts',
		'src/lib/formatters.ts',
		'src/lib/markdown.ts',
		'src/lib/code-block.ts',
		'src/lib/custom-block.ts',
		'src/lib/variables.ts',
		'static/images/languages',
	];

	for (const file of inputs.flatMap(listFiles).sort()) {
		hash.update(file);
		hash.update(fs.readFileSync(file));
	}

	return hash.digest('hex');
}

function listFiles(filePath: string): string[] {
	if (!fs.existsSync(filePath)) return [];
	if (!fs.statSync(filePath).isDirectory()) return [filePath];

	return fs
		.readdirSync(filePath, { withFileTypes: true })
		.flatMap((entry) => listFiles(path.join(filePath, entry.name)));
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

export const TAG_COLORS: Partial<Record<string, string>> = {
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
