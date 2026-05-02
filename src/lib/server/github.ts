import { env } from '$env/dynamic/private';

export type GitHubStats = {
	totalCommits: number;
	repositoryCount: number | null;
	year: number;
};

type Fetch = typeof globalThis.fetch;

export async function getYearToDateCommits(fetcher: Fetch): Promise<GitHubStats | null> {
	const token = env.GH_PERSONAL_TOKEN;

	if (!token) {
		return null;
	}

	const year = new Date().getFullYear();
	const from = `${year}-01-01T00:00:00Z`;
	const to = new Date().toISOString();

	const commitStatsQuery = `
		query($from: DateTime!, $to: DateTime!) {
			viewer {
				contributionsCollection(from: $from, to: $to) {
					totalCommitContributions
					restrictedContributionsCount
				}
			}
		}
	`;

	const repositoryCountQuery = `
		query($from: DateTime!, $to: DateTime!) {
			viewer {
				contributionsCollection(from: $from, to: $to) {
					totalRepositoriesWithContributedCommits
				}
			}
		}
	`;

	try {
		const [totalCommits, repositoryCount] = await Promise.allSettled([
			getTotalCommits(fetcher, token, commitStatsQuery, { from, to }),
			getRepositoryCount(fetcher, token, repositoryCountQuery, { from, to }),
		]);

		if (totalCommits.status === 'rejected') {
			throw totalCommits.reason;
		}

		if (repositoryCount.status === 'rejected') {
			console.warn('Unable to load GitHub repository count.', repositoryCount.reason);
		}

		return {
			totalCommits: totalCommits.value,
			repositoryCount: repositoryCount.status === 'fulfilled' ? repositoryCount.value : null,
			year,
		};
	} catch (error) {
		console.warn('Unable to load GitHub commit stats.', error);
		return null;
	}
}

async function getTotalCommits(
	fetcher: Fetch,
	token: string,
	query: string,
	variables: Record<string, string>,
): Promise<number> {
	const data = await fetchGitHubGraphQL(fetcher, token, query, variables);
	const contributions = getContributionsCollection(data);
	const totalCommitContributions = contributions?.totalCommitContributions;
	const restrictedContributionsCount = contributions?.restrictedContributionsCount;

	if (
		typeof totalCommitContributions !== 'number' ||
		typeof restrictedContributionsCount !== 'number'
	) {
		throw new Error(
			`GitHub did not return commit contributions. Response: ${JSON.stringify(data)}`,
		);
	}

	return totalCommitContributions + restrictedContributionsCount;
}

async function getRepositoryCount(
	fetcher: Fetch,
	token: string,
	query: string,
	variables: Record<string, string>,
): Promise<number> {
	const data = await fetchGitHubGraphQL(fetcher, token, query, variables);
	const contributions = getContributionsCollection(data);
	const repositoryCount = contributions?.totalRepositoriesWithContributedCommits;

	if (typeof repositoryCount !== 'number') {
		throw new Error(
			`GitHub did not return contributed repository count. Response: ${JSON.stringify(data)}`,
		);
	}

	return repositoryCount;
}

async function fetchGitHubGraphQL(
	fetcher: Fetch,
	token: string,
	query: string,
	variables: Record<string, string>,
): Promise<unknown> {
	const response = await fetcher('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query, variables }),
		signal: AbortSignal.timeout(10_000),
	});

	if (!response.ok) {
		throw new Error(`GitHub API request failed with status ${response.status}.`);
	}

	const json = (await response.json()) as { data?: unknown; errors?: unknown[] };

	if (json.errors) {
		console.warn('GitHub GraphQL partial errors:', JSON.stringify(json.errors));
	}

	return json.data;
}

function getContributionsCollection(data: unknown): Record<string, unknown> | null {
	const viewer = getRecord(data, 'viewer');
	return getRecord(viewer, 'contributionsCollection');
}

function getRecord(value: unknown, key: string): Record<string, unknown> | null {
	if (!isRecord(value)) {
		return null;
	}
	const child = value[key];
	return isRecord(child) ? child : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
