---
title: Directory.Packages.props, a solution to unify your NuGet package versions
slug: directorypackagesprops-a-solution-to-unify-your-nuget-package-versions
description: The Consolidate view is dead, long live `Directory.Packages.props`. Use the `Directory.Packages.props` file to define your NuGet package versions in a single file.
author: Tim Deschryver
date: 2022-04-18
tags: .NET, csharp, NuGet
---

When a .NET solution contains multiple projects it can get difficult to manage all of the dependencies on NuGet packages.
Different projects can reference the same NuGet package, but each project can individually require a different version of that package. This isn't "clean", and in some cases, this can result in errors.

These discrepancies can be resolved by using the Consolidate view, which is available via the "Manage NuGet packages for solution" option. But from my experience, this was not the most straightforward way because it was slow and it frequently also missed to update all the references. This is why I usually updated the references manually by looking for the package name in `*.csproj` files and updated the version by hand. An alternative is to use 3rd party tools like [Paket](https://fsprojects.github.io/Paket/), a dependency manager for .NET projects.

But, no more of that.
The Consolidate view is dead, long live `Directory.Packages.props`.

`Directory.Packages.props` is a new way to manage NuGet packages in .NET solutions. It's a single centralised file that is used to manage all the NuGet package versions in a solution and is shared across the .NET projects.

To use the new unified way, create a file called `Directory.Packages.props` at the root of your project.
The content of this file should look familiar to your `*.csproj` files, with the difference that it only contains the NuGet packages with their corresponding versions.

```xml
<Project>
    <ItemGroup>
        <PackageReference Include="PackageOne" Version="6.2.3" />
        <PackageReference Include="PackageTwo" Version="6.0.0" />
        <PackageReference Include="PackageThree" Version="2.4.1" />
    </ItemGroup>
</Project>
```

Once you've created this file, remove all the versions from the `PackageReference` tags in your `*.csproj` files and you're good to go.

```diff
<Project>
    <ItemGroup>
-       <PackageReference Include="PackageOne" Version="6.2.3" />
+       <PackageReference Include="PackageOne" />
    </ItemGroup>
</Project>
```

Good to knows:

- A project can contain multiple `Directory.Packages.props` files, in this case, the file that is the closest to the solution is used.
- If needed, you can override a specific version with the `VersionOverride` attribute.

For more info, see the release post, [Introducing Central Package Management](https://devblogs.microsoft.com/nuget/introducing-central-package-management/).
