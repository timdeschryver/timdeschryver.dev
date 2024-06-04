---
title: Interacting with GitHub through the GitHub CLI
slug: interacting-with-github-through-the-github-cli
date: 2024-06-04
tags: developer-experience, productivity, devtools
---

# Interacting with GitHub through the GitHub CLI

Throughout the last few years, GitHub has provided us with more and more tools that improve the experience with their platform.
The development never stops, and new features are added frequently. This can be seen in the GitHub UI, but it reaches more than that.

One of the tools that I use daily is the [GitHub CLI](https://cli.github.com/).
The GitHub CLI is a command-line tool that brings GitHub directly to your terminal and enables you to interact with GitHub through various commands.

For me, the GitHub CLI makes contributing to open-source projects simpler and faster.
For most of the tasks, the CLI provides a single command that can be used to perform the task, which otherwise could require multiple steps.
The commands are easy to remember and are also suggested via the GitHub UI, which makes it easier to get started.

Here are some of the commands that I use frequently:

```bash
# Open the current repository in the browser
gh browse

# Checkout a pull request
gh pr checkout 47

# Create a pull request or issue
gh pr/issue create

# Sync a forked repository with the upstream repository
gh repo sync OWNER/REPO

# Interact with GitHub Copilot via the CLI
gh copilot suggest/explain "Undo the last commit"
```

Of course, there are many more commands available, to explore them see the [GitHub CLI documentation](https://cli.github.com/manual/gh/).
To take it a step further, you can also create extensions for it. An example is the [gh dash](https://github.com/dlvhdr/gh-dash), which provides a dashboard for your pull requests and issues in which you're participating. Instead of using the commands to query issues or repositories, you can use the dashboard to get a nice visual overview.

Besides using the GitHub CLI with GitHub, I'm catching myself using the `gh copilot` command more and more.
This command uses [GitHub Copilot](https://copilot.github.com/) to answer your questions and generate commands that can be executed or copied.
I find it a useful way to learn new commands or to get a quick reminder of how to use a command.

To bring the power of the GitHub CLI to your IDE, you can also install GitHub extensions for your favorite IDE.
These will make it easier to review pull requests directly from your IDE.

For one-off tasks while working in repositories you don't frequently visit, a [GitHub codespace](https://github.com/features/codespaces) is a great way to quickly spin up a (pre-configured) development environment with all the tools that are required.
