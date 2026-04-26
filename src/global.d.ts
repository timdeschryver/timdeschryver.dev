/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />

declare global {
	let kofiWidgetOverlay: {
		draw: (name: string, config: Record<string, string>) => void;
	};
}

export {};
