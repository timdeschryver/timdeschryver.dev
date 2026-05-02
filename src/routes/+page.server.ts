import * as fs from 'fs';
import { getYearToDateRunningStats } from '$lib/server/strava';
import { getYearToDateCommits } from '$lib/server/github';
import { extractFrontmatter } from '$lib/content';
import { readPostSummaries } from './blog/_posts';

const WORDS_PER_MINUTE = 200;

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	const year = new Date().getFullYear();

	const [stravaRunning, githubStats, allPosts] = await Promise.all([
		getYearToDateRunningStats(fetch),
		getYearToDateCommits(fetch),
		readPostSummaries(),
	]);

	const postsThisYear = allPosts.filter(
		(post) => new Date(post.metadata.date).getFullYear() === year,
	);

	const totalWords = postsThisYear.reduce((sum, post) => {
		try {
			const raw = fs.readFileSync(`blog/${post.metadata.slug}/index.md`, 'utf-8');
			const { content } = extractFrontmatter(raw);
			const words = content.trim().split(/\s+/).length;
			return sum + words;
		} catch {
			return sum;
		}
	}, 0);

	return {
		stravaRunning,
		githubStats,
		blogPostsThisYear: postsThisYear.length,
		blogReadingMinutes: Math.round(totalWords / WORDS_PER_MINUTE),
		year,
	};
}
