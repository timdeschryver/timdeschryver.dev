import { sortByDate, traverseFolder } from '$lib/content';
import { ISODate } from '$lib/formatters';
import { parseFileToHtmlAndMeta } from '$lib/markdown';

const bitsPath = 'bits';

const bits: {
	html: string;
	metadata: {
		title: string;
		slug: string;
		description: string;
		date: string;
		tags: string[];
	};
}[] = [];

export async function readBits(): Promise<
	{
		html: string;
		metadata: {
			title: string;
			slug: string;
			description: string;
			date: string;
			tags: string[];
		};
	}[]
> {
	if (bits.length) {
		return bits;
	}

	console.log('\x1b[35m[bits] generate\x1b[0m');

	const folderContent = [...traverseFolder(bitsPath, '.md')];
	const directories = folderContent.reduce(
		(dirs, file) => {
			dirs[file.folder] = [...(dirs[file.folder] || []), { path: file.path, file: file.file }];
			return dirs;
		},
		{} as Record<string, { file: string; path: string }[]>,
	);

	const bitsSorted = Object.values(directories)
		.map((files) => {
			const postPath = files.find((f) => f.file === 'index.md').path;
			const { html, metadata } = parseFileToHtmlAndMeta(postPath);
			const tags = metadata.tags;
			return {
				html: html,
				metadata: {
					title: metadata.title,
					slug: metadata.slug,
					description: createDescription(html, metadata.title),
					date: ISODate(metadata.date),
					tags: tags.map((t) => t.toLowerCase()),
				},
			};
		})
		.sort(sortByDate);

	bits.push(...bitsSorted);
	return bitsSorted;
}

function createDescription(html: string, fallback: string) {
	const paragraph = html.match(/<p>(.*?)<\/p>/s)?.[1] ?? fallback;
	const description = paragraph
		.replace(/<[^>]+>/g, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ')
		.trim();

	if (description.length <= 160) return description;
	const breakpoint = description.lastIndexOf(' ', 157);
	return `${description.slice(0, breakpoint > 0 ? breakpoint : 157)}...`;
}
