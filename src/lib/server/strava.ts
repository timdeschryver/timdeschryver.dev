import { env } from '$env/dynamic/private';

export type StravaRunningStats = {
	kilometers: number;
	totalHours: number | null;
	year: number;
	updatedAt: string;
};

type Fetch = typeof globalThis.fetch;

export async function getYearToDateRunningStats(
	fetcher: Fetch,
): Promise<StravaRunningStats | null> {
	const clientId = env.STRAVA_CLIENT_ID;
	const clientSecret = env.STRAVA_CLIENT_SECRET;
	const refreshToken = env.STRAVA_REFRESH_TOKEN;

	if (!clientId || !clientSecret || !refreshToken) {
		return null;
	}

	try {
		const accessToken = await getAccessToken(fetcher, clientId, clientSecret, refreshToken);
		const athleteId = await getAthleteId(fetcher, accessToken);
		const stats = await getAthleteStats(fetcher, accessToken, athleteId);
		const ytdRunTotals = getRecord(stats, 'ytd_run_totals');
		const distance = ytdRunTotals?.distance;
		const movingTime = ytdRunTotals?.moving_time;

		if (typeof distance !== 'number') {
			throw new Error('Strava did not return year-to-date run distance.');
		}

		return {
			kilometers: Number((distance / 1000).toFixed(1)),
			totalHours: typeof movingTime === 'number' ? Number((movingTime / 60 / 60).toFixed(1)) : null,
			year: new Date().getFullYear(),
			updatedAt: new Date().toISOString(),
		};
	} catch (error) {
		console.warn('Unable to load Strava running stats.', error);
		return null;
	}
}

async function getAccessToken(
	fetcher: Fetch,
	clientId: string,
	clientSecret: string,
	refreshToken: string,
) {
	const token = await getJson(fetcher, 'https://www.strava.com/oauth/token', {
		method: 'POST',
		body: new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'refresh_token',
			refresh_token: refreshToken,
		}),
	});

	if (!isRecord(token) || typeof token.access_token !== 'string') {
		throw new Error('Strava did not return an access token.');
	}

	return token.access_token;
}

async function getAthleteId(fetcher: Fetch, accessToken: string) {
	const athlete = await getJson(fetcher, 'https://www.strava.com/api/v3/athlete', {
		headers: getAuthorizationHeader(accessToken),
	});

	if (!isRecord(athlete) || typeof athlete.id !== 'number') {
		throw new Error('Strava did not return an athlete id.');
	}

	return athlete.id;
}

async function getAthleteStats(fetcher: Fetch, accessToken: string, athleteId: number) {
	return getJson(fetcher, `https://www.strava.com/api/v3/athletes/${athleteId}/stats`, {
		headers: getAuthorizationHeader(accessToken),
	});
}

async function getJson(fetcher: Fetch, url: string, init: RequestInit) {
	const response = await fetcher(url, {
		...init,
		signal: AbortSignal.timeout(10_000),
	});

	if (!response.ok) {
		throw new Error(`Strava request failed with status ${response.status}.`);
	}

	return response.json() as Promise<unknown>;
}

function getAuthorizationHeader(accessToken: string) {
	return {
		Authorization: `Bearer ${accessToken}`,
	};
}

function getRecord(value: unknown, key: string) {
	if (!isRecord(value)) {
		return null;
	}

	const child = value[key];
	return isRecord(child) ? child : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
