---
title: How to quickly open a GitHub repository within an IDE
slug: how-to-quickly-open-a-github-repository-within-an-ide
date: 2023-10-17
tags: devtools
---

# How to quickly open a GitHub repository within an IDE

As developers, we read more code than we write.

We don't only read our own code that we wrote ourselves, or the code from our project, but we also come in contact with code from 3rd parties.

Personally, I like to browse through code to learn or to investigate a behavior or problem that I encountered.
While doing so it's useful to be in a comfort zone where you already know how to navigate within the code base to find the thing that you're looking for.

The GitHub interface has improved in the last couple of years, but it isn't the same as using an IDE.
An IDE has the advantage that it's smarter.
It can, for example, show all the references, go to the implementation with a simple click, and more.

To have that familiar IDE experience without having to clone or download the repository locally, which can be time-consuming especially if you don't have all the dependencies installed, there are a few options.

Here are the ones that I like to use, to quickly open a codebase within a web-editor to have that familiar IDE experience.
As a side note: all of them are powered by Visual Studio Code.

- use https://github.dev/USERNAME/REPOSITORY_NAME (or simply press the `.` key in a repository, or in a Pull Request) to open up a lightweight Visual Studio Code in the browser. This is useful to navigate and edit code, but you won't be able to execute scripts/commands.
- use https://stackblitz.com/github/USERNAME/REPOSITORY_NAME to open the codebase within [StackBlitz](https://stackblitz.com/). Useful to play with some code or to quickly test something out. Focused on Node.js environments. StackBlitz also has a specific Pull Request explorer via [pr.new](https://developer.stackblitz.com/codeflow/using-pr-new).
- use https://codesandbox.io/s/github/USERNAME/REPOSITORY_NAME (or append `box` to the github url => https://githubbox.com/USERNAME/REPOSITORY_NAME) to open the codebase within [CodeSandbox](https://codesandbox.io/). Similar to StackBlitz but supports more languages. Codesandbox also has a [GitHub Action](https://github.com/apps/codesandbox) to quickly review a Pull Request.
- use [GitHub Codespaces](https://github.com/features/codespaces) to create a dev environment, it's also possible to open this environment locally in your favorite IDE. Codespaces can do everything that you can do locally.
