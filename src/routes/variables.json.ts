export function get() {
	return {
		body: {
			gtag_id: import.meta.env.VITE_PUBLIC_GA_TRACKING_ID || ''
		}
	};
}
