---
title: Implementing a Feature Flag-based Endpoint Filter
slug: implementing-a-feature-flag-based-endpoint-filter
description: Keep your Minimal API route handlers clean and compact by implementing a reusable feature flag-based endpoint filter.
date: 2023-08-24
tags: dotnet
---

Hi all, in [Feature Flags in .NET, from simple to more advanced](../feature-flags-in-net-from-simple-to-more-advanced/index.md) we've touched on implementing Feature Flags within .NET applications.
At the time of writing that blog post, we were required to implement such logic within route handlers of an ASP.NET Minimal API to verify if a feature is enabled.
This was a bit cumbersome, as it added additional noise to the route handlers, and the logic was not reusable.

:::tip
This feature is currently also [implemented](https://github.com/microsoft/FeatureManagement-Dotnet/pull/524) in the [Microsoft.FeatureManagement.AspNetCore NuGet package](https://www.nuget.org/packages/Microsoft.FeatureManagement.AspNetCore), and provides more advanced feature flag capabilities such as configuring multiple feature flags, negating feature flags, and more.
:::

To refresh your memory, the next snippet shows that the `IFeatureManager` is injected in the route handler, and is used to verify if a feature is enabled.
When the feature is disabled, then a `NotFound` result is returned.
Otherwise, if the feature is enabled, then the route handler continues to execute and returns the weather forecast.

```cs{3-6}
app.MapGet("/weatherforecast", async (IFeatureManager manager) =>
{
    if (!await manager.IsEnabledAsync("WeatherforecastFeature"))
    {
        return TypedResults.NotFound();
    }

    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateTime.Now.AddDays(index),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return TypedResults.Ok(forecast);
});
```

What I don't like about this implementation is that we're required to copy this logic within all of the route handlers that need to be toggled on or off.
Luckily, with the addition of the `EndpointFilter`s in ASP.NET 7, we can refactor it.

In this blog post, we'll extract this logic to end up with a reusable custom endpoint filter.
But before we implement the feature flag filter, let's first take a closer look at `EndpointFilter` feature.

## Endpoint Filter

A minimal API endpoint filter can be compared to a middleware that intercepts an HTTP request before it reaches the route handler.
The filter can execute application logic before and after the route handler's implementation is invoked.

This is useful for many scenarios, in our case to change the behavior based on whether a feature flag is enabled.
When the feature is disabled, we want to short-circuit the request pipeline and return a `NotFound` result.
The route handler is not invoked, and the request is not processed further.

To register a filter for an endpoint, use the [`AddEndpointFilter()` method](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.http.endpointfilterextensions.addendpointfilter).
`AddEndpointFilter` takes an [`EndpointFilterInvocationContext`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.http.endpointfilterinvocationcontext) and an[`EndpointFilterDelegate`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.http.endpointfilterdelegate) as arguments, and returns a `ValueTask<object?>`.

Because we don't rely on those arguments for our feature endpoint filter (see later), I'll skip the details and refer you to the [documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/min-api-filters) for more info.

A simple implementation of a feature filter looks as follows:

```cs{4-15}:Program.cs
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/endpoint", EndpointRouteHandler)
    .AddEndpointFilter(async (invocationContext, next) =>
    {
        // logic before the endpoint route handler is invoked

        // invoke the endpoint route handler (next request delegate within the pipeline)
        var result = await next(invocationContext);

        // logic after the endpoint route handler is invoked

        return result;
    });

app.Run();
```

## Feature Flag implementation as an `EndpointFilter`

With this knowledge, we're able to implement our feature flag endpoint filter.

As mentioned earlier, we want to end up with a reusable filter.
Therefore, we need to wrap the logic of the filter into something reusable, e.g. a class.

To implement the filter, the class needs the implement the `IEndpointFilter` interface.
The `InvokeAsync()` method contains the filter's logic, and will be called by the request pipeline.
Because it's instantiated by the DI container, it's possible to inject the `IFeatureManager`.
Within the `InvokeAsync()` method, the feature manager is used to verify if the feature flag is enabled using `_featureManager.IsEnabledAsync()`.

```cs:FeatureFilter.cs
public abstract class FeatureFilter : IEndpointFilter
{
    protected abstract string FeatureFlag { get; }

    private readonly IFeatureManager _featureManager;

    protected FeatureFilter(IFeatureManager featureManager)
    {
        _featureManager = featureManager;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var isEnabled = await _featureManager.IsEnabledAsync(FeatureFlag);
        if (!isEnabled)
        {
            return TypedResults.NotFound();
        }

        return await next(context);
    }
}
```

In the preceding code, you notice that the class is made abstract.
This is done so it's possible to create specific implementations that provide the name of the feature flag.
Otherwise, we would still need to repeat some code within each feature filter implementation.

```cs:WeatherforecastFeatureFilter.cs
public class WeatherforecastFeatureFilter : FeatureFilter
{
    protected override string FeatureFlag => "WeatherforecastFeature";

    public WeatherforecastFeatureFilter(IFeatureManager featureManager) : base(featureManager)
    {
    }
}
```

Next, we can register the filter that we've just implemented using `AddEndpointFilter<T>()` with the following syntax.

```cs{20}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddFeatureManagement(builder.Configuration.GetSection("FeatureFlags"));

var app = builder.Build();

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateTime.Now.AddDays(index),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return TypedResults.Ok(forecast);
})
.AddEndpointFilter<WeatherforecastFeatureFilter>();

app.Run();
```

## A reusable filter

In the previous example, we had to create a new class for each feature flag.
This is not a big deal, but it's possible to make it more reusable.

To do this, we can create a generic filter that takes the feature flag name as an argument.
We'll also have to change the implementation a bit to access the `IFeatureManager`.
Instead of injecting the `IFeatureManager`, we grab it from the `HttpContext` using the `GetRequiredService<T>()` method.

```cs
public sealed class FeatureFilter(string FeatureFlag)
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var featureManager = context.HttpContext.RequestServices.GetRequiredService<IFeatureManager>();
        var isEnabled = await featureManager.IsEnabledAsync(FeatureFlag);
        if (!isEnabled)
        {
            return TypedResults.NotFound();
        }

        return await next(context);
    }
}
```

To guard a route handler with the feature flag filter, we still use the `AddEndpointFilter()` method on the route handler, but this time using the new `FeatureFilter` class, and passing the feature flag name as an argument.

```cs
app.MapGet("/reusable", () => "This works too.")
    .AddEndpointFilter(new FeatureFilter("FeatureFlagName"));
```

To make this more readable, we can introduce an extension method on the `IEndpointRouteBuilder` interface.

```cs
public static class EndpointRouteBuilderExtensions
{
    public static IEndpointRouteBuilder WithEndpointFeatureFilter(this IEndpointRouteBuilder endpoint, string featureFlag)
    {
        endpoint.AddEndpointFilter(new FeatureFilter(featureFlag));
        return endpoint;
    }
}
```

This extension method can then be used, which expresses the intent more clearly.

```cs
app.MapGet("/reusable", () => "This works as well.")
    .WithEndpointFeatureFilter("FeatureFlagName");
```

Doing this, we don't have to create a new class for each feature flag.
We can easily add the feature flag filter to any route handler.

## A more functional approach

For a more functional approach, we can assign the route handler to a variable.

```cs
Func<string, Func<EndpointFilterInvocationContext,EndpointFilterDelegate,ValueTask<object?>>> routeHandlerFilter = (string featureFlag) => async (context, next) =>
{
    var featureManager = context.HttpContext.RequestServices.GetRequiredService<IFeatureManager>();
    var isEnabled = await featureManager.IsEnabledAsync(featureFlag);
    if (!isEnabled)
    {
        return TypedResults.NotFound();
    }

    return await next(context);
};
```

To add the filter to a route, we can use the `routeHandlerFilter()` function on the route handler while calling `AddEndpointFilter()`, which takes the feature name as an argument.

```cs
app.MapGet("/functional", () => "This works too.")
    .AddEndpointFilter(routeHandlerFilter("FunctionalFeatureFlagName"));
```

## Endpoint Groups

To make it even easier, we can also register the filter on an end endpoint group.
Doing this applies the filter to all endpoints within the group.
Super easy, because we don't need to repeat the filter registration for each endpoint.

```cs{7-8}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddFeatureManagement(builder.Configuration.GetSection("FeatureFlags"));

var app = builder.Build();

var weatherforecastGroup = app.MapGroup("/weatherforecast")
    // Using AddEndpointFilter
    .AddEndpointFilter<WeatherforecastFeatureFilter>()
    // Or using our extension method
    .WithEndpointFeatureFilter("WeatherforecastFeature");

weatherforecastGroup.MapGet("", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateTime.Now.AddDays(index),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return TypedResults.Ok(forecast);
});

app.Run();
```

## Conclusion

In this post, we've seen how to implement an endpoint filter that verifies if a feature flag is enabled.
Instead of polluting the route handlers with this concern, configuring the filter on the route (or group) handler keeps the route handlers clean and compact.

~For now, we need to implement the endpoint filters ourselves, but it could be that this will be provided out-of-the-box in the future - for more info see this [GitHub issue](https://github.com/microsoft/FeatureManagement-Dotnet/issues/253).~ The feature flag filter for Minimal API's is implemented in https://github.com/microsoft/FeatureManagement-Dotnet/pull/524.
