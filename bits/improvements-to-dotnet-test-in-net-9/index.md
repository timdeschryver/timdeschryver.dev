---
title: Improvements to `dotnet test` in .NET9
slug: improvements-to-dotnet-test-in-net-9
date: 2024-04-09
tags: dotnet
---

# Improvements to `dotnet test` in .NET9

So far, the preview versions of .NET 9 have introduced two improvements to the `dotnet test` command.

- 💅 The output logs will use the new terminal logger by default, resulting in a better experience with **more clearly arranged output**. The terminal logger was [introduced in .NET 8](https://devblogs.microsoft.com/dotnet/announcing-dotnet-8-preview-4#msbuild-new-modern-terminal-build-output) as an opt-in alternative to the normal console logger. The new behavior uses the new terminal logger by default for environments that support this, and can be disabled using the `--tl:off` switch. For more information and the reasoning for this new behavior see [Terminal logger is default](https://learn.microsoft.com/en-us/dotnet/core/compatibility/sdk/9.0/terminal-logger)
- 🏎️ Test projects that hit different Target Frameworks will be run in parallel. This means that you will **receive the test results faster**. By default the number of parallel processes will be the number of processors on the computer, it can also be configured using the `-maxcpucount:N` switch.

This results in a better experience for developers and faster feedback loops when running tests.

![Running dotnet test in .NET 9](./images/video.mp4)

For more info about Unit Testing .NET 9 see the [documentation](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-9/overview#unit-testing).
