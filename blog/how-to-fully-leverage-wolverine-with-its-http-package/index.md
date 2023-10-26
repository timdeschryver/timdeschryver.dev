---
title: How to fully leverage Wolverine with its HTTP package
slug: how-to-fully-leverage-wolverine-with-its-http-package
description: Taking the next step to keep the architecture and the codebase simple with Wolverine. In this blog post, we'll take a look at the WolverineFx.HTTP package to make the interaction with HTTP requests easier.
date: 2023-10-26
tags: dotnet, Wolverine, CQRS
---

My previous blog post [Wolverine is for the developers](../wolverine-is-for-the-developers/index.md) was an introduction to the Wolverine package, which is created by [Jeremy D. Miller](https://twitter.com/jeremydmiller). In the blog post, we only discovered the surface, but with this post, we'll delve a bit deeper to fully experience Wolverine.

To keep things as simple as possible I like to use vertical slices because it helps to remove unnecessary abstractions and layers.
The examples that are used in the previous blog post show the what and the how of Wolverine, but there's some ceremony involved to orchestrate the flow.

In this post, we'll see how to use Wolverine to [Treat a controller as the application layer](https://timdeschryver.dev/blog/treat-your-net-minimal-api-endpoint-as-the-application-layer).
As you will see in the examples this simplifies your codebase, resulting in a [Minimal Architecture](https://www.dotnetrocks.com/details/1860/).

To refresh our minds, the following example was used in the previously.

```cs
app.MapPost("/carts", ([AsParameters] CreateCartRequest request)
    => request.Bus.InvokeAsync(request.command, request.CancellationToken));

public record CreateCart(Guid Id);
public record CreateCartRequest(CreateCart command, IMessageBus Bus, CancellationToken CancellationToken);

public static class CartHandler
{
    public static CartCreated Handle(CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);
        return new CartCreated(cart.Id);
    }
}
```

Within this code, we notice two things:

1. There's the `/carts` POST endpoint that invokes the "Wolverine Bus" and sends it a command
2. There's a `CartHandler` class that handles the incoming command

I specifically want to highlight the first point. While this doesn't seem like a big thing, it adds a little noise.
Using the [WolverineFx.HTTP](https://www.nuget.org/packages/WolverineFx.Http/) NuGet package, we can further reduce some moving parts.
Not only does this result in a better experience in dealing with HTTP requests, it's also an improvement to the performance (although this might be negligible).

```bash
dotnet add package WolverineFx.HTTP
```

In the next sections, we'll cover the possibilities.

## Bus invocations using `app.MapVERBToWolverine`

Using a minimal API the above code can be refactored using the `MapPostToWolverine` method (or the `MapPutToWolverine` or `MapDeleteToWolverine` methods).
This will do the exact same thing, but shorter.

The bus is invoked using the request body of the request.
This will use the generic type to parse the body into an object.

```cs
// Returns a 200 with an empty response body
// Cascading handlers are invoked
app.MapPostToWolverine<CreateCart>("/carts");

// Returns a 200 with a CartCreated response body
// Cascading handlers are not invoked
app.MapPostToWolverine<CreateCart, CartCreated>("/carts");
```

More information can be found in the [HTTP Services Documentation](https://wolverine.netlify.app/guide/http/#http-services-with-wolverine).

## Endpoints

Endpoints use the Request EndPoint Response (REPR) approach
Using the Wolverine attributes (`[WolverineVerb]`), which are equivalent to the ASP.NET attributes (`[HTTPVerb]`), an endpoint turns into a handler and vice versa.
For example, a POST endpoint using `HttpPost` turns into `WolverinePost`.

```cs
public static class CreateCartEndpoint
{
    [WolverinePost("carts")]
    public static (IResult, CartCreated) Create(CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);


        // The first object is used as the response body
        // The following objects are cascading messages
        return (TypedResults.Ok(), new CartCreated(cart.Id));
    }
}
```

Just as handlers, endpoints have the additional benefit that some orchestration code can be extracted into a `Before` (or `Load`) method.
In the example below we use the `Before` to orchestrate the next flow:

- when a cart already exists, Wolverine short-circuits the request and a `BadRequest`, the `Create` method is not invoked in this case;
- when the cart doesn't exist, the `Create` method is invoked because the `Before` method returns a `WolverineContinue` instance;

```cs
public static class CreateCartEndpoint
{
    public static async Task<(Cart? cart, IResult result)> Before(CreateCart command, ShoppingCartDbContext context)
    {
        var cart = await context.Set<Cart>().FindAsync(command.Id);
        return cart is null
            ? (null, WolverineContinue.Result())
            : (cart, Results.BadRequest("Cart already exists"));
    }

    [WolverinePost("carts")]
    public static (IResult, CartCreated) Create(CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);

        return (TypedResults.Ok(), new CartCreated(cart.Id));
    }
}
```

Although this isn't a perfect example, using the `Before` helper method keeps the handler's logic of handling the request to the point and **easy to test**.
In other words, it turns the handler into a pure function (in most of the cases).
A better example is that `Before` returns the associated entity to the handler.
Because the handler receives the entity (instead of having to fetch it), which is fetched in `Before` and passed along, this results in a simpler test. Within the test case, a mock implementation of the database is probably unneeded with this approach.

Because the handler doesn't require a fetched entity, the above implementation can be refactored using the Problem Details specification.
Instead of using `WolverineContinue.Result()` to continue the request, we have to use `WolverineContinue.NoProblems` here.

```cs
public static class CreateCartEndpoint
{
    public static async Task<ProblemDetails> Before(CreateCart command, ShoppingCartDbContext context)
    {
        var cart = await context.Set<Cart>().FindAsync(command.Id);
        if (cart is not null)
            return new ProblemDetails
            {
                Detail = "Cart already exists",
                Status = 400
            };

        return WolverineContinue.NoProblems;
    }

    [WolverinePost("carts")]
    public static (IResult, CartCreated) Create(CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);

        return (TypedResults.Ok(), new CartCreated(cart.Id));
    }
}
```

More info can be found in the [Endpoint Documentation](https://wolverine.netlify.app/guide/http/endpoints.html).

## MapWolverineEndpoints

The last option is to use `MapWolverineEndpoints`.
`MapWolverineEndpoints` can be used to configure the Wolverine HTTP pipeline, which we won't go into in this post.

Within the callback, endpoints can be configured to send or publish incoming requests.
Just as with the [MapVERBToWolverine](#bus-invocations-using-appmapverbtowolverine) approach, these methods expect a generic type to parse the body before it's sent/published to the bus.
These are just fire-and-forget endpoints that don't return a response, but an acknowledgment that the request is received (202 Accepted).

```cs
app.MapWolverineEndpoints(opts =>
{
    opts.SendMessage<CreateCart>(HttpMethod.Post, "/carts");
    opts.PublishMessage<CreateCart>(HttpMethod.Post, "/carts");
});
```

## Conclusion

In this blog post, we covered some basic functionality of the `WolverineFx.HTTP` package.
Using this package results in a simpler architecture by removing the need to manually communicate with the bus.

An indirect result, which isn't brought up, is that the Wolverine HTTP package helps to keep results (using [ProblemDetails](https://wolverine.netlify.app/guide/http/problemdetails.html)) and result codes consistent across the whole API.

The handler keeps the same benefits that were discussed in [Wolverine is for the developers](../wolverine-is-for-the-developers/index.md).
