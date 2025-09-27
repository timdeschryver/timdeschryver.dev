// https://github.com/sveltejs/kit/issues/720
export const variables = {
	gtag_id: import.meta.env.VITE_PUBLIC_GA_TRACKING_ID,
	analytics_id: import.meta.env.VITE_PUBLIC_ANALYTICS_ID,
	hash: import.meta.env.VITE_PUBLIC_HASH,
	creator_id: 'DT-MVP-5004452',
	twitterBearerToken: import.meta.env.VITE_PUBLIC_TWITTER_BEARER_TOKEN,
	basePath: import.meta.env.VITE_PUBLIC_BASE_PATH,
	timestamp: new Date(),
};
