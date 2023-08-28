---
title: Git Log Heatmap
slug: git-log-heatmap
date: 2023-08-22
tags: git
---

# Git Log Heatmap

Use [`git log`](https://git-scm.com/docs/git-log) to create a heatmap of the files that have been changed the most frequently within a repository.
This is useful to identify the files that most likely need a closer look.
For example, the file contains too much logic and should be split up into multiple files, it contains hot code paths that change frequently, or maybe it's a file with a history of many fixes.

The following `git log` command returns a list of files (excluding `json` and `lock` files) that have been changed within the last 6 months, sorted by the number of changes.

:::code-group

```powershell [title=PowerShell Variant]
git log --since 6.months.ago --pretty=format: --name-only `
    | Where-Object { ![string]::IsNullOrEmpty($_) } `
    | ?{$_ -notmatch ".(json|lock)$" } `
    | Sort-Object `
    | Group-Object `
    | Sort-Object -Property Count -Descending `
    | Select-Object -Property Count, Name -First 25
```

```bash [title=Bash Variant]
git log --since 6.months.ago --pretty=format: --name-only  \
    | sed '/^\s*$/'d \
    | grep -v -E '*\.(json|lock)$' \
    | sort \
    |  uniq -c \
    |  sort -nr  \
    | head -n 25
```

:::
