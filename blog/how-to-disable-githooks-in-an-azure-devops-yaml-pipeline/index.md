---
title: How to disable githooks in an Azure DevOps YAML Pipeline
slug: how-to-disable-githooks-in-an-azure-devops-yaml-pipeline
description: How to disable githooks in an Azure DevOps YAML Pipeline
date: 2022-10-07
tags: Azure DevOps, git
---

Just like many other projects, the project that I'm working on makes use of [githooks](https://git-scm.com/docs/githooks) to automate a few "things".
This includes a `pre-commit` hook to format the code and to verify (with a linter) that the code follows the project's guidelines.
Another hook that I've seen in a couple of projects is a `pre-push` hook to run the test suite before you can push your changes to the repository.

Besides these common githooks, there are many more use cases for using a git hook to automate common tasks that a developer might forget otherwise.
This can also be useful to onboard a developer to the team and the project guidelines. The alternative would be a documentation page, but we all know how much time we read the documentation.

The thing is that the described git hooks don't affect a Continuous Integration (CI) pipeline because the pipeline usually doesn't commit or push changes.
But, we recently introduced a `post-checkout` hook that runs a script to make sure that the project is in a good state.
After we pushed this change to the repository our CI pipeline started to fail because of several reasons that I won't be going into in this blog post.
Instead, I want to focus on how to disable a git hook in the CI pipeline because some githooks do not make a lot of sense in a pipeline.

As described in the husky docs (a library that can be used to manage git hooks), there are multiple ways to [disable a git hook](https://typicode.github.io/husky/#/?id=disable-husky-in-cidockerprod).

For me, the best implementation is to use the `CI` environment variable to prevent the git hook from executing.
In the updated script, the hook checks if the `CI` environment variable is set to `true`; if so, it skips the hook.

```sh{3}:.githooks/post-checkout
#!/bin/sh

[ -n "$CI" ] && exit 0

# Run a few scripts to make sure that the project is in a good state
```

This should work fine because the `CI` environment variable is often set to `true` by default.
But the problem within the context of Azure DevOps, is that an Azure DevOps pipeline doesn't set the `CI` environment variable.

As a fix, you can set the variable in the pipeline itself by using the [variables section](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/variables) in the YAML pipeline definition.

```yml{3-4}:azure-pipelines.yml
name: "1.0$(Rev:.r)"

variables:
  CI: true

stages:
  - stage: Build
    ...

  - stage: Release
    ...
```

The result is that the git hook is now disabled in the pipeline.
