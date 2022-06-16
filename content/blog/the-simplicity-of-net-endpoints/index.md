---
title: The simplicity of ASP.NET Endpoints
slug: the-simplicity-of-net-endpoints
description: Keepings it simple with ASP.NET Endpoints and its dependency system
author: Tim Deschryver
date: 2021-10-05
tags: .NET, csharp, architecture
banner: ./images/banner.jpg
published: true
---

In this post, we continue where we left off in [Maybe it's time to rethink our project structure with ASP.NET 6](/blog/maybe-its-time-to-rethink-our-project-structure-with-dot-net-6), and we're going to take a closer look at an Endpoint.

The short recap of that post is that there are benefits by dividing an application into domain modules instead of grouping files by technical tiers, which is also known as the [vertical slice architecture](https://jimmybogard.com/vertical-slice-architecture/). The biggest benefit is that the code is simpler and more adaptable to changes, this plays nice with the new Endpoint feature of ASP.NET 6.

In this post, we're taking a closer look at an endpoint and see how we can leverage the ASP.NET 6 dependency system to keep things simple.

```txt{9-11}:tree
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
│
├───Modules
│   └───Customers
│       │   CustomersModule.cs
│       ├───Endpoints
│       │       GetCustomer.cs
│       │       BlockCustomer.cs
│       ├───Core
│       │       Customer.cs
```

In traditional MVC ASP.NET API applications, you'll find controllers that include one or more routes.
Because of this, the controller quickly becomes bloated and it often requires multiple constructor arguments. In production code, this isn't something that we have to think of because the dependency framework of your choice takes care of this. But still, a constructor that takes a lot of arguments is a bad practice and might be a problem in the future (e.g. when you need to move things around), if it isn't already causing troubles (e.g. in test setups).

To give an example, we start with the following controller.
In this case, we're keeping the example lightweight and only add one dependency to the customers' repository.
The controller has 2 routes, a `GET` and a `PUT`, the implementation of both routes are written inline in the controller file.

```cs:Controllers/CustomersController.cs
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomersRepository _customersRepository;

    public CustomersController(ICustomersRepository customersRepository)
    {
        _customersRepository = customersRepository;
    }

    [HttpGet("{customerId}")]
    public async Task<IActionResult> GetCustomer(string customerId)
    {
        var customer = await _customersRepository.GetCustomer(customerId);
        return Ok(customer);
    }

    [HttpPut("block/{customerId}")]
    public async Task<IActionResult> BlockCustomer(string customerId, BlockCustomer blockCustomer)
    {
        var customer = await _customersRepository.GetCustomer(customerId);
        customer.Block(blockCustomer.Reason);
        await _customersRepository.Save(customer);
        return Ok();
    }
}
```

This is still pretty straightforward, but things can get messy fast with this approach.

That's one of the reasons why I think that a lot of teams have shifted towards using the [Mediator pattern](https://en.wikipedia.org/wiki/Mediator_pattern), more specific towards the [MediatR](https://github.com/jbogard/MediatR) package.

Using MediatR results in a low coupling between the routes of a controller and the implementation of the request, thus the request handlers can evolve independently from each other.

An incoming requests gets mapped in the controller to a MediatR request, often suffixed with `Query` or `Command`, and is then sent to the mediator pipeline.

The result is that the controller:

- goes from possible multiple dependencies to only one dependency, the `IMediator` instance
- has less (almost no) code because the route implementations are extracted into separate `IRequest` handlers, the route only acts as a dispatcher to send the request to a handler

The refactored controller, using MediatR, now looks like this:

```cs:Controllers/CustomersController.cs
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{customerId}")]
    public async Task<IActionResult> GetCustomer(string customerId)
    {
        var customer = await _mediator.Send(new GetCustomerQuery(customerId));
        return Ok(customer);
    }

    [HttpPut("block/{customerId}")]
    public async Task<IActionResult> BlockCustomer(string customerId, BlockCustomer blockCustomer)
    {
        await await _mediator.Send(new BlockCustomerCommand(customerId, blockCustomer.Reason));
        return Ok();
    }
}
```

To give you the full picture, the associate handler of the `BlockCustomerCommand` request looks like this.
It's simply a copy-paste of the route's code to the `Handle` method of the request handler.

```cs:Commands/BlockCustomerCommandHandler.cs
public class BlockCustomerCommandHandler : IRequestHandler<BlockCustomerCommand>
{
    private readonly ICustomersRepository _customersRepository;

    public BlockCustomerCommandHandler(ICustomersRepository customersRepository)
    {
        _customersRepository = customersRepository;
    }

    public async Task<Unit> Handle(BlockCustomerCommand command, CancellationToken cancellationToken)
    {
       var customer = await _customersRepository.Get(command.CustomerId, cancellationToken);
       customer.Block(command.Reason);
       await _customersRepository.Save(customer, cancellationToken);
       return Unit.Value;
    }
}
```

This is better than before _though it might not be clearly visible based on this trivial example_.

But now we can go a step further and simplify the code by rewriting the request handler as an endpoint.
The endpoint expects 2 arguments, a pattern and a [RequestDelegate](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.http.requestdelegate?view=aspnetcore-6.0).

You can think of the pattern as the `Route` attribute from the MVC controller, and the request delegate as a function that is called when the endpoint is hit. The arguments of the request delegate are resolved from the request, and also from the configured services of the dependency container.

```cs{5-11}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddTransient<ICustomersRepository, CustomersRepository>();

var app = builder.Build();
app.MapPut("customers/block/{customerId}", async ([FromRoute] string customerId, [FromBody] BlockCustomer blockCustomer, [FromServices] ICustomersRepository customersRepository) =>
{
    var customer = await _customersRepository.Get(command.CustomerId);
    customer.Block(command.Reason);
    await _customersRepository.Save(customer);
    return Results.Ok();
});
```

We can also emit the attribute tags, the shorthand version of the above snippet becomes:

```cs{5-11}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddTransient<ICustomersRepository, CustomersRepository>();

var app = builder.Build();
app.MapPut("customers/block/{customerId}", async (string customerId, BlockCustomer blockCustomer, ICustomersRepository customersRepository) =>
{
    var customer = await _customersRepository.Get(command.CustomerId);
    customer.Block(command.Reason);
    await _customersRepository.Save(customer);
    return Results.Ok();
});
```

This is similar to what we already had with MVC controllers, except that the dependency injection is handled by the endpoint itself.

By following the `IModule` convention, we can easily refactor this code and move the handler to its own file, a la MediatR.
Doing this gives us the following result:

```cs{9-14}:Modules/Customers/CustomersModule.cs
public class CustomersModule : IModule
{
    public IServiceCollection RegisterModule(IServiceCollection services)
    {
        services.AddTransient<ICustomersRepository, CustomersRepository>();
        return services;
    }

    public IEndpointRouteBuilder MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("customers/{customerId}", GetCustomer.Handler);
        endpoints.MapPut("customers/block/{customerId}", BlockCustomer.Handler);
        return endpoints;
    }
}
```

And the extracted handler:

```cs:Modules/Customers/Endpoints/BlockCustomer.cs
public static class BlockCustomer
{
    public static async Task<IResult> Handler(string customerId, BlockCustomer blockCustomer, ICustomersRepository customersRepository)
    {
        var customer = await _customersRepository.Get(command.CustomerId);
        customer.Block(command.Reason);
        await _customersRepository.Save(customer);
        return Results.Ok();
    }
}
```

This is similar to what we're used to but it's simpler and doesn't require a dependency on MediatR to handle an incoming request. You can even get rid of MediatR entirely if you're just using MediatR to send requests to handlers.

## Conclusion

The new Endpoints feature of ASP.NET 6 makes handling incoming requests simple.
An endpoint can be extracted into a separate class, which makes sure that **the code fits in your head**.
Besides resolving route parameters and request bodies, the request handler also can inject dependencies from the dependency container.

Besides the simplicity, an additional benefit of ASP.NET endpoints is that they're faster than controller based APIs [faster](https://devblogs.microsoft.com/aspnet/asp-net-core-updates-in-net-6-preview-4/).

> These new routing APIs have far less overhead than controller-based APIs. Using the new routing APIs, ASP.NET Core is able to achieve ~800k RPS in the [TechEmpower JSON benchmark](https://www.techempower.com/benchmarks/) vs ~500k RPS for MVC.
