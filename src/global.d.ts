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
