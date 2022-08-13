---
title: Maybe it's time to rethink our project structure with .NET 6
slug: maybe-its-time-to-rethink-our-project-structure-with-dot-net-6
description: Challenging the status quo with some thoughts on the new .NET Minimal Web API to keep code simple
author: Tim Deschryver
date: 2021-09-27
tags: .NET, architecture, csharp, minimal api
---

With the upcoming release of .NET 6, we're also getting a new API to build applications.
This new API is called the "Minimal Web API".

This blog post came to life because seeing this new structure triggered some new brainwaves that made me question my current project structure. After having read about [CUPID](https://dannorth.net/2021/03/16/cupid-the-back-story/) by [Dan North](https://twitter.com/tastapod) these thoughts have only amplified.

Before we're getting to the details, let's first take a look at what the new API looks like.

### What's a Minimal Web API

As the name hints at, a Minimal Web Api keeps things to a minimum and removes most of the ceremony code.
To give an example, the `dotnet new web` command (using v6.0.100-rc.1) generates a new project with just a single `Program.cs` file.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
```

The `Program.cs` file uses [top-level statements](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/tutorials/top-level-statements) to configure, build, and run the application. Pretty straightforward if you ask me.

```cs:Program.cs
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.Run();
```

This is not something that we're used to.
Previously the default folder structure of a .NET Web API project consisting of a `Program.cs` file (with the `Main` method to run the API) and a `Startup.cs` file (with the `ConfigureServices` and `Configure` methods to configure the API). The project also includes a Controllers folder with a controller file, containing the endpoints of the application.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   Startup.cs
│   WebApplication.csproj
│
├───Controllers
│       Controller.cs
```

In most of the applications and examples I've seen, this structure is used as a basis and new requirements are build on top of this as the project and the complexity grows. The structure of an existing API probably looks like a variation of this, either in a single project, or divided across multiple projects.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   Startup.cs
│   WebApplication.csproj
│
├───Configuration/Extensions
│       ServiceCollection.cs
│       ApplicationBuilder.cs
├───Controllers
│       ...
├───Commands
│       ...
├───Queries
│       ...
├───Models/DTOs
│       ...
├───Interfaces
│       ...
├───Infrastructure
│       ...
```

> You can see this a similar structure in the [dotnet-architecture/eShopOnWeb](https://github.com/dotnet-architecture/eShopOnWeb/tree/master/src/Web) example.

Because this is an industry-standard, it makes sense to follow this design.
But now with the fresh breath that the Minimal API brings, it might be a good time to reconsider the project structure.

We have a few options here, so let's take a look at the different options.

### A single file API

The easiest way to add new functionality to the newly generated template is to just append new features (and endpoints) to the `Program.cs` file.
While this is the most straightforward way to create a simple service, the downside is that it quickly becomes bloated new requirements are being added.

```cs{2-5, 8-19}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<ICustomersRepository, CustomersRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrdersRepository, OrdersRepository>();
builder.Services.AddScoped<IPayment, PaymentService>();

var app = builder.Build();
app.MapPost("/carts", () => {
    ...
});
app.MapPut("/carts/{cartId}", () => {
    ...
});
app.MapGet("/orders", () => {
    ...
});
app.MapPost("/orders", () => {
    ...
});

app.Run();
```

### An API with Controllers

The second option is to revert to what we already know and to what we're used to.
To do this, the endpoints of the service are moved back into controllers.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
│
├───Controllers
│       CartsController.cs
│       OrdersController.cs
```

To register the controllers, we use the `IServiceCollection.AddControllers()` and `WebApplication.MapControllers()` extension methods.

```cs{2, 9}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddScoped<ICustomersRepository, CustomersRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IOrdersRepository, OrdersRepository>();
builder.Services.AddScoped<IPayment, PaymentService>();

var app = builder.Build();
app.MapControllers();
app.Run();
```

#### Pain points of the current project structure

But this doesn't challenge the status quo and the pain points are still here.

This structure slices the application up into technical concerns.
To create new requirements, you need to modify existing files, and probably you'll have to create new files as well.
When you need to find and debug an issue, you need to navigate between multiple files and layers.
This can be hard to do, especially when the project is new to you.
The implementation of a simple endpoint is equivalent to the complex endpoints.
Because simple endpoints follow the same request pipeline as complex endpoints, simple endpoints end up being a lot more complex than that they're supposed to be. Sadly, because it requires more code, it also means that there's a higher chance of bugs.

Just like a single file API, controllers tend to become bloated over time.

### A domain-driven API

What if we move from the traditional folder structure that puts the main focus on the technical aspects of the application to a domain-modeled structure where the application is grouped by its domain. The different domains of the application are organized in module (or feature) folders.

The structure of a simple application that uses a module structure looks like this.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
│
├───Modules
│   ├───Cart
│   │      CartModule.cs
│   └───Orders
│          OrdersModule.cs
```

At first, this doesn't seem to be a big change in comparison to using controller folders.
To know the benefits of this structure, we need to take a closer look at the files.

> The structure is similar to a separation in the Domain Layer, for example [Domain model structure in a custom .NET Standard Library](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/net-core-microservice-domain-model)

#### What is a module

A module consists of two parts, **its requirements and how it's consumed**.

The bare minimum to create a module is a class that has two methods, one to configure the DI container, and one to register the endpoints of the module. Think of this class as the `Program.cs`, but for a single module.
This has the benefit that it's clear what the module needs, which can be useful to write tests and makes it easier to remove unnecessary code.

```cs{3-10,12-21}:OrdersModule.cs
public static class OrdersModule
{
    public static IServiceCollection RegisterOrdersModule(this IServiceCollection services)
    {
        services.AddSingleton(new OrderConfig());
        services.AddScoped<IOrdersRepository, OrdersRepository>();
        services.AddScoped<ICustomersRepository, CustomersRepository>();
        services.AddScoped<IPayment, PaymentService>();
        return services;
    }

    public static IEndpointRouteBuilder MapOrdersEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/orders", () => {
            ...
        });
        endpoints.MapPost("/orders", () => {
            ...
        });
        return endpoints;
    }
}
```

To hook up the orders module, we need to go back to the `Program.cs` file and invoke the two extension methods.
When we do this, the orders module is plugged into the application.

```cs{2,5}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.RegisterOrdersModule();

