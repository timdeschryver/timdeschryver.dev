import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 1,
	timeout: 120_000,
	use: {
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'npm run preview',
		port: 3000,
		reuseExistingServer: !process.env.CI,
	},
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
