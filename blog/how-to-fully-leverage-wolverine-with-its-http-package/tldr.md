:::code-group

```cs [title=MapPostToWolverine]
// Returns a 200 with an empty response body
// Cascading handlers are invoked
app.MapPostToWolverine<CreateCart>("/carts");

// Returns a 200 with a CartCreated response body
// Cascading handlers are not invoked
app.MapPostToWolverine<CreateCart, CartCreated>("/carts");
```

```cs [title=Endpoint with Before]
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

```cs [title=Endpoint with ProblemDetails]
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

```cs [title=MapWolverineEndpoints]
app.MapWolverineEndpoints(opts =>
{
    opts.SendMessage<CreateCart>(HttpMethod.Post, "/carts");
    opts.PublishMessage<CreateCart>(HttpMethod.Post, "/carts");
});
```

:::
