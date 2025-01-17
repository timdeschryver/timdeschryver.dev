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

Run the following command in the root of your Blazor project.

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

The important part is the `content` property, which is an array of files that Tailwind CSS should scan for used classes.
In a Blazor application, you want to scan the `.razor` files, and optionally you can also include `.html` files.

In the following configuration, all `.razor` and `.html` files in the project are analyzed.
You can modify this path to only include specific files/directories

```js:tailwind.config.js {3-5}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.{razor,html}',
    './**/(Layout|Pages)/*.{razor,html}', // Include only Layout and Pages folders
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## The CSS part

The next step is to create a CSS file where you import the Tailwind CSS building blocks.
I recommend creating a `tailwind.css` file in the `Styles` folder (you probably need to create this folder as well), but you're free to choose any other location and name.

```css:Styles/tailwind.css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Generating and serving the CSS

With the initial setup complete, you can now use the Tailwind CLI again to generate the CSS file.
Using `tailwindcss` you can specify the input file and the output file.
The output file usually goes into the `wwwroot` folder, so it can be served by the application.

With the following command, the previously created `./Styles/tailwind.css` file is passed as the input.
This will create a `styles.css` file in the `wwwroot` folder.

```bash
npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css
```

After running this command, you should see the `styles.css` file within the existing `wwwroot` folder.
Lastly, if you're using Blazor Server, import this generated css file in your `App.blazor` file.

```html:app.blazor {8}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="styles.css" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <HeadOutlet />
</head>

<body>
    <Routes />
    <script src="_framework/blazor.web.js"></script>
</body>

</html>
```

If you're using Blazor WebAssambly, you need to import the generated css file in the `wwwroot/index.html` file.

```html:wwwroot/index.html {10}
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlazorApp</title>
    <base href="/" />
    <link rel="stylesheet" href="styles.css" />
    <link rel="icon" type="image/png" href="favicon.png" />
    <link href="BlazorApp.styles.css" rel="stylesheet" />
</head>

<body>
    <div id="app">
        <svg class="loading-progress">
            <circle r="40%" cx="50%" cy="50%" />
            <circle r="40%" cx="50%" cy="50%" />
        </svg>
        <div class="loading-progress-text"></div>
    </div>

    <div id="blazor-error-ui">
        An unhandled error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">🗙</a>
    </div>
    <script src="_framework/blazor.webassembly.js"></script>
</body>

</html>
```

## Tailwind CSS Optimizations

Because we updated the tailwind configuration, the `styles.css` file only contains the tailwind classes that are used in your application.
This way, you can keep the CSS file size small and only include the styles that are needed.

You can see this in action by adding tailwind classes to your Blazor components.
As a test, you can add the following HTML to your home page.
The result should be a larger than usual, bold, and underlined text.

```html:Home.razor
<h1 class="text-3xl font-bold underline">
    Hello world!
</h1>
```

When you re-execute the `tailwindcss` command (`npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css`), you will see some changes in the `styles.css` file.
The styles for the used classes `text-3xl`, `font-bold`, and `underline` should now be included in the `styles.css` file.

Now when you run your Blazor application, you should see the Tailwind CSS styles applied to your application.

## Improving the development experience

Always having to run the `tailwindcss` command manually isn't very convenient.
To make it easier you can automate this process by using the `watch` command, which watches for changes in the files and automatically rebuilds the CSS file.

The first option is to use the `--watch` flag with the `tailwindcss` command, which generates the CSS file every time a file changes.

```bash
npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/styles.css --watch
```

This can be enough, but on the other hand this is not very efficient, because you need to know the command and remember to run it every time you start the application (or at least, when you want to update the styles).

A better option is to add a [build target](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-targets?view=vs-2022) to your project file that runs the `tailwindcss` command before the application is compiled.

In the example below we include the `tailwindcss` command which we've used before, but this time it will automatically run every time you build the application.

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

By default, the `watch` command only detects changes to files that are a part of the project.
If you want to include the `tailwind.css` file to trigger a rebuild/reload, you need to include it within the project file.

In the example below, a `ItemGroup` is created to watch for changes within the `tailwind.css` file.

:::note
Normally, once the initial tailwind setup is complete, you probably don't need to make any more changes to the `tailwind.css` file. To keep things simple, you can skip/remove this part.
:::

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
This helps to improve the loading time of your application, creating the best possible user experience.

Tailwind supports this task by using the `--minify` flag

To minify the CSS file within your project, you can add a second build target in the project file that is run when the application is built in release mode.
Using the `Condition` attribute, a [`MSBuild condition`](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-conditions) can be specified to run the target only in specific scenarios.

In the example below, we've modified the first target to only run in the debug configuration, which is used during development.
Additionally, a second target is added that runs in the release configuration.

The command used in the release configuration includes the `--minify` flag to minify the CSS file.
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

  <Target Name="TailwindDebug" BeforeTargets="Compile" Condition="'$(Configuration)' == 'Debug'">
    <Exec Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/tailwind.css --minify" />
  </Target>

  <Target Name="TailwindRelease" BeforeTargets="Compile" Condition="'$(Configuration)' == 'Release'">
    <Exec EnvironmentVariables="NODE_ENV=production" Command="npx tailwindcss -i ./Styles/tailwind.css -o ./wwwroot/tailwind.css --minify" />
  </Target>
</Project>
```

In the example above, you can also notice the `NODE_ENV=production` environment variable.
While tailwind doesn't use this variable directly as far as I know, it's a common practice to do within a Node.js environment.
This can be useful if you're using other tools in your build process that rely on this variable.

For more information, see the Tailwind [Optimizing for Production](https://tailwindcss.com/docs/optimizing-for-production) documentation.

## Conclusion

Because the Tailwind CLI, integrating Tailwind CSS in a Blazor application is pretty straightforward.

In this post, I've shown how the CLI can be used to scaffoldd the initial setup.
I've then slightly modified it for a Blazor-specific application by settings the `contents` property so that tailwind includes the `.razor` and `.html` files in the project.
This is important to ensure that only the used classes are included in the generated CSS file.
To further optimize the generated CSS file, I've shown how you can leverage the `minify` option to reduce the file size.

Lastly, we've went through how to configure the project files to automate the building process using build targets.

The result is an optimal CSS file, which is automatically generated (and minified) when the application is built, making the development process more efficient and the application faster.

As pointed out in the comments, you can also directly [include the Tailwind CSS CDN](https://tailwindcss.com/docs/installation/play-cdn) in your `index.html` file.
This is a valid approach, but it's not as efficient as generating the CSS file only with the used classes, because this leads to a larger file size.
