---
title: Automatic Service Discovery and Registration using Scrutor
slug: automatic-service-discovery-and-registration-using-scrutor
date: 2024-06-11
tags: dotNET, developer-experience
---

# Automatic Service Discovery and Registration using Scrutor

[Scrutor](https://github.com/khellang/Scrutor), created by [Kristian Hellang](https://x.com/khellang), is a library that extends the functionality of the built-in ASP.NET Core Dependency Injection (DI) container (`Microsoft.Extensions.DependencyInjection`).

The name "Scrutor" is derived from the Latin verb "scrutor", which can be translated as "explore" / "search" / "examine thoroughly".
And that's exactly what Scrutor does: it allows you to scan assemblies for specific types.

Before Scrutor, we have to manually register the dependencies in the DI container.
The problem with this approach is that as your application grows, maintaining this list of registrations can become cumbersome.

Enter Scrutor, to simplify this process!
It provides a fluent API that allows automatic assembly scanning and dependency registration.
The API provides a flexible (and clean) way to discover types that meet the specified criteria (e.g. a specific name condition), and define the configuration options (e.g. [service lifetimes](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection#service-lifetimes)) that are used for their registration within the container.

Because this significantly improves the developer experience, I encourage you to explore its capabilities and give it a try. Once you’ve experienced the convenience of Scrutor, manual registration will feel like a thing of the past!

To start using Scrutor, add the package to your project using the following command:

```bash
dotnet add package Scrutor
```

:::code-group

```cs [title="After: Scrutor"]
// Automatically register all interface implementations
builder.Services.Scan(scan =>
  scan
    .FromAssemblyOf<IFoo>()
    .AddClasses(publicOnly: false)
    .UsingRegistrationStrategy(RegistrationStrategy.Throw)
    .AsImplementedInterfaces()
    .WithScopedLifetime());
```

```cs [title="Before: Manual registration"]
builder.Services.AddScoped<IFoo, FooImpl>();
builder.Services.AddScoped<IBar, BarImpl>();
builder.Services.AddScoped<IBaz, BazImpl>();
// Manually add new service(s) here ...
```

:::

## Additional resources

- [Using Scrutor to automatically register your services with the ASP.NET Core DI container](https://andrewlock.net/using-scrutor-to-automatically-register-your-services-with-the-asp-net-core-di-container/) by Andrew Lock
- [Improving ASP.NET Core Dependency Injection With Scrutor](https://www.milanjovanovic.tech/blog/improving-aspnetcore-dependency-injection-with-scrutor) by Milan Jovanović
