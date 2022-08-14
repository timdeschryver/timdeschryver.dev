import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 1,
	timeout: 60_000,
	outputDir: 'test-results',
	testDir: 'tests',
	reporter: 'html',
	use: {
		trace: 'on-first-retry',
	},
	...(process.env.CI
		? {}
		: {
				webServer: {
					command: 'npm run build && npm run preview',
					port: 5173,
					reuseExistingServer: !process.env.CI,
				},
		  }),
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		// {
		// 	name: 'webkit',
		// 	use: { ...devices['Desktop Safari'] },
		// },
	],
};
export default config;
