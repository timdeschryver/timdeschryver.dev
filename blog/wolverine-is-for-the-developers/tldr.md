## Examples

:::code-group

```cs [title=Create Cart]
using Wolverine;

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

```cs [title=Add Cart Item]
using Wolverine;

app.MapPost("/carts/add-item", ([AsParameters] AddItemRequest request)
    => request.Bus.InvokeAsync(request.command, request.CancellationToken));

public record AddItem(Guid CartId, string Sku, int Amount);
public record AddItemRequest(AddItem command, IMessageBus Bus, CancellationToken CancellationToken);

public static class AddCartItemHandler
{
    public static async ValueTask<Cart?> LoadAsync(AddItem command, ShoppingCartDbContext context, CancellationToken cancellationToken)
    {
        var cart = await context.FindAsync<Cart>(command.CartId, cancellationToken);
        return cart ?? throw new ApplicationException("Cart not found");
    }

    public static CartItemAdded Handle(AddItem command, Cart cart, ShoppingCartDbContext context)
    {
        var item = cart.Items.SingleOrDefault(i => i.Sku == command.Sku);
        if (item is null)
        {
            item = new CartItem(command.Sku, command.Amount);
            cart.Items.Add(item);
        }
        else
        {
            item.Amount += command.Amount;
        }

        context.Update(cart);
        return new CartItemAdded(cart.Id, item.Sku, item.Amount);
    }
}
```

```cs [title=Remove Cart Item]
using Wolverine;

app.MapPost("/carts/remove-item", ([AsParameters] RemoveItemRequest request)
    => request.Bus.InvokeAsync(request.command, request.CancellationToken));

public record RemoveItem(Guid CartId, string Sku, int Amount);
public record RemoveItemRequest(RemoveItem command, IMessageBus Bus, CancellationToken CancellationToken);

public static class RemoveCartItemHandler
{
    public static async ValueTask<Cart?> LoadAsync(RemoveItem command, ShoppingCartDbContext context,
        CancellationToken cancellationToken)
    {
        var cart = await context.FindAsync<Cart>(command.CartId, cancellationToken);
        return cart ?? throw new ApplicationException("Cart not found");
    }

    public static IEnumerable<object> Handle(RemoveItem command, Cart cart, ShoppingCartDbContext context)
    {
        var item = cart.Items.SingleOrDefault(i => i.Sku == command.Sku);
        if (item is not null)
        {
            item.Amount -= command.Amount;
            if (item.Amount < 0)
            {
                throw new ApplicationException("Can't remove more items than there are in the cart");
            }

            context.Update(cart);
            yield return new CartItemRemoved(cart.Id, item.Sku, item.Amount).DelayedFor(10.Minutes());
        }
    }
}
```

:::

## Config

```cs:Program.cs
builder.Host.UseWolverine((context, opts) =>
{
    opts.Services.AddDbContextWithWolverineIntegration<ShoppingCartDbContext>(x =>
        x.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer")), "wolverine");
    opts.PersistMessagesWithSqlServer(builder.Configuration.GetConnectionString("SqlServer"), "wolverine");
    opts.UseEntityFrameworkCoreTransactions();
    opts.Policies.AutoApplyTransactions();
    opts.Policies.UseDurableInboxOnAllListeners();
    opts.Policies.UseDurableOutboxOnAllSendingEndpoints();
});
```
