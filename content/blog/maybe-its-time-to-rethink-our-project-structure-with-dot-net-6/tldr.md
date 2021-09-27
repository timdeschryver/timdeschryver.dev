Organize your project by domain, don't divide the application into technical slices.

The main benefits of this architecture are:

- gives us a better understanding of a (sub)domain, which makes it easier to navigate the code
- a module is self-contained, and it's easy to see what a module needs and what it does
- it's adaptable, simple domains can look different from complex domains
- less code == fewer bugs
- you get a plug-in system, which makes it easy to move modules around

```txt:tree
WebApplication
│   appsettings.json
│   Program.cs
│   WebApplication.csproj
│
├───Modules
│   ├───Cart
│   │      CartModule.cs
│   └───Orders
│       │   OrdersModule.cs
│       ├───Endpoints
│       │       GetOrder.cs
│       │       PostOrder.cs
│       ├───Core
│       │       Order.cs
│       │───Ports
│       │       IOrdersRepository.cs
│       │       IPaymentService.cs
│       └───Adapters
│               OrdersRepository.cs
│               PaymentService.cs
```

```cs:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.RegisterOrdersModule();

var app = builder.Build();
app.MapOrdersEndpoints();
app.Run();
```

```cs:Modules/Orders/OrdersModule.cs
public class OrdersModule
{
    public IServiceCollection RegisterOrdersModule(IServiceCollection services)
    {
        services.AddSingleton(new OrderConfig());
        services.AddScoped<IOrdersRepository, OrdersRepository>();
        services.AddScoped<ICustomersRepository, CustomersRepository>();
        services.AddScoped<IPayment, PaymentService>();
        return services;
    }

    public IEndpointRouteBuilder MapOrdersEndpoints(IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/orders/{orderId}", GetOrder.Handle);
        endpoints.MapPost("/orders", PostOrder.Handle);
        return endpoints;
    }
}
```

```cs:Modules/Orders/Endpoints/GetOrder.cs
public static class GetOrder
{
    public static async Task<IResult> Handle(int orderId, IOrdersRepository ordersRepository)
    {
        var order = await ordersRepository.Get(orderId);
        return Results.Ok(order);
    }
}
```
