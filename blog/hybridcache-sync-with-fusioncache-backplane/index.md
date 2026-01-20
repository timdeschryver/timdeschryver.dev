---
title: "Using FusionCache's Backplane to synchronize HybridCache instances across multiple instances"
slug: hybridcache-sync-with-fusioncache-backplane
description: HybridCache is a great caching solution but it doesn't sync in-memory caches across instances. Discover how FusionCache can help you achieve this (and much more) with its Backplane feature.
date: 2026-01-16
tags: .NET, Caching, HybridCache, FusionCache, Redis
---

The decision of whether to use a cache or not depends entirely on your application's needs, but if you do require caching, then .NET provides several options to choose from.

## Caching in ASP.NET

Previously, you could choose between using an in-memory cache ([`IMemoryCache`](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/memory)) or a distributed cache ([`IDistributedCache`](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed?view=aspnetcore-10.0)) based on your requirements. The recent addition of the [`HybridCache`](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid) - in .NET 9 - combines the best of both worlds, and provides a simple and consistent API for developers.

The `HybridCache` works by first checking the in-memory cache (L1) for the requested item. If it's not found there, it then checks the distributed cache (L2). If the item is found in the distributed cache, it is then added to the in-memory cache for faster access when it's read another time. This approach ensures that frequently accessed data is quickly available while still maintaining consistency across different instances of your application.

Next to the speed improvements and the DX, the `HybridCache` also has the following features:

- Cache-stampede protection: Prevents multiple requests from overwhelming the cache when an item expires.
- Cache invalidation: use tags to invalidate related cache entries across both caches.
- Configurable: define where you want to cache (L1 and/or L2) your data and how it should be serialized.

## Using HybridCache

### Installation and setup

