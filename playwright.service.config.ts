import { defineConfig } from '@playwright/test';
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config';
import dotenv from 'dotenv';

dotenv.config();

/* Learn more about service configuration at https://aka.ms/mpt/config */
export default defineConfig(
	config,
	createAzurePlaywrightConfig(config, {
		exposeNetwork: '<loopback>',
		connectTimeout: 30000,
		os: ServiceOS.LINUX,
		credential: new DefaultAzureCredential(),
	}),
	{
		/*
		Playwright Testing service reporter is added by default.
		This will override any reporter options specified in the base playwright config.
		If you are using more reporters, please update your configuration accordingly.
		*/
		reporter: [['html', { open: 'never' }], ['@azure/playwright/reporter']],
	},
);
