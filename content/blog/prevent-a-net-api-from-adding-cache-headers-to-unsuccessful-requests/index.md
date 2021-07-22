---
title: Prevent a .NET API from adding cache headers to unsuccessful requests
slug: prevent-a-net-api-from-adding-cache-headers-to-unsuccessful-requests
description: Implementing custom cache middleware to prevent non-200 responses from being cached by a client
author: Tim Deschryver
date: 2021-07-19
tags: dotnet, csharp, api
banner: ./images/banner.jpg
published: true
---

We encountered a problem where we were sending response cache headers to the client for non-successful requests.
To us, this was unexpected. So, let's take a look at what we did wrong, and how we fixed this issue.

## ❌ Bad: Cache attributes

The easiest way to add a cache header to the response is to use the `ResponseCache` attribute, which can be added to a class or to specific methods. **This has one big caveat, the response will be cached by the browser regardless of the response code.**

For example in the code below, if a condition is not met, the `GET` request returns a `400 BadRequest`, which also will be cached by the client. When the client retried the request, the request wouldn't reach the server, and the client would immediately use the cached response.

On the other hand, when the API throws an uncaught exception, the cache headers won't be added to the response.
But when the default exception behavior is overridden, like we did in [Validate incoming requests](/blog/creating-a-new-csharp-api-validate-incoming-requests), this can be problematic because this means that all non-successful responses are cached when the endpoint uses the `ResponseCache` attribute.

This is not the desired behavior and leads to unexpected results.

```cs{6, 13}:WeatherForecastController.cs
[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
        [HttpGet]
        [ResponseCache(Duration = 60_000)]
        public async Task<StatusCodeResult> Get()
        {
            if (condition) {
                return Ok();
            }

            return BadRequest();
        }
}
```

![A bad request is cached by the browser](./images/bad-cache.png)

## 😐 Meh: Cache middleware

To take full control of which and how an endpoint needs to be cached, another option is to implement a caching middleware.
In the example below, the `AddCacheControlHeaders` method is used to validate incoming requests, and it's adding the appropriate cache headers on the response when the response has the `200 OK` status code.

This approach has one major disadvantage. **It doesn't make it very clear which requests are cached and which aren't.**
Because this de-couples the caching logic from the API, this can cause some regression when an endpoint is renamed.
It can also make the code complicated if there are more complex conditions and different caching strategies for different endpoints.

In the next example, we add the cache header to the `/WeatherForecast` request only when the response is `200 OK`.

```cs{10, 14-45}:Startup.cs
public class Startup
{
    public Startup(IConfiguration configuration) { }

    public void ConfigureServices(IServiceCollection services) { }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        ...
        app.Use(AddCacheControlHeaders());
        ...
    }

    private Func<HttpContext, Func<Task>, Task> AddCacheControlHeaders()
    {
        var ENDPOINTS_TO_CACHE = new string[] {
            "/WeatherForecast"
        };

        return async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var cacheHeaders =  context switch
                {
                    {
                        Request: { Method: "GET" },
                        Response: { StatusCode: StatusCodes.Status200OK }
                    } when ENDPOINTS_TO_CACHE.Contains(context.Request.Path.Value, StringComparer.OrdinalIgnoreCase)
                        => new CacheControlHeaderValue {
                            MaxAge = TimeSpan.FromSeconds(60 * 60)
                        },

                    _ => null
                };

                if (cacheHeaders != null)
                {
                    context.Response.GetTypedHeaders().CacheControl =cacheHeaders;
                }
                return Task.FromResult(0);
            });
            await next();
        };
    }
}
```

![Only a successful request is cached by the browser](./images/good-cache.png)

## 👍 Good: Hybrid

Now that we know the strengths and weaknesses of each approach, let's take a look at a hybrid approach.
This blends the two approaches together to come up with a simple and maintainable solution.

We use the `ResponseCache` attribute because it's an easy and expressive way to add a cache header to the response.
Then, to prevent that non-200's response codes are cached by the client, we use the cache middleware to remove the cache headers for when the response status code is not `200 OK`.

The example below, replaces the existing cache header with a no-cache header when the response status code is not `200 OK`.

```cs{10, 14-34}:Startup.cs
public class Startup
{
    public Startup(IConfiguration configuration) { }

    public void ConfigureServices(IServiceCollection services) { }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        ...
        app.Use(RemoveCacheControlHeadersForNon200s());
        ...
    }

    private Func<HttpContext, Func<Task>, Task> RemoveCacheControlHeadersForNon200s()
    {
        return async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.GetTypedHeaders();
                if (context.Response.StatusCode != StatusCodes.Status200OK &&
                    headers.CacheControl?.NoCache == false)
                {
                    headers.CacheControl = new CacheControlHeaderValue
                    {
                        NoCache = true
                    };
                }

                return Task.FromResult(0);
            });
            await next();
        };
    }
}
```

![Only a successful request is cached by the browser](./images/good-cache.png)

## Conclusion

I was wrong thinking that .NET's caching middleware `ResponseCachingMiddleware` removed the cache headers for invalid requests.  
This is important because otherwise the invalid response ends up in the cache of the client.

By looking at the [source code](https://github.com/dotnet/aspnetcore/blob/main/src/Middleware/ResponseCaching/src/ResponseCachingMiddleware.cs) and the [tests](https://github.com/dotnet/aspnetcore/blob/main/src/Middleware/ResponseCaching/test/ResponseCachingMiddlewareTests.cs), we see that the caching middleware actually serves as a server-side cache.

To prevent that invalid requests are cached, you must manually remove the cache headers from the response. The easiest way to do this, is to [write your own middleware](#good-hybrid).
