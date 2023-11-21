---
title: NuGet Central Package Management
slug: nuget-central-package-management
date: 2023-11-21
tags: dotnet
---

# NuGet Central Package Management

When you've worked in a mono-repository that contains multiple C# projects, you've probably felt the pain of maintaining NuGet dependencies.
Updating packages to a newer version, keeping versions in sync across different projects, removing outdated dependencies, ...

With Central Package Management (CPM) this daunting task becomes easier to manage.
By creating a file `Directory.Packages.props` within the root of the project, all NuGet package references can be defined with their corresponding version.

Next, the version of the package references that are defined within the project (`.csproj`) files can be removed.

:::code-group

```xml Directory.Packages.props [title=Directory.Packages.props]
<Project>
  <PropertyGroup>
    <!-- Enable Central Package Management -->
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <!-- Notice that this uses a PackageVersion (and not a PackageReference) -->
    <PackageVersion Include="PackageOne" Version="4.0.7" />
    <PackageVersion Include="PackageTwo" Version="5.0.0" />
    <PackageVersion Include="PackageThree" Version="2.1.0" />
  </ItemGroup>
</Project>
```

```diff ProjectOne.csproj [title=ProjectOne.csproj]
<Project Sdk="Microsoft.NET.Sdk">
    <ItemGroup>
-        <PackageReference Include="PackageOne" Version="4.0.7" />
+        <PackageReference Include="PackageOne" />
    </ItemGroup>
</Project>
```

:::

The result is a file that contains the single source of truth when it comes to your package versions.

You can still override versions for one-off cases, or subdivide this file into multiple files.
For more info about CPM, see the [documentation](https://learn.microsoft.com/en-us/nuget/consume-packages/central-package-management).
