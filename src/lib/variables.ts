// https://github.com/sveltejs/kit/issues/720
export const variables = {
	hash: import.meta.env.VITE_PUBLIC_HASH,
	creator_id: 'DT-MVP-5004452',
	twitterBearerToken: import.meta.env.VITE_PUBLIC_TWITTER_BEARER_TOKEN,
	basePath: import.meta.env.VITE_PUBLIC_BASE_PATH || 'https://timdeschryver.dev',
	timestamp: new Date(),
};

export function publicUrl(pathname = '') {
	if (!pathname) return variables.basePath;
	return `${variables.basePath.replace(/\/$/, '')}/${pathname.replace(/^\/+/, '')}`;
}
