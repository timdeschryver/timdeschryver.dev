import * as path from 'path';
import { ISODate } from '$lib/formatters';
import { variables } from '$lib/variables';
import { parseFileToHtmlAndMeta, sortByDate, traverseFolder } from '../../lib/markdown';

const blogPath = 'blog';

const posts:
	| {
			html: string;
			tldr: string;
			metadata: {
				title: string;
				slug: string;
				description: string;
				date: string;
				tags: string[];
				canonical: string;
				edit: string;
				outgoingLinks: { slug: string; title: string }[];
				incomingLinks: { slug: string; title: string }[];
				translations: { url: string; author: string; profile: string }[];
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
			tags: string[];
			canonical: string;
			edit: string;
			outgoingLinks: { slug: string; title: string }[];
			incomingLinks: { slug: string; title: string }[];
			translations: { url: string; author: string; profile: string }[];
		};
	}[]
> {
	if (posts.length) {
		return posts;
	}
	console.log('\x1b[35m[posts] generate\x1b[0m');

	const folderContent = [...traverseFolder(blogPath, '.md')];
	const directories = folderContent.reduce((dirs, file) => {
		dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
		return dirs;
	}, {} as { [directory: string]: { file: string; path: string }[] });

	const postsSorted = Object.values(directories)
		.map((files) => {
			const postPath = files.find((f) => f.file === 'index.md').path;
			const tldrPath = files.find((f) => f.file === 'tldr.md')?.path;

			const { html, metadata } = parseFileToHtmlAndMeta(postPath);
			const { html: tldr } = tldrPath ? parseFileToHtmlAndMeta(tldrPath) : { html: null };

			const tags = metadata.tags;
			const banner = path
				.normalize(path.join(variables.basePath, 'blog', metadata.slug, 'images', 'banner.jpg'))
				.replace(/\\/g, '/')
				.replace('/', '//');

			const canonical = path
				.normalize(path.join(variables.basePath, 'blog', metadata.slug))
				.replace(/\\/g, '/')
				.replace('/', '//');

			const edit = `https://github.com/timdeschryver/timdeschryver.dev/tree/main/blog/${metadata.slug}/index.md`;
			return {
				html,
				tldr,
				metadata: {
					...metadata,
					date: ISODate(metadata.date),
					tags,
					banner,
					canonical,
					edit,
					outgoingLinks: [],
					incomingLinks: [],
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
