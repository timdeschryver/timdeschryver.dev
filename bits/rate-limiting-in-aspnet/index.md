---
title: Rate limiting in ASP.NET
slug: rate-limiting-in-aspnet
date: 2024-03-12
tags: dotnet
---

# Rate limiting in ASP.NET

Rate limiting is a technique used to control the number of requests a client can make to a server.
It is often used to prevent abuse of an API, e.g. to protect against denial-of-service attacks.

This feature is implemented as a middleware.
To enable rate limiting in your application, add the rate limiter to the service collection, and then enable the middleware within the application.

To configure the rate limiter, you can use one of the built-in limiters to create policies, which can be applied to the whole application or to specific endpoints.
The built-in limiters are the following (the descriptions are taken from the official documentation):

- Fixed Window Limiter: uses a fixed time window to limit requests. When the time window expires, a new time window starts and the request limit is reset.
- Sliding Window Limiter: similar to the fixed window limiter but adds segments per window. The window slides one segment each segment interval. The segment interval is (window time)/(segments per window).
- Token Bucket Limiter: similar to the sliding window limiter, but rather than adding back the requests taken from the expired segment, a fixed number of tokens are added each replenishment period. The tokens added each segment can't increase the available tokens to a number higher than the token bucket limit.
- Concurrency Limiter: limits the number of concurrent requests. Each request reduces the concurrency limit by one. When a request completes, the limit is increased by one. Unlike the other requests limiters that limit the total number of requests for a specified period, the concurrency limiter limits only the number of concurrent requests and doesn't cap the number of requests in a time period.

:::code-group

```cs {2-5,8} [title=Setup]
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRateLimiter(options =>
{
    /* Policy configuration here */
});

var app = builder.Build();
app.UseRateLimiter();
app.Run();
```

```cs [title=Usage]
// Global configuration
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = /* Implementation here */
});

// Specific endpoints (also works with MVC Controllers/Endpoints)
app.MapGet("/", () => Results.Ok("Hello world"))
     .RequireRateLimiting(Policy);

```

```cs [title=FixedWindowLimiter]
builder.Services.AddRateLimiter(_ => _
    .AddFixedWindowLimiter(policyName: "fixed", options =>
    {
        options.PermitLimit = myOptions.PermitLimit;
        options.Window = TimeSpan.FromSeconds(myOptions.Window);
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = myOptions.QueueLimit;
    }));
```

```cs [title=SlidingWindowLimiter]
builder.Services.AddRateLimiter(_ => _
    .AddSlidingWindowLimiter(policyName: "sliding", options =>
    {
        options.PermitLimit = myOptions.PermitLimit;
        options.Window = TimeSpan.FromSeconds(myOptions.Window);
        options.SegmentsPerWindow = myOptions.SegmentsPerWindow;
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = myOptions.QueueLimit;
    }));
```

```cs [title=TokenBucketLimiter]
builder.Services.AddRateLimiter(_ => _
    .AddSlidingWindowLimiter(policyName: "token-bucket", options =>
    {
        options.TokenLimit = myOptions.TokenLimit;
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = myOptions.QueueLimit;
        options.ReplenishmentPeriod = TimeSpan.FromSeconds(myOptions.ReplenishmentPeriod);
        options.TokensPerPeriod = myOptions.TokensPerPeriod;
        options.AutoReplenishment = myOptions.AutoReplenishment;
    }));
```

```cs [title=ConcurrencyLimiter]
builder.Services.AddRateLimiter(_ => _
    .AddConcurrencyLimiter(policyName: concurrencyPolicy, options =>
    {
        options.PermitLimit = myOptions.PermitLimit;
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = myOptions.QueueLimit;
    }));
```

:::

See the [documentation](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-8.0) for more details and example implementations.
For more examples I also encourage you to take a look at [Maarten Balliauw](https://twitter.com/maartenballiauw)'s blog [ASP.NET Core rate limiting middleware in .NET 7](https://blog.maartenballiauw.be/post/2022/09/26/aspnet-core-rate-limiting-middleware.html).
