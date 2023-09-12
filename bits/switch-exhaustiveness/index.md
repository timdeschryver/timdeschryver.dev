---
title: Switch Exhaustiveness
slug: switch-exhaustiveness
date: 2023-09-12
tags: dotnet, typescript
---

# Switch Exhaustiveness

How many times have you added a new option (enum, union, expression, ...) without updating all code paths?
Did this result in unforeseen issues?

One of the reasons why I prefer switch statements over if-else conditions is that it supports exhaustiveness checks.
This is incredibly useful because it ensures that no scenario is left unhandled, reducing the risk of unexpected bugs or runtime errors.
It also shortens the feedback loop because your IDE immediately flags incomplete switch statements.

Personally, I also find a switch statement more readable in contrast to an if-else condition.

The Switch Exhaustiveness check is not enabled by default, so you'll have to enable it.

In **C# applications** the default behavior is that a non-exhaustive switch is a warning.
To turn this into an error, configure the [`TreatWarningsAsErrors` compiler option](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/errors-warnings#treatwarningsaserrors) in your project(s).
If you just want to treat specific warnings as an error, use the [`WarningAsErrors` compiler option](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-options/errors-warnings#warningsaserrors-and-warningsnotaserrors) instead, which accepts warning numbers, e.g. `<WarningsAsErrors>CS8509</WarningsAsErrors>`.

Now, when a switch is not exhaustive, it results in a compilation error.

:::code-group

```xml{5-6, 8-9}:ExampleProject.csproj [title=Project Configuration]
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>

    <!-- All warnings are errors -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>

    <!-- Only specific warnings are errors -->
    <WarningsAsErrors>CS8509</WarningsAsErrors>
  </PropertyGroup>
</Project>
```

```cs:Example.cs [title=Example]
string Color(RGB input)
{
    return input switch
    {
        RGB.Red => "rgb(255, 0, 0)",
        RGB.Green => "rgb(0, 255, 0)",
        // RGB.Blue is not handled
    };
}

enum RGB { Red, Green, Blue };
```

```txt:Output [title=Output]
The 'switch' expression does not handle all possible inputs (it is not exhaustive).
For example, the pattern 'RGB.Blue' is not covered.
```

:::

For **TypeScript applications**, enable the [`switch-exhaustiveness-check` ESLint rule](https://typescript-eslint.io/rules/switch-exhaustiveness-check/).
It's best to configure this rule as an error so it catches your attention.

Enabling the ESLint rule doesn't prevent the application from building. As an alternative, manually add a `default` case that turns into a compiler error when it detects a non-exhaustive switch. For this, you can use the [`never` type](https://www.typescriptlang.org/docs/handbook/basic-types.html#never). Now this will also result in a compiler error.

:::code-group

```js{3}:.eslintrc. [title=ESLint Configuration]
module.exports = {
  "rules": {
    "@typescript-eslint/switch-exhaustiveness-check": "error"
  }
};
```

```ts:example.ts [title=Example]
function color(input: RGB)
{
    switch (input) {
        case 'Red':
            return 'rgb(255, 0, 0)';
        case 'Green':
            return 'rgb(0, 255, 0)';
        // Blue is not handled
    }
}

type RGB = 'Red' | 'Green' | 'Blue'
```

```txt:Output [title=Output]
Switch is not exhaustive.
Cases not matched: "Blue".
```

```ts{10-12}:example.ts [title=Alternative Example]
function color(input: RGB)
{
    switch (input) {
        case 'Red':
            return 'rgb(255, 0, 0)';
        case 'Green':
            return 'rgb(0, 255, 0)';
        // Blue is not handled

        default:
            // TS1360: Type  string  does not satisfy the expected type  never
            input satisfies never;
    }
}

type RGB = 'Red' | 'Green' | 'Blue'
```

:::
