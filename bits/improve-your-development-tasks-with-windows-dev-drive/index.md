---
title: Improve your development tasks with Windows Dev Drive
slug: improve-your-development-tasks-with-windows-dev-drive
date: 2023-12-26
tags: productivity, developer-experience
---

# Improve your development tasks with Windows Dev Drive

If you know me, you know that I like to fully optimize my workflow, and a Dev Drive helps to improve it.

A Dev Drive is a virtual drive (using the ReFS technology) that speeds up file-related tasks.
This makes it ideal for many daily development related jobs such as building applications, installing packages, running test suites, and so on.

I find that this is the ideal time of the year to make changes before hitting the ground again because you'll benefit from this for the rest of the upcoming year.
That's why I recommend you to take a look at a Dev Drive, since it just takes a moment to [set up a Dev Drive on Windows](https://learn.microsoft.com/en-us/windows/dev-drive).

Here's a comparison after migrating my projects and cache locations (for NuGet and npm) to a Dev Drive.
As you can notice, all of the commands that I use frequently have **improved by 20% to 25%**.

| Command             | Time - NTFS | Time - Dev Drive | Improvement |
| ------------------- | ----------- | ---------------- | ----------- |
| dotnet build (cold) | 9.362ms     | 7.195ms          | 23.1%       |
| dotnet build (hot)  | 23.11ms     | 1.856ms          | 19.7%       |
| ng build            | 23.803ms    | 17.648ms         | 25.9%       |
| npm ci              | 56.951ms    | 43.387ms         | 23.8%       |

Check it out and see the difference for yourself!

:::note
The performance improvements from my experience matches with the numbers that are shared in the [Dev Drive: Performance, Security and Control for Developers](https://blogs.windows.com/windowsdeveloper/2023/06/01/dev-drive-performance-security-and-control-for-developers/) article.
:::

I also found [Maarten Balliauw](https://twitter.com/maartenballiauw)'s blog [Test-Driving Windows 11 Dev Drive for .NET](https://blog.maartenballiauw.be/post/2023/11/22/test-driving-windows-11-dev-drive-for-dotnet.html) helpful and easy to follow, it also contains useful scripts to automate the migration.

For more Windows tips and tricks to improve your development workflow, see [How I've set up my new Windows development environment in 2022](../../blog/how-i-have-set-up-my-new-windows-development-environment-in-2022).
