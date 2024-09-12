---
title: My recommendations to configure Visual Studio Code for Angular Development
slug: my-recommendations-to-configure-visual-studio-code-for-angular-development
description: Enhance your development experience by installing (the right) extensions and settings to help you write consistent code in a pleasant way.
date: 2024-09-12
tags: Angular, VSCode, developer-experience
---

As developers, we spend a lot of time in our editor, so it's important to configure it to our liking.
Setting up your editor correctly is an important step to improve your development workflow.

Throughout the years I've learned some tips and tricks to enhance my Visual Studio Code (VSCode) setup.
In this article, I'll show you how to configure VSCode to optimize (imho) specifically for your Angular development process.

## Extensions

What makes VSCode so powerful is its extensibility. There are thousands of extensions available in the marketplace that can help to optimize your development workflow.
Here are some recommended extensions for Angular development.

To install an extension, open the Extensions view by pressing `Ctrl+Shift+X` or `⇧⌘X`, or click the extension icon in the sidebar.
Then, search for the extension by name and click the install button.

### Angular Language Service

The Angular Language Service is the most important extension because it provides a rich editing experience for Angular templates.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=Angular.ng-template)_

### ESLint

[ESLint](https://eslint.org/) is a static code analysis tool for identifying problematic patterns found in code. This extension provides a quick feedback loop to help you write code that adheres to your team's coding standards.
The ESLint extension also works with Typescript ESLint and Angular ESLint, the recommended linter for Angular projects. The result is a consistent linting experience across your entire project, including your TypeScript and HTML files.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)_

### Prettier

Many teams use [Prettier](https://prettier.io) to enforce a consistent code style.
Use this extension to format your code automatically.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)_

### Auto Rename Tag

This extension automatically renames paired HTML tags when you rename one of them.
For me, this extension is a real time-saver.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)_

### Nx Console

A no-brainer if you are using [Nx](https://nx.dev) to manage your Angular workspace.
Use this extension to get a useful overview of the workspace, with the ability to run commands and scripts. Directly from within VSCode.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)_

### Pretty TypeScript Errors

Make TypeScript errors prettier and human-readable with this extension.
TypeScript errors are better formatted, include syntax highlighting, and include links to the documentation for more information, making it easier to read, understand, and fix the error.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)_

### Angular-switcher

This extension provides a quick way to navigate between the different files that make up an Angular component, `*.ts`, `*.html`, and `*.scss` files.

