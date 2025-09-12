export interface TOC {
	description: string;
	level: number;
	slug: string;
}

export interface SeriesPost {
	slug: string;
	title: string;
	order: number;
	current: boolean;
}

export interface BlogSeries {
	name: string;
}
