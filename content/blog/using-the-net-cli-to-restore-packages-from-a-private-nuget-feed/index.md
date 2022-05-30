---
title: Using the .NET CLI to restore packages from a private NuGet feed
slug: using-the-net-cli-to-restore-packages-from-a-private-nuget-feed
description: 'A fix for "Response status code does not indicate success: 401 (Unauthorized)"'
author: Tim Deschryver
date: 2021-07-25
tags: .NET, cli, NuGet
banner: ./images/banner.jpg
published: true
---

For the past years, I've been working in Visual Studio (the [2022 preview version](https://visualstudio.microsoft.com/vs/preview/vs2022/) is available), but recently I've given Visual Studio Code a shot. Transitioning between the two IDE's also means that you use the .NET CLI more extensively. Sadly, this was the cause of one annoying problem for me.

A couple of times a day, when I was trying to build a project, I bumped against the following error saying that I'm not authorized to access our private feed.

```sh
❯ dotnet build
Determining projects to restore...
[C:\Users\tdeschryver\dev\Project\Project\02.Services\ServiceOne\ServiceOne.Api.csproj]
C:\Program Files\dotnet\sdk\6.0.100-preview.6.21355.2\NuGet.targets(131,5): error : Unable to load the service index for source https://pkgs.dev.azure.com/org/project/_packaging/feed/nuget/v3/index.json. [C:\Users\tdeschryver\dev\Project\Project.sln]
C:\Program Files\dotnet\sdk\6.0.100-preview.6.21355.2\NuGet.targets(131,5): error : Response status code does not indicate success: 401 (Unauthorized). [C:\Users\tdeschryver\dev\Project\Project.sln]
```

This led to frustrations and was counter-productive.
As a work-around, I opened the project in Visual Studio to be authorized.

Some GitHub issues mentioned running the restore command with the interactive flag, but in my case, this ended up in the same error.

```sh
dotnet restore --interactive
```

After browsing through more GitHub issues, I found a comment that suggested installing the [Microsoft NuGet CredentialProvider](https://github.com/Microsoft/artifacts-credprovider#setup).

```sh
# On Windows
iex "& { $(irm https://aka.ms/install-artifacts-credprovider.ps1) }"
# On Linux
wget -qO- https://aka.ms/install-artifacts-credprovider.sh | bash
```

To my satisfaction, the error was finally gone.
