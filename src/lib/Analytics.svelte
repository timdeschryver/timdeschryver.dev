<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { dev, browser } from '$app/environment';
	import TelemetryDeck from '@telemetrydeck/sdk';
	import { variables } from './variables';

	function getClientUser(): string {
		if (!browser) {
			return 'ssr-fallback';
		}

		const storageKey = 'telemetry-client-user';
		let clientUser = localStorage.getItem(storageKey);

		if (!clientUser) {
			clientUser = crypto.randomUUID();
			localStorage.setItem(storageKey, clientUser);
		}

		return clientUser;
	}

	const td = new TelemetryDeck({
		appID: variables.analytics_id,
		clientUser: getClientUser(),
		testMode: dev,
	});

	let lastPath: string | null = null;

	afterNavigate(({ to }) => {
		if (to.url.pathname === lastPath) {
			return;
		}
		lastPath = to.url.pathname;
		const payload = {
			title: document.title,
			url: location.href,
			path: to.url.pathname,
			referrer: document.referrer,
			locale: navigator.language,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		};

		td.signal('pageview', payload);
	});
</script>
