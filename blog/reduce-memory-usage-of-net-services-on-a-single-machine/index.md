---
title: Reduce memory usage of .NET services on a single machine
slug: reduce-memory-usage-of-net-services-on-a-single-machine
description: A snippet on how to configure your project to reduce its memory consumption when multiple services are hosted on one server.
date: 2021-07-22
tags: .net, infra
---

## Reduce memory usage of .NET services on a single machine

### Use case

You see the memory consumption of multiple services growing and it doesn't decrease over time.
After profiling the service you notice the memory of the service is released (there's no memory leak), but the unmanaged memory keeps on growing.

### The Solution

When multiple containerized .NET API's are published on one machine, it might be more performant to disable the server garbage collection. This might lead to more CPU usage (in our case this wasn't the case, or it was very minimal), but it will help to reduce the memory usage.

See the [docs](https://docs.microsoft.com/en-us/aspnet/core/performance/memory?view=aspnetcore-5.0#workstation-gc-vs-server-gc) for more details.

```html{4}:Project.Api.csproj
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net5.0</TargetFramework>
    <ServerGarbageCollection>false</ServerGarbageCollection>
  </PropertyGroup>
</Project>
```