To start using the `HybridCache`, you need to install the [Microsoft.Extensions.Caching.Hybrid package](https://www.nuget.org/packages/Microsoft.Extensions.Caching.Hybrid).

```bash
dotnet package add Microsoft.Extensions.Caching.Hybrid
```

Next, register the `HybridCache` using the `AddHybridCache()` method in your the `Program.cs` file:

```csharp [name=Program.cs] [highlight=3]
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHybridCache();

var app = builder.Build();

app.Run();
```

The above registers the `HybridCache` as an in-memory cache.
When a distributed cache implementation (like Redis or SQL Server) is in the dependency injection container, it will automatically be used as the distributed cache.
For example, to use Redis as the distributed cache, you can register it like this:

```csharp [name=Program.cs] [highlight=3-7]
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
});
builder.Services.AddHybridCache();

var app = builder.Build();

app.Run();
```

`AddHybridCache()` can also take a callback action to customize the behavior of the cache by providing `HybridCacheOptions`. For example, to disable the local cache and set a custom expiration time for cache entries, you can do the following.

```csharp [name=Program.cs] [highlight=3-10]
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHybridCache(options =>
{
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Flags = HybridCacheEntryFlags.DisableLocalCache,
        Expiration = TimeSpan.FromMinutes(5),
    };
});

var app = builder.Build();
app.Run();
```

Instead of configuring the expiration time for each cache entry individually, it's useful to set default options for your distributed cache entries using these options.

### Retrieving and writing from/to the HybridCache

To consume the `HybridCache`, inject a `HybridCache` instance and use the `GetOrCreateAsync` method to retrieve or create cache entries.
This methods requires a cache key and a factory function to create the item if it doesn't exist in the cache.

```csharp [name=DataEndpoint.cs]
app.MapGet("/data", async (HybridCache cache) =>
{
    var data = await cache.GetOrCreateAsync("data", async (cancellationToken) =>
    {
        var result =  /* Do some expensive operation to fetch data */;
        return result;
    });
    return data;
});
```

`GetOrCreateAsync` also accepts optional `options` argument ([`HybridCacheEntryOptions`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.extensions.caching.hybrid.hybridcacheentryoptions)) to customize the caching behavior for that specific entry, such as setting expiration times, and an optional `tags` argument to associate tags with the cache entry.

Besides the `GetOrCreateAsync` method, the `HybridCache` also provides methods to remove cache entries (`RemoveAsync` and `RemoveByTagAsync`), as well as a method to set cache entries directly (`SetAsync`).

For those looking to migrate, it should be relatively straightforward to migrate to the `HybridCache` as it is a drop-in replacement for both `IMemoryCache` and `IDistributedCache`, especially if you are already using the memory cache because it has a similar API.

## Problem: Keeping multiple in-memory caches in sync

But this also raises the question, how do you keep the cache in sync for different in-memory instances, for example when you have multiple instances of the same application running?

Sadly, the `HybridCache` does not provide a built-in solution for this scenario yet. There's an [open issue](https://github.com/dotnet/extensions/issues/5517) on GitHub discussing this exact problem.

One possible approach to tackle this problem is to use the Redis Pub/Sub messaging system to handle cache invalidation across different instances.

## FusionCache

Another approach is to introduce the [FusionCache](https://github.com/ZiggyCreatures/FusionCache) package, which is a third-party caching library that provides advanced features to have a resilient and flexible caching solution. It supports more advanced features compared to `HybridCache`, such as [`Backplane`](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/Backplane.md), which can be used to synchronize cache entries across multiple instances using a distributed messaging system. For a full comparison between different caching libraries, check out [the comparison table](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/Comparison.md).

:::info
We're not going into all of FusionCache's features in this post, as that could be a blog post on its own. If you want to know more about it, check out the [documentation](https://github.com/ZiggyCreatures/FusionCache/blob/main/docs/README.md), which is very well written and provides many examples.
:::

Luckily, FusionCache also provides a `HybridCache` wrapper so you don't have to change your existing codebase if there's already a `HybridCache` being used.

### Setup

To install the core library of FusionCache as a distributed cache install the following packages:

```bash
dotnet package add ZiggyCreatures.FusionCache
dotnet package add ZiggyCreatures.FusionCache.Serialization.SystemTextJson
```

To register FusionCache in your application, use the `AddFusionCache()` method, which sets up FusionCache as an in-memory cache.
To configure FusionCache to use a distributed cache (like Redis), you can use the `WithDistributedCache()` method, which requires you to also configure the serializer using the `WithSerializer()` method.
Because we want it to act as a `HybridCache` wrapper, use the `AsHybridCache()` method.

```csharp [name=Program.cs] [highlight=3-13]
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFusionCache()
    .WithOptions(options => {
        // Configure FusionCache options here, enable/disable features as needed
    })
    .WithSerializer(
        new FusionCacheSystemTextJsonSerializer()
    )
    .WithDistributedCache(
        new RedisCache(new RedisCacheOptions { Configuration = "localhost:6379" })
    )
    .AsHybridCache();

var app = builder.Build();

app.Run();
```

The rest of the code remains the same, as you can keep using the `HybridCache` API.

### Backplane support

Backplane support can simply be activated using the `WithBackplane()` method while configuring FusionCache.

Before using the backplane feature, you need to install the appropriate backplane package.
In this case, we use the Redis backplane implementation, so install the following package:

```bash
dotnet package add ZiggyCreatures.FusionCache.Backplane.StackExchangeRedis
```

```csharp [name=Program.cs] [highlight=13-15]
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFusionCache()
    .WithOptions(options => {
        // Configure FusionCache options here, enable/disable features as needed
    })
    .WithSerializer(
        new FusionCacheSystemTextJsonSerializer()
    )
    .WithDistributedCache(
        new RedisCache(new RedisCacheOptions { Configuration = "localhost:6379" })
    )
    .WithBackplane(
        new RedisBackplane(new RedisBackplaneOptions { Configuration = "localhost:6379" })
    )
    .AsHybridCache();

var app = builder.Build();

app.Run();
```

With this setup, whenever a cache entry is removed or updated in one instance, a message is published, which notifies all other instances to invalidate their local caches accordingly. This ensures that all instances have consistent cache data.

## Conclusion

If you're considering using caching in your .NET applications, the `HybridCache` is a great choice due to its simplicity and built-in features. You can get started quickly with minimal setup and enjoy the benefits of in-memory caching, while still having a distributed cache as an option for larger-scale deployments. Changing the caching mechanism can be done in a central place, without affecting the rest of your application code.

The two-tier (in-memory and distributed) caching approach of `HybridCache` provides a good balance between performance and scalability.

However, it might not offer all the features that you need. This is where FusionCache comes in.
Because FusionCache provides a wrapper for `HybridCache`, it should be easy to integrate it into your existing applications and migrate to it.

In this post we've seen how to use FusionCache's backplane feature to keep multiple in-memory caches synchronized across different instances of your application. The best part is that this requires minimal code changes—just a few extra configuration lines during setup.

If you're running a distributed application with multiple instances and need consistent cache data across all of them, combining the `HybridCache` API with FusionCache is a practical approach that doesn't require a complete rewrite of your caching logic. As an added bonus, you'll also gain access to FusionCache's other resilience features should you need them in the future.
