/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />

declare let gtag: (...args) => void;
declare let kofiWidgetOverlay: {
	draw: (name: string, config: Record<string, string>) => void;
};

interface ImportMetaEnv {
	VITE_PUBLIC_BASE_PATH: string;
	VITE_PUBLIC_GA_TRACKING_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare global {
	interface ViewTransition {
		updateCallbackDone: Promise<void>;
		ready: Promise<void>;
		finished: Promise<void>;
		skipTransition: () => void;
	}

	interface Document {
		startViewTransition(updateCallback: () => Promise<void>): ViewTransition;
	}
}
