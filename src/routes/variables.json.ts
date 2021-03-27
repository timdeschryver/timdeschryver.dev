export function get() {
	return {
		body: {
			gtag_id: import.meta.env.VITE_PUBLIC_GA_TRACKING_ID || '',
			headers: {
				'Cache-Control': `max-age=0, s-max-age=${600}` // 10 minutes
			}
		}
	};
}
