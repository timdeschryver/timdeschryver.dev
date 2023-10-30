:::code-group

```cs:Program.cs [title=MapPostToWolverine]
// Returns an empty response body with a 200 status code
// Cascading handlers are invoked
app.MapPostToWolverine<CreateCart>("/carts");

// Returns CartCreated within the response body with a 200 status code
// Cascading handlers are not invoked
app.MapPostToWolverine<CreateCart, CartCreated>("/carts");
```

```cs:CreateCartEndpoint.cs [title=Endpoint]
public static class CreateCartEndpoint
{
    [WolverinePost("carts")]
    public static (IResult, CartCreated) Create(
        CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);

        return (TypedResults.Ok(), new CartCreated(cart.Id));
    }
}
```

```cs{3-12}:CreateCartEndpoint.cs [title=Endpoint with Before]
public static class CreateCartEndpoint
{
    public static async Task<(Cart? cart, IResult result)> Before(
        CreateCart command, ShoppingCartDbContext context)
    {
        var cart = await context.Set<Cart>().FindAsync(command.Id);
        return cart switch
        {
            null => (null, WolverineContinue.Result()),
            _ => (cart, Results.BadRequest("Cart already exists"))
        };
    }

    [WolverinePost("carts")]
    public static (IResult, CartCreated) Create(
        CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);

        return (TypedResults.Ok(), new CartCreated(cart.Id));
    }
}
```

```cs{3-16}:CreateCartEndpoint.cs [title=Endpoint with ProblemDetails]
public static class CreateCartEndpoint
{
    public static async Task<ProblemDetails> Before(
        CreateCart command, ShoppingCartDbContext context)
    {
        var cart = await context.Set<Cart>().FindAsync(command.Id);
        return cart switch
        {
            null => WolverineContinue.NoProblems,
            _ => new ProblemDetails
            {
                Detail = "Cart already exists",
                Status = 400
            }
        };
    }

    [WolverinePost("carts")]
    public static (IResult, CartCreated) Create(
        CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);

        return (TypedResults.Ok(), new CartCreated(cart.Id));
    }
}
```

```cs{4}:CreateCartEndpoint.cs [title=Endpoint with EmptyResponse]
public static class CreateCartEndpoint
{
    [WolverinePost("carts")]
    [EmptyResponse]
    public static CartCreated Create(
        CreateCart command, ShoppingCartDbContext context)
    {
        var cart = new Cart(command.Id);
        context.Add(cart);

        return new CartCreated(cart.Id);
    }
}
```

```cs:Program.cs [title=MapWolverineEndpoints]
app.MapWolverineEndpoints(opts =>
{
    opts.SendMessage<CreateCart>(HttpMethod.Post, "/carts");
    opts.PublishMessage<CreateCart>(HttpMethod.Post, "/carts");
});
```

:::
