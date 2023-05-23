---
title: Refactor your .NET HTTP Clients to Typed HTTP Clients
slug: refactor-your-net-http-clients-to-typed-http-clients
description: A summary of why and how you should refactor your HTTP clients to the typed HTTP client version in .NET.
date: 2023-05-23
tags: .NET, refactor
---

All of .NET applications that I've worked on required us to communicate with external (REST) APIs over HTTP.
In the .NET landscape, there are different ways to do this, and in this post, I'll show you my preferred way of doing it.

Previously with .NET framework invoking HTTP requests and handling responses was a bit harder than it is now.
A popular solution was to use the [RestSharp](https://restsharp.dev/) library, which hid a lot of the complexity.

With dotnet (Core) consuming web APIs is much easier and the need to grab a third-party library is not really there anymore.
While this is great, there are still a few gotchas that we need to be aware of.

## Caveats with HttpClient

Nowadays if you're currently building a dotnet application that communicates with an API, you're likely using the `HttpClient` class to make HTTP requests.

But because it's so easy to use, it's also easy to abuse.
A mistake that I frequently see is that developers instantiate a new `HttpClient` instance directly in their code to start a request.
This can potentially lead to problems that at first might not be obvious and are hard to debug.

A problem that has bitten me in the past due to this is port exhaustion, and it seems that [I'm not the only one](https://www.google.com/search?q=site%3Astackoverflow.com+.net+port+exhaustion&sxsrf=APwXEdffXe2d9vqD4mpDOSL8T9oyfpdYCg%3A1684684033727&ei=AT1qZKnUK_uX9u8P5devsAU&ved=0ahUKEwjp2I2L4Yb_AhX7i_0HHeXrC1YQ4dUDCA8&uact=5&oq=site%3Astackoverflow.com+.net+port+exhaustion&gs_lcp=Cgxnd3Mtd2l6LXNlcnAQAzoKCAAQRxDWBBCwAzoHCCMQ6gIQJzoQCAAQ4wQQ6QQQ6gIQtAIYAToSCC4QAxCPARDUAhDqAhC0AhgCOg8IABADEI8BEOoCELQCGAI6DwguEAMQjwEQ6gIQtAIYAjoHCCMQigUQJzoHCAAQigUQQzoLCAAQigUQsQMQgwE6EQguEIoFELEDEIMBEMcBENEDOgsIABCABBCxAxCDAToOCC4QgAQQsQMQxwEQ0QM6EQguEIAEELEDEIMBEMcBENEDOgQIIxAnOggIABCKBRCRAjoHCC4QigUQQzoECAAQAzoKCC4QigUQsQMQQzoICC4QgAQQsQM6CwguEIoFELEDEIMBOgUIABCABDoLCC4QrwEQxwEQgAQ6CAguEIAEENQCOgUILhCABDoLCC4QgAQQxwEQ0QM6CwguEIAEEMcBEK8BOg8ILhCKBRDHARDRAxAKEEM6CggAEIAEEBQQhwI6HQguEIoFEMcBENEDEAoQQxCXBRDcBBDeBBDgBBgDSgQIQRgAULwRWLFQYIdSaApwAXgBgAGvAYgBgRaSAQUyMC4xMZgBAKABAaABArABFMgBCMABAdoBBggBEAEYAdoBBggCEAEYCtoBBggDEAEYFA&sclient=gws-wiz-serp#bsht=Cgdic2h3Y2hwEgQIBDAB).
Besides port exhaustion, there are [other problems described in the documentation](https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines) that can occur when using `HttpClient` directly.

Throughout this post we'll use the public [Star Wars API](https://swapi.dev/) as an example to demonstrate the different ways of consuming the API.
We start of with the initial code, which news up `HttpClient` instances directly in the code.

```csharp{8, 15, 22}:Program.cs
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId) =>
{
    var httpClient = new HttpClient();
    var people = await httpClient.GetFromJsonAsync<StarWarsPeople>($"https://swapi.dev/api/people/{peopleId}");
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}", async (string speciesId) =>
{
    var httpClient = new HttpClient();
    var species = await httpClient.GetFromJsonAsync<StarWarsSpecies>($"https://swapi.dev/api/species/{speciesId}");
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}", async (string planetId) =>
{
    var httpClient = new HttpClient();
    var planet = await httpClient.GetFromJsonAsync<StarWarsPlanet>($"https://swapi.dev/api/planets/{planetId}");
    return Results.Ok(planet);
});

app.Run();
```

Now that we know the possible problems to keep in mind, and we've seen the initial code, let's look at the improvements we can make.

### Why having a Singleton is not the solution

The first solution that probably comes up is to not new up an `HttpClient` instance but to use a single instance (a singleton) for the lifetime of your application.

This might seem like a good solution, but it's not the best solution because you're still required to manage the lifetime of the client yourself. Otherwise, you might still run into DNS issues as mentioned in the linked documentation above.

A singleton is also not the best fit when your application requires multiple clients, e.g. to communicate with different APIs.
When this is the case, it's hard to configure the clients differently.

## IHttpClientFactory

A better solution is to use the `IHttpClientFactory`. The `IHttpClientFactory` is a factory that creates and manages `HttpClient` instances for you. This way dotnet handles all the details for you, and you can focus on writing code without interruptions.

Yet again, we face a decision to be made because there are multiple options to pick from.
Let's go through the options from good to best.

### Refactor to IHttpClientFactory

The simplest way is to use the `IHttpClientFactory` directly in your code to create an HTTP client when we need one.

To do this, first, register the `IHttpClientFactory` in the dependency injection container by using the `AddHttpClient` method.
Then, inject the factory where you need a client, create a client with `CreateClient`, and use it to make an HTTP request.

```csharp{2, 9-10, 16-17, 23-24}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient();

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient();
    var people = await httpClient.GetFromJsonAsync<StarWarsPeople>($"https://swapi.dev/api/people/{peopleId}");
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}",  async (string speciesId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient();
    var species = await httpClient.GetFromJsonAsync<StarWarsSpecies>($"https://swapi.dev/api/species/{speciesId}");
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}",  async (string planetId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient();
    var planet = await httpClient.GetFromJsonAsync<StarWarsPlanet>($"https://swapi.dev/api/planets/{planetId}");
    return Results.Ok(planet);
});

app.Run();
```

This solution works and we get rid of a couple of the problems that we had before, but it's not ideal.

The main problem that's solved is that we don't have to think about managing the lifetime of the `HttpClient` anymore.
But, when we take a look at the code we can detect some smells.

At first glance, we can immediately see duplication here with (re-)declaration of the API's domain within the different requests (https://swapi.dev/).

The second thing that I don't like about this, is that we don't have a way to configure the client.
Moreover, if the application needs to communicate with multiple HTTP APIs, we're still reusing the same HTTP client.

Lastly, we can't hook into the HTTP client's events when it sends a request or receives a response.
This could be something that we might want to add in the future, and why not be proactive about it.
And spoiler alert, the improved solution isn't a lot of extra work compared to this one (as you'll see in the next examples).

### Refactor to Named HTTP clients

The improved solution is to use something that's called a named HTTP client.
This solution has a lot of similarities with the previous one, with the addition of a name for the client.

To create a named client, simply pass a name, which is just a string, to the `AddHttpClient` method.
Then, when you want to create a client, pass the same name of the client to the `CreateClient` method.

In the following example we create and use a named client with the name "starwars".

```csharp{2, 9-10, 16-17, 23-24}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient("starwars");

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("starwars");
    var people = await httpClient.GetFromJsonAsync<StarWarsPeople>($"https://swapi.dev/api/people/{peopleId}");
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}",  async (string speciesId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("starwars");
    var species = await httpClient.GetFromJsonAsync<StarWarsSpecies>($"https://swapi.dev/api/species/{speciesId}");
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}",  async (string planetId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("starwars");
    var planet = await httpClient.GetFromJsonAsync<StarWarsPlanet>($"https://swapi.dev/api/planets/{planetId}");
    return Results.Ok(planet);
});

app.Run();
```

It's as simple as that.

#### Configure HTTP clients

To make this even better, we can configure the client in the callback of the `AddHttpClient` method, which gives us access to the `HttpClient` instance.
The gained benefit is that we can configure the client once, at a central place, and use the configured client everywhere in our application.

Creating clients using `AddHttpClient` also allows us to create multiple HTTP clients with different configurations, each for its own purpose.

The refactored version below configures the domain once.
To do so, set the `BaseAddress` property within the callback method.
The example keeps things simple but besides the base address, it's also possible to configure more about the client, for example, to include request headers to the HTTP requests.

The result is that we can remove the duplicated domain within the consumers.

```csharp{2-5, 12-13, 19-20, 26-27}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient("starwars", (client) => {
        // Configure the HTTP client here
        client.BaseAddress = new Uri("https://swapi.dev/api/");
    });

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("starwars");
    var people = await httpClient.GetFromJsonAsync<StarWarsPeople>($"people/{peopleId}");
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}", async (string speciesId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("starwars");
    var species = await httpClient.GetFromJsonAsync<StarWarsSpecies>($"species/{speciesId}");
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}", async (string planetId, IHttpClientFactory httpClientFactory) =>
{
    var httpClient = httpClientFactory.CreateClient("starwars");
    var planet = await httpClient.GetFromJsonAsync<StarWarsPlanet>($"planets/{planetId}");
    return Results.Ok(planet);
});

app.Run();
```

And it doesn't stop there, we can add `HttpMessageHandler`s to tweak the behavior of the HTTP client.

Some implementations of such handlers are handlers to retry failed requests, add a rate-limiter to the requests, insert a caching layer, or add a circuit breaker to the HTTP client.
Luckily we don't have to write this manually, but we can resort to the popular [Polly](http://www.thepollyproject.org/) package.
By using Polly we can create resilient HTTP clients with ease.

```csharp{2-6}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient("starwars", (client) => {
        client.BaseAddress = new Uri("https://swapi.dev/api/");
    })
    .AddHttpMessageHandler<MyCustomHttpMessageHandler>() // Using a custom handler
    .AddPolicyHandler(GetRetryPolicy()); // using a Polly handler
```

### Refactor to Typed HTTP clients

This is again a lot better than the initial solution, but we can still continue to improve it.
The last step in the process is to refactor the named client to a typed client.

The reason for this refactor is, just like before, is to improve the maintainability of the code.
In this case, we want to reuse the invocation and logic of an endpoint of the API.
Additionally, we can also keep a reference of all the locations within the application where an endpoint is used.

With a named client we need to duplicate the endpoint if it's used in multiple places, and to keep track of all the places we would be required to use a manual search.

The typed client version adds an abstraction layer on top of the HTTP client and can be compared to just another service.
I like to write the service to wrap each endpoint within a method.
This is useful because we can then also use the "find all references" functionality.

To use a typed client, first, wrap the HTTP client in a class.
The class receives an `HttpClient` instance in the constructor, which is injected by the DI container.
Within the constructor, we can configure the client.

In the example below the `StarWarsHttpClient` acts as the wrapper around the Star Wars API.

```csharp:StarWarsHttpClient.cs
public class StarWarsHttpClient : IStarWarsService
{
    private readonly HttpClient _httpClient;

    public StarWarsHttpClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://swapi.dev/api/");
    }

    public async ValueTask<StarWarsPeople> GetPeople(string peopleId)
    {
        return await _httpClient.GetFromJsonAsync<StarWarsPeople>($"people/{peopleId}");
    }

    public async ValueTask<StarWarsPlanet> GetPlanet(string planetId)
    {
        return await _httpClient.GetFromJsonAsync<StarWarsPlanet>($"planets/{planetId}");
    }

    public async ValueTask<StarWarsSpecies> GetSpecies(string speciesId)
    {
        return await _httpClient.GetFromJsonAsync<StarWarsSpecies>($"species/{speciesId}");
    }
}

public interface IStarWarsService
{
    ValueTask<StarWarsPeople> GetPeople(string peopleId);
    ValueTask<StarWarsPlanet> GetPlanet(string planetId);
    ValueTask<StarWarsSpecies> GetSpecies(string speciesId);
}
```

Then, update the `AddHttpClient` method to use the typed client.
Lastly, inject the client in the consumers instead of using the `IHttpClientFactory`.
The consumer doesn't need to be aware of the endpoints anymore and can just use the methods of the typed client.

```csharp{2, 9, 15, 21}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient<IStarWarsService, StarWarsHttpClient>();

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId, IStarWarsService starwarsService) =>
{
    var people = await starwarsService.GetPeople(peopleId);
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}", async (string speciesId, IStarWarsService starwarsService) =>
{
    var species = await starwarsService.GetSpecies(speciesId);
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}", async (string planetId, IStarWarsService starwarsService) =>
{
    var planet = await starwarsService.GetPlanet(planetId);
    return Results.Ok(planet);
});

app.Run();
```

## Conclusion

Because we've been over a few examples, let's start off by comparing the initial solution with the final refactored solution.

```csharp{8, 15, 22}:InitialProgram.cs
var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId) =>
{
    var httpClient = new HttpClient();
    var people = await httpClient.GetFromJsonAsync<StarWarsPeople>($"https://swapi.dev/api/people/{peopleId}");
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}", async (string speciesId) =>
{
    var httpClient = new HttpClient();
    var species = await httpClient.GetFromJsonAsync<StarWarsSpecies>($"https://swapi.dev/api/species/{speciesId}");
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}", async (string planetId) =>
{
    var httpClient = new HttpClient();
    var planet = await httpClient.GetFromJsonAsync<StarWarsPlanet>($"https://swapi.dev/api/planets/{planetId}");
    return Results.Ok(planet);
});

app.Run();
```

```csharp{2-4, 11, 17, 23}:FinalProgram.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient<IStarWarsService, StarWarsHttpClient>()
    .AddHttpMessageHandler<MyCustomHttpMessageHandler>() // Using a custom handler
    .AddPolicyHandler(GetRetryPolicy()); // using a Polly handler;

var app = builder.Build();

var starwarsGroup = app.MapGroup("starwars");
starwarsGroup.MapGet("people/{peopleId}", async (string peopleId, IStarWarsService starwarsService) =>
{
    var people = await starwarsService.GetPeople(peopleId);
    return Results.Ok(people);
});

starwarsGroup.MapGet("species/{speciesId}", async (string speciesId, IStarWarsService starwarsService) =>
{
    var species = await starwarsService.GetSpecies(speciesId);
    return Results.Ok(species);
});

starwarsGroup.MapGet("planets/{planetId}", async (string planetId, IStarWarsService starwarsService) =>
{
    var planet = await starwarsService.GetPlanet(planetId);
    return Results.Ok(planet);
});

app.Run();
```

By putting both solutions side by side, we can see that the final solution is much more readable and maintainable.

Instead of the duplicated base address and endpoints, we can now define an endpoint once within the typed client and reuse it accross the application. Because a typed client is a class we can easily find all the references of an endpoint. By adding an interface to the typed client, we can also mock the client in our test cases just like any other interface.

Lastly, the client's behavior can be customized by adding custom handlers or by using third-party tools like [Polly](http://www.thepollyproject.org/).

Putting the technical refactor with benefits aside, we also address the infrastructure concerns.
Because the client's lifetime is managed by the `IHttpClientFactory`, we prevent running into port exhaustion and DNS problems.

## More resources

- [Use IHttpClientFactory to implement resilient HTTP requests](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/use-httpclientfactory-to-implement-resilient-http-requests)
- [Make HTTP requests using IHttpClientFactory in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-requests)