_[Marketplace](https://marketplace.visualstudio.com/items?itemName=infinity1207.angular2-switcher)_

:::note
You can also take a look at the [Angular Extension Pack](https://marketplace.visualstudio.com/items?itemName=loiane.angular-extension-pack), created by [Loiane Groner](https://loiane.com/). This package includes multiple extensions that are useful for Angular development. Most of them are already included in the list above.
:::

## Settings

Set the following settings to improve your development experience.
These settings are on a user level, for every project (or file) you open in VSCode.

To access the settings, open the Command Panel by pressing `Ctrl+Shift+P` or `⇧⌘P` to open the settings UI.
Search (using the search bar at the top) for the following settings and set them to the recommended values.

- Editor: Format On Save (`editor.formatOnSave`), instead of invoking the formatter manually, VSCode can format the code automatically when a file is saved.
- Editor: Default Formatter (`editor.defaultFormatter`), to use Prettier as the default formatter.
- Prettier: Require Config (`prettier.requireConfig`), to enforce the use of a configuration file.

To set settings for specific languages, you can use the language identifier. For example, to set the formatter specifically for TypeScript files, prefix the search term with `@lang:typescript`.

You can also edit the settings via the settings file.
Press `Ctrl + P` or `Cmd + P` to open the settings file.

```json:settings.json
{
	// Format the code automatically when you save the file
	"editor.formatOnSave": true, // Set the default formatter to Prettier
	"editor.defaultFormatter": "esbenp.prettier-vscode", // It's also possible to set the default formatter for specific languages
	"[typescript]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode"
	},
	"[markdown]": {
		"editor.wordWrap": "on",
		"editor.renderWhitespace": "all"
	}, // Disallow formatting without a configuration file
	"prettier.requireConfig": true, // Associate 'custom' file extensions to a better-known language to improve the highlighting and formatting
	"files.associations": {
		"*.jsonc": "json"
	}
}
```

## Enforce the setup across the team

Not every team member will be motivated or aware to properly configure their editor.
To enforce the setup across the team, you can use [workspace settings](https://code.visualstudio.com/docs/getstarted/settings#_workspace-settings).
This benefits the whole team, helping everyone to work more efficiently.

Start by adding the `.vscode\extensions.json` file to your workspace to prompt developers to install the recommended extensions.
For more information, see [Workspace recommendations extensions](https://code.visualstudio.com/docs/editor/extension-marketplace#_workspace-recommended-extensions).

As an example, here's how you can configure the workspace to recommend the [extensions mentioned](#extensions) above.

```json:.vscode\extensions.json
{
	"recommendations": [
		"Angular.ng-template",
		"dbaeumer.vscode-eslint",
		"esbenp.prettier-vscode",
		"formulahendry.auto-rename-tag",
		"yoavbls.pretty-ts-errors",
		"infinity1207.angular2-switcher"
	]
}
```

To apply the use of certain settings, add the `.vscode\settings.json` file to your workspace.
In the file, you can add the same configuration as the user settings, but with the added benefit that these settings are applied to all developers working on the project.

```json:.vscode\settings.json
{
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"diffEditor.ignoreTrimWhitespace": true
}
```

Note that not all settings can be included (for security reasons), and keep in mind that these settings override the user settings.

## Learn how to work with Visual Studio Code

I can't emphasize enough how important it is to learn the ins and outs of your editor.
From my experience, I can acknowledge that investing time in learning your editor will pay off in the long run.
Once you master your IDE, tasks that otherwise take some minutes (and frustration) will become easy and fast.

An important part of this is learning keyboard shortcuts to quickly navigate and perform actions in the editor.
This also includes your mouse to perform multi-cursor actions, for example, a multi-cursor selection.

This will come over time, but the following cheat sheets can help you get started.

- [Windows Cheat Sheet](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf)
- [Mac Cheat Sheet](https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf)

Some of my favorite shortcuts, besides the obvious ones, are the following:

- `Ctrl+P` or `Ctrl+E` to open the file explorer with recent files, I recently learned about this and can't work without it anymore. You can also use it to open a file by typing parts of the filename. While searching for files use partial file names (or capital letters) to filter the results, this is a lot quicker than typing the full name of the file.
- `Ctrl+D` to select the next occurrence of the current selection
- `Ctrl+Shift+L` to select all occurrences of the current selection, makes it easy to rename multiple variables at once
- `Ctrl+X` to cut the current line, or `Ctrl+Shift+K` to delete the current line
- `Alt+Up` and `Alt+Down` to move the current line up or down
- `Ctrl+Shift+\` to jump to the matching bracket
- `Middle mouse button` to vertically add a cursor selection across multiple lines

Also, make sure to learn how to use the refactoring tools (e.g. quick actions) with `Ctrl+.` to quickly restructure code.
Other shortcuts that are worthy of mentioning while editing code:

- `F2` to rename a symbol
- `F12` to go to the definition and `Ctrl+F12` to peek the definition (show it inline)
- `Shift+F12` to find all references to the symbol

## Conclusion

In this article, I showed you how to configure Visual Studio Code for optimal (imho) Angular development.
By installing the recommended extensions and tweaking a few settings you can enhance your workflow, making it more efficient and enjoyable.
I find this important because we spend a lot of time in our editor(s), so it's in your best interest to make it as comfortable as possible.
