import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import svelteParser from "svelte-eslint-parser";
import globals from 'globals';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
	...eslintPluginSvelte.configs['flat/recommended'],
	{
		rules: {
			'svelte/no-at-html-tags': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'all',
					argsIgnorePattern: '^_',
					caughtErrors: 'all',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
	{
		ignores: ['playwright-report', '.svelte-kit'],
	},
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
      parser: svelteParser,
			globals: {
				gtag: true,
				kofiWidgetOverlay: true,
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte'],
			},
		},
	},
);
