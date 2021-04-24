/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />
declare let gtag: (...args) => void;

interface ImportMetaEnv {
	VITE_PUBLIC_BASE_PATH: string;
	VITE_PUBLIC_GA_TRACKING_ID: string;
}