var app = builder.Build();
app.MapOrdersEndpoints();
app.Run();
```

This keeps the `Program.cs` file clean and simple, and it also has **a clear separation between the modules and their own needs**.

The configuration of the global and technical parts (e.g. logging, authentication, middleware, swagger, ...) of the application are also found in the `Program.cs` file because these go across all modules.

> To take a look at how you can configure your popular libraries, take a look at [Minimal APIs at a glance](https://gist.github.com/davidfowl/ff1addd02d239d2d26f4648a06158727) by [David Fowler](https://twitter.com/davidfowl) and [MinimalApiPlayground](https://github.com/DamianEdwards/MinimalApiPlayground) by [Damian Edwards](https://twitter.com/damianedwards)

To add more modules we have to manually repeat this step, but with a little bit of abstraction, it can be automated.

#### Register the modules automatically

To automate the process to register a new module, we'll first have to introduce an `IModule` interface.
This interface is then being used to look up all of the modules that implement the interface within the application.
Once all of the modules are discovered, the modules are automatically registered.

```cs:IModule.cs
public interface IModule
{
    IServiceCollection RegisterModule(IServiceCollection builder);
    IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints);
}

public static class ModuleExtensions
{
    // this could also be added into the DI container
    static readonly List<IModule> registeredModules = new List<IModule>();

    public static IServiceCollection RegisterModules(this IServiceCollection services)
    {
        var modules = DiscoverModules();
        foreach (var module in modules)
        {
            module.RegisterModule(services);
            registeredModules.Add(module);
        }

        return services;
    }

    public static WebApplication MapEndpoints(this WebApplication app)
    {
        foreach (var module in registeredModules)
        {
            module.MapEndpoints(app);
        }
        return app;
    }

    private static IEnumerable<IModule> DiscoverModules()
    {
        return typeof(IModule).Assembly
            .GetTypes()
            .Where(p => p.IsClass && p.IsAssignableTo(typeof(IModule)))
            .Select(Activator.CreateInstance)
            .Cast<IModule>();
    }
}
```

The refactored orders module, which implements the `IModule` interface, now looks like this.
Nothing much has changed, we're just using the methods from the interface.

```cs{1, 3-10,12-21}:OrdersModule.cs
public class OrdersModule: IModule
{
    public IServiceCollection RegisterModules(IServiceCollection services)
    {
        services.AddSingleton(new OrderConfig());
        services.AddScoped<IOrdersRepository, OrdersRepository>();
        services.AddScoped<ICustomersRepository, CustomersRepository>();
        services.AddScoped<IPayment, PaymentService>();
        return services;
    }

    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/orders", () => {
            ...
        });
        endpoints.MapPost("/orders", () => {
            ...
        });
        return endpoints;
    }
}
```

The new `Program.cs` now uses the module extension methods `RegisterModules()` and `MapEndpoints()` to register all the modules within the application.

```cs{2,5}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.RegisterModules();

var app = builder.Build();
app.MapEndpoints();
app.Run();
```

With the addition of the `IModule` interface, it's now **easy to register new modules as you don't have to modify any of the existing files**.
To register a new module, you only need to create a new class, implement the `IModule` interface, and that's it.

> This module-driven approach is very similar to the [Carter](https://github.com/CarterCommunity/Carter) project.

#### The structure of a module

The benefit of this approach makes that **every module becomes self-contained**.

Simple modules can have a simple setup, while **a module has the flexibility to deviate from the "default" setup** for more complex modules.
For example, simple modules can be developed within a single file (what we've seen so far), while complex modules can be subdivided into multiple files (see the next project structure).

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
│
├───Modules
│   └───Orders
│       │   OrdersModule.cs
│       ├───Models
│       │       Order.cs
│       └───Endpoints
│               GetOrders.cs
│               PostOrder.cs
```

