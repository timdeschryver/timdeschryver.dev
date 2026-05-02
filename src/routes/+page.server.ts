import { getYearToDateRunningStats } from '$lib/server/strava';

export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	return {
		stravaRunning: await getYearToDateRunningStats(fetch),
	};
}
