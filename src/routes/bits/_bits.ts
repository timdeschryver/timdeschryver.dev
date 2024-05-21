import { ISODate } from '$lib/formatters';
import { parseFileToHtmlAndMeta, sortByDate, traverseFolder } from '$lib/markdown';

const bitsPath = 'bits';

const bits: {
	html: string;
	metadata: {
		title: string;
		slug: string;
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
		{} as { [directory: string]: { file: string; path: string }[] },
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
					date: ISODate(metadata.date),
					tags: tags.map((t) => t.toLowerCase()),
				},
			};
		})
		.sort(sortByDate);

	bits.push(...bitsSorted);
	return bitsSorted;
}
