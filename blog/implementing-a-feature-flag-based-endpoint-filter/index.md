---
title: Implementing a Feature Flag-based Endpoint Filter
slug: implementing-a-feature-flag-based-endpoint-filter
description: Keep your Minimal API route handlers clean and compact by implementing a reusable feature flag-based endpoint filter.
date: 2023-08-24
tags: dotnet
---

Hi all, in [Feature Flags in .NET, from simple to more advanced](../feature-flags-in-net-from-simple-to-more-advanced/index.md) we've touched on implementing Feature Flags within .NET applications.
At the time of writing that blog post, it was required to add code within the route handlers of an ASP.NET Minimal API to verify if a feature is enabled.
This was a bit cumbersome.
It was harder to reuse this logic, and it added noise to the route handlers.

To refresh your mind, the next snippet shows that the `IFeatureManager` is injected within the route handler, and it's used to verify if a feature is enabled.
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

What I don't like about this implementation is that we're required to repeat this code within all of the route handlers that need to be toggled on or off.
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

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context,
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

## A more functional approach

For a more functional approach, we can assign the route handler to a variable.
This has its advantages and disadvantages, but I think it's more a matter of taste.

```cs
Func<string, Func<EndpointFilterInvocationContext,EndpointFilterDelegate,ValueTask<object?>>> routeHandlerFilter = (string featureFlag) => async ( context,  next) =>
{
    var featureManager = context.HttpContext.RequestServices.GetService<IFeatureManager>();
    var isEnabled = await featureManager.IsEnabledAsync(featureFlag);
    if (!isEnabled)
    {
        return TypedResults.NotFound();
    }

    return await next(context);
};

app.MapGet("/functional", () => "This works too.")
    .AddEndpointFilter(routeHandlerFilter("FunctionalFeatureFlag"));
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
    .AddEndpointFilter<WeatherforecastFeatureFilter>();

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
Using this approach keeps the Minimal API route handlers clean and compact, and the feature flag logic is reusable.

For now, we need to implement the endpoint filters ourselves, but it could be that this will be provided out-of-the-box in the future - for more info see this [GitHub issue](https://github.com/microsoft/FeatureManagement-Dotnet/issues/253).
