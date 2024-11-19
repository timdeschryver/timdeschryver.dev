---
title: Resolving a failing NX post-install
slug: resolving-a-failing-nx-post-install
description: Help! My build randomly fails during the post install step of NX with exit code 135. In this post I'll show you how I solved this issue.
date: 2024-11-19
tags: NX
---

After migration our build pipelines to GitHub Actions, we started to see randomly failing build steps with the following error message:

```bash
error /home/runner/work/platform/platform/node_modules/@angular-eslint/builder/node_modules/nx, /home/runner/work/platform/platform/node_modules/@angular-eslint/schematics/node_modules/nx: Command failed.
Exit code: 135
Command: node ./bin/post-install
Arguments:
Directory: /home/runner/work/platform/platform/node_modules/@angular-eslint/builder/node_modules/nx
Output:
Bus error (core dumped)
Error: Process completed with exit code 135.
```

Looking at the error it's clear that the post-install step of the `nx` package is the cause of the problem.
Sadly, the error message is not very helpful...
I tried to find more information about the error code 135, but I couldn't find anything useful.

At first, I thought it was an issue on nx's side and that an update to the latest version would help.
But alas, after updating to the latest version of `nx`, the problem was still there.

Retriggering the build fixed the problem, but it was not a reliable solution and caused some delays while creating and reviewing pull requests.

## A potential workaround

After browsing though the GitHub issues I noticed [we weren't the only ones experiencing this issue](https://github.com/nrwl/nx/issues?q=is:issue%20state:open%20%22Postinstall%20script%22).
A popular workaround mentioned in the comments is to change the install script to skip the post-install step using the `--ignore-scripts` flag.

```bash
yarn --frozen-lockfile --ignore-scripts
npm ci --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

While this a solution, I don't like the idea of skipping the post-install step.
In scenarios where a post-install step is crucial, this workaround is not be an option.
I also thought NX relies on this step for a reason, so skipping it might cause other issues down the line, which I wanted to avoid.

## The better solution

It was only after running `npm ls nx` that I noticed different versions of `nx` were installed in the project (through dependencies).

:::note
The [npm-ls](https://docs.npmjs.com/cli/v7/commands/npm-ls) command will print to stdout all the versions of packages that are installed, as well as their dependencies when --all is specified, in a tree structure.
:::

```bash
+-- @angular-eslint/builder@18.0.1
| +-- @nx/devkit@19.1.2
| | `-- nx@19.1.2 deduped
| `-- nx@19.1.2
|   `-- @nrwl/tao@19.1.2
|     `-- nx@19.1.2 deduped
+-- @angular-eslint/schematics@18.0.1
| +-- @nx/devkit@19.1.2
| | `-- nx@19.1.2 deduped
| `-- nx@19.1.2
|   `-- @nrwl/tao@19.1.2
|     `-- nx@19.1.2 deduped
+-- @nx/angular@19.8.0
| `-- @nx/devkit@19.8.0
|   `-- nx@19.8.0 deduped
+-- @nx/workspace@19.8.0
| `-- nx@19.8.0 deduped
`-- nx@19.8.0
  `-- @nrwl/tao@19.8.0
    `-- nx@19.8.0 deduped
```

After making sure our project and its dependencies were using the same version of `nx`, the problem disappeared.
I expect the issue was caused by the different versions of `nx` that started multiple concurrent processes to run the post-install step at the same time, which were locking each other up.
