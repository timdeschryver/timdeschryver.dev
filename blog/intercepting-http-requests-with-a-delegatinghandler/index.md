---
title: Intercepting HTTP requests with a DelegatingHandler
slug: intercepting-http-requests-with-a-delegatinghandler
description: How and why you should use a DelegatingHandler to extract common HTTP request behavior.
date: 2023-11-30
tags: .NET
---

Intercepting HTTP requests is a way to extract common infrastructure logic that you don't want to have in your application code.
It allows you to perform some logic before the request is made, or after the response is received.
In ASP.NET an interceptor can be implemented by using a [`DelegatingHandler`](https://learn.microsoft.com/en-us/dotnet/api/system.net.http.delegatinghandler?view=net-8.0).

A use case for an interceptor is adding a header, e.g. the Authorization header, to the HTTP request.
When this is a static value, configuring a default header during the [setup of an `HttpClient`](../refactor-your-net-http-clients-to-typed-http-clients/index.md#configure-http-clients) is the better and easier choice, but when the authorization's header value needs to be dynamic then this isn't an option.
Another use case might be logging purposes, or handling errors that might occur.
In this blog post, I'll be using the use case of adding a request header to zoom into the implementation.

As a general best practice we don't want to insert (common) technical behavior within the application's logic.
Invoking HTTP requests is no different.
We don't want to pollute how HTTP requests are made with too many details.
We also need to watch out that this logic isn't shattered all over the place.
If we're not attentive we might end up with different versions of its implementation, and when the requirements should change in the future we need to find and modify the new behavior in multiple locations.
This is error-prone and time-consuming.

`DelegatingHandler`s is a solution to this problem by providing a central point where that logic can exist.
Common behavior can be written once, and is automatically applied to all made HTTP requests (for a given HTTP client).
Because the common logic is extracted it also becomes easier to write tests and to change its behavior in the future when requirements are changed.

## Implementing a `DelegatingHandler`

Let's take a look at an example implementation to add a header to the requests using a `DelegatingHandler`.

```cs ExternalServiceAuthenticationHeaderHttpInterceptor.cs {4-11}
public class ExternalServiceAuthenticationHeaderHttpInterceptor(
    IOptions<ExternalServiceAuthenticationOptions> externalAuthenticationOptions) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var bearerToken = CreateBearerToken();
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);

        var response = await base.SendAsync(request, cancellationToken);
        return response;
    }

    private string CreateBearerToken()
    {
        // Implementation here...
        return "eyJhbGciPSA=....";
    }
}
```

:::info
If the class constructor's syntax is a bit funky, be sure to check out the [Primary Constructor](/bits/the-evolution-of-csharp-constructors) syntax, which is added in C# 12.
:::

## Configuration

To make use of the delegating handler, add it within the DI container and register the handler to a specific HTTP client using `AddHttpMessageHandler`.

```cs Program.cs {3, 5-11}
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<ExternalServiceAuthenticationHeaderHttpInterceptor>();

builder.Services
    .AddHttpClient<IExternalClient, ExternalClient>("external-service", b =>
    {
        var url =  builder.Configuration.GetSection("ExternalService:Url").Value;
        b.BaseAddress = new Uri(url);
    })
    .AddHttpMessageHandler<ExternalServiceAuthenticationHeaderHttpInterceptor>();


var app = builder.Build();
app.UseHttpsRedirection();
app.Run();
```

After these changes requests that are invoked via the `ExternalClient` will pass through the `ExternalServiceAuthenticationHeaderHttpInterceptor` delegating handler.

## Conclusion

In this blog post, I've shown how to implement a `DelegatingHandler`.
A `DelegatingHandler` allows us to intercept an HTTP request to perform common behavior before a request is fired or after a response is received.

This helps to remove redundant code, keeping the application's logic clean and compact.
The dev team doesn't need to pay attention to this detail while reading existing code, nor does the team need to be reminded of this behavior while writing new functionality that interacts with the service.

For more information about `DelegatingHandler`s, check out the official [documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-requests?view=aspnetcore-8.0#outgoing-request-middleware).