> Inspiration taken from the [ApiEndpoints](https://github.com/ardalis/ApiEndpoints) project by [Steve "ardalis" Smith](https://twitter.com/ardalis). More details about this pattern can be found in his article, [MVC Controllers are Dinosaurs - Embrace API Endpoints](https://ardalis.com/mvc-controllers-are-dinosaurs-embrace-api-endpoints/), or in the [dotnet-architecture/eShopOnWeb](https://github.com/dotnet-architecture/eShopOnWeb/tree/master/src/PublicApi/CatalogItemEndpoints) example.

So what other benefits does this structure bring us?

A domain-based structure groups files and folders by their (sub)domain, this **gives us a better understanding of the application** and makes it easier to navigate through the application. No more hopping around all over the place to find the code that does what you need because everything is everywhere.

I would even go as far as to say that you should try to keep your application as simple as possible.
Meaning that you should start with a simple project (`csproj`) divided into one or more module folders.
A module should start off as a single file and be split up when it becomes hard to navigate.
If that happens, you could further divide the module into different files, e.g. extracting the endpoints of the module into their own files.
Of course, if you'd like to keep the modules consistent, you could also use the same structure within all modules.
Briefly said, **your project structure should reflect the simplicity or the complexity of the domain**.

For example, when you're creating an application to manage orders, the core of the application is a complex order module that is divided into multiple files. A few of the other modules, the supporting modules, just contain simple CRUD operations and are therefore implemented in a single file to cut to the chase.

In the example below, the orders module is the core domain containing all of the business rules, thus the endpoints are moved to an `Endpoints` folder, where each endpoint gets its individual file. Meanwhile, the carts module, which is a supporting module, contains a few simple methods and is implemented as a single file.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
│
├───Modules
│   ├───Cart
│   │      CartModule.cs
│   └───Orders
│       │   OrdersModule.cs
│       ├───Endpoints
│       │       GetOrders.cs
│       │       PostOrder.cs
│       ├───Core
│       │       Order.cs
│       │───Ports
│       │       IOrdersRepository.cs
│       │       IPaymentService.cs
│       └───Adapters
│               OrdersRepository.cs
│               PaymentService.cs
```

#### Preparing for uncertainty

Over time as the project grows and you gain more domain knowledge, there will be a need to **move things around**.
When you get that AHA moment, it's not that hard to convert a submodule into a core module within its own service.
Because the module is self-contained, it's a simple copy-paste of the module folder into a new application.
Basically, a module can be thought of as a plugin, which can easily be moved around.

Besides moving the module, it's also easier to remove a module, or blend multiple modules into one.

### Conclusion

With this project setup, I want to try to continue the Minimal API philosophy and keeping the code to a bare minimum. I want the service to be simple and maintainable while having the flexibility to expand upon it.

The aim is to reduce the moving parts in the application by removing some clutter.
Instead, the application should be divided into core and sub modules that are self-contained.

Not every module needs a complex setup, by cutting up the application into domains (or modules) it becomes easier to deviate from the generic technical design. **A module is adaptable**, meaning that its structure can vary depending on its specific needs.
The goal is to make it easier to start or join a project and to make it easier to maintain an existing codebase.

A Minimal API application that uses a module-based architecture looks like the following structure.

```txt
WebApplication
│   appsettings.json
│   Program.cs
│   GlobalImports.cs
│   WebApplication.csproj
│
├───Modules
│   ├───Cart
│   │      CartModule.cs
│   └───Orders
│       │   OrdersModule.cs
│       ├───Endpoints
│       │       GetOrders.cs
│       │       PostOrder.cs
│       ├───Core
│       │       Order.cs
│       │───Ports
│       │       IOrdersRepository.cs
│       │       IPaymentService.cs
│       └───Adapters
│               OrdersRepository.cs
│               PaymentService.cs
```

When I put the suggested project structure next to my current structure, it's clear that a lot of clutter can be removed.
Compare a single endpoint file that is easy to find, to an endpoint which's implementation is shattered across multiple layers. Between these layers, there is, in most cases, also some kind of translation between the layers. For example, my current flow for every request looks like this, Controller |> MediatR |> Application |> Domain |> Repository/Service, compare this to Endpoint (|> Domain) |> Service.

I get that these layers exist for a reason, but times have changed.
Only a couple of years ago these layers were crucial to make an application testable, but these last few years we're seeing a revolution towards functional tests as I've blogged about in [How to test your C# Web API](/blog/how-to-test-your-csharp-web-api). That's another big point for keeping your code as simple as possible and trying to trim down the number of interfaces, and only create them when it's beneficial (e.g. when you're communicating with a 3rd party service). With the Minimal API, it also becomes easier to "new" instances up instead of relying on the DI container.

We've only covered the structure of a Minimal API project, and in the examples all files are included in the API project.
By following this architecture, you can still extract the Core/Domain layer and the Infrastructure layer into different projects. Whether you do that or not, depends on you and your team and it's probably a good thing to discuss this to keep everyone on the same line. Personally, I don't have a strong opinion on that.

Don't overthink it, just keep it simple.

Thoughts?
