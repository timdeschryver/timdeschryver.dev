// https://github.com/sveltejs/kit/issues/720
export const variables = {
	hash: import.meta.env.VITE_PUBLIC_HASH,
	creator_id: 'DT-MVP-5004452',
	twitterBearerToken: import.meta.env.VITE_PUBLIC_TWITTER_BEARER_TOKEN,
	basePath: import.meta.env.VITE_PUBLIC_BASE_PATH,
	timestamp: new Date(),
};
