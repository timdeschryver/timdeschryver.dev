---
title: Integrating Tailwind CSS in Blazor
slug: integrating-tailwind-css-in-blazor
description: In this post, you learn how to set up Tailwind CSS in a Blazor application, how to optimize the development experience, and how to minify the CSS file in a production environment.
date: 2024-06-27
tags: .NET, Blazor, Tailwind CSS
---

If you're on this page, you're probably already familiar with [Tailwind CSS](https://tailwindcss.com/), a utility-first CSS framework, and you're looking to integrate it into your Blazor application.
Therefore I won't waste your time with an introduction to Tailwind CSS, but I'll directly jump into the good stuff.

## Installation and initialization of Tailwind CSS

To get started, you need to install the Tailwind CSS package, the quickest way to do this is by using the Tailwind CLI with `npm` (through `npx`).

```bash
npx tailwindcss init
```

This command creates a `tailwind.config.js` file in the root of your project, with an empty configuration.

```js:tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Configuring Tailwind for Blazor

The `tailwind.config.js` file is where you can configure Tailwind CSS to your needs.
For example, you can add custom colors, fonts, or extend the default theme.

The important part is the `content` property, which is an array of files that Tailwind CSS should scan for classes.
In a Blazor application, you want to scan the `.razor` files, and optionally you can also include `.html` files.

```js:tailwind.config.js {3-5}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{razor,html}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## The CSS part

The next step is to create a CSS file where you import the Tailwind CSS building blocks.
I recommend creating a `tailwind.css` file in the `Styles` folder, but you're free to choose any other location and name.

```css:Styles/tailwind.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Building and serving the CSS

With the `tailwind.config.js` file and the styles in `Styles/tailwind.css` in ready you can now run the Tailwind CLI to build the CSS file, where you pass the created file as input and specify the output file.
The output file usually goes into the `wwwroot` folder, so it can be served by the application.

```bash
npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css
```

After running this command, you should see the `styles.css` file in the `wwwroot` folder.
Lastly, import this css file in your `App.blazor` file.

```html:app.blazor {8}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="output.css" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <HeadOutlet />
</head>

<body>
    <Routes />
    <script src="_framework/blazor.web.js"></script>
</body>

</html>
```

## Tailwind CSS Optimizations

The `output.css` file only contains the tailwind classes that are used in your application.
This way, you can keep the CSS file size small and only include the styles that are needed.

You can see this in action by adding tailwind classes to your Blazor components.
As a test, you can add the following HTML to your home page.
The result should be a larger than usual, bold, and underlined text.

```html:Home.razor
<h1 class="text-3xl font-bold underline">
    Hello world!
</h1>
```

When you re-execute the `tailwindcss` command, you should see some changes in the `output.css` file.
The styles for the used classes `text-3xl`, `font-bold`, and `underline` should now be included in the `output.css` file.

Now when you run your Blazor application, you should see the Tailwind CSS styles applied to your application.

## Improving the development experience

Always having to run the `tailwindcss` command manually isn't very convenient.
You can automate this process by using the `watch` command, which watches for changes in the files and automatically rebuilds the CSS file.

The first option is to use the `--watch` flag with the `tailwindcss` command, which generates the CSS file every time a file changes.

```bash
npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css
```

This isn't ideal because you need to know the command and remember to run it every time you start your application.

A better option is to add a [build target](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-targets?view=vs-2022) to your project file that runs the `tailwindcss` command before the application is compiled.

```xml:Tailwind.csproj {8-10}
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <Target Name="Tailwind" BeforeTargets="Compile">
    <Exec Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css" />
  </Target>
</Project>
```

The only caveat is that this doesn't work well with `dotnet watch`.
As a workaround, run the watch command without hot reload.

```bash
dotnet watch --no-hot-reload
```

The dotnet watch command only detects changes to files that are a part of the project.
If you want to include the `tailwind.css` file in the watch command, you need to add it to the project file.

```xml:Tailwind.csproj {8-10}
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <Watch Include="./Styles/tailwind.css" Exclude="./wwwroot/**/*;obj\**\*;bin\**\*" />
  </ItemGroup>

  <Target Name="Tailwind" BeforeTargets="Compile">
    <Exec Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css" />
  </Target>
</Project>
```

## Optimizing the (CI) build

In a production environment, you ideally want to minify the CSS file to reduce the file size.
Tailwind supports this with the `--minify` flag, which minifies the generated CSS file.

To minify the CSS file in the release configuration, you can add a second build target in the project file.
By using the `Condition` attribute, you can specify that the target should only run in the release configuration.
With this approach, the output CSS file is minified when you build the application in release mode, e.g. within a CI/CD pipeline.

```xml:Tailwind.csproj {16-18}
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <Target Name="Tailwind" BeforeTargets="Compile">
    <Exec Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css" />
  </Target>

  <Target Name="Tailwind" BeforeTargets="Compile" Condition="'$(Configuration)' == 'Debug'">
    <Exec Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/tailwind.css --minify" />
  </Target>

  <Target Name="Tailwind" BeforeTargets="Compile" EnvironmentVariables="NODE_ENV=production" Condition="'$(Configuration)' == 'Release'">
    <Exec Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/tailwind.css --minify" />
  </Target>
</Project>
```

## Conclusion

Because of the Tailwind CLI integrating Tailwind CSS in a Blazor application is pretty straightforward.
In this post, I've shown how to use the CLI to do the initial setup and how to create a CSS file.
I've also shared how you can configure the project files to automate the building process using build targets.
Lastly, we've learned how to leverage the minify option to optimize the CSS file in a production environment.
