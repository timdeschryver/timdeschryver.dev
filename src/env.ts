import { defineEnvVars } from '@sveltejs/kit/env';

// All optional: the GitHub and Strava stats are skipped when these are empty
export const variables = defineEnvVars({
	GH_PERSONAL_TOKEN: { schema: (input) => input ?? '' },
	STRAVA_CLIENT_ID: { schema: (input) => input ?? '' },
	STRAVA_CLIENT_SECRET: { schema: (input) => input ?? '' },
	STRAVA_REFRESH_TOKEN: { schema: (input) => input ?? '' },
});
