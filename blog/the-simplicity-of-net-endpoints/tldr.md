The new Endpoints feature of .NET 6 makes handling incoming requests simple.
An endpoint can be extracted into a separate class, which makes sure that **the code fits in your head**.
Besides resolving route parameters and request bodies, the request handler also can inject dependencies from the dependency container.

Besides the simplicity, an additional benefit of ASP.NET endpoints is that they're faster than controller based APIs [faster](https://devblogs.microsoft.com/aspnet/asp-net-core-updates-in-net-6-preview-4/).

## Inline Endpoint

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

## Refactored into a Module with Endpoints

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
