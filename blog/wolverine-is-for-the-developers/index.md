---
title: Wolverine is for the developers
slug: wolverine-is-for-the-developers
description: Keep your codebase simple by introducing Wolverine. As you'll notice in this blog post, Wolverine helps to reduce complexity and brings a lot of functionality without the hassle and the noise.
date: 2023-10-05
tags: .NET, CQRS
---

In this blog post, we'll take a quick look at [Wolverine](https://wolverine.netlify.app/), which is part of the [Critter Stack](https://github.com/JasperFx).

From looking at the documentation, the tagline of Wolverine is "Next Generation .NET Mediator and Message Bus".

Yes, yet another .NET Mediator and Message Bus.
I can already hear a sigh, but Wolverine is built differently.

The first thing that might look odd is that it's two libraries in one.
Where most libraries focus on being a Mediator implementation or a Message Bus implementation, Wolverine is both.
In my eyes, it makes sense because both share similarities, and doing one good helps to elevate the other.

I'll take another route for this blog post and instead of writing a bunch of words, I'll just let the code speak.
What you see next is some code to create a shopping cart, and add or remove some items from it.
Where each action (creating a new cart, adding an item, removing an item) is a [vertical slice](https://event-driven.io/en/vertical_slices_in_practice/).

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

So by taking a look at the examples, what would you expect this code to do, or how would this work?

If you already have experience with similar libraries, e.g. MediatR or Azure Service Bus, the examples should be familiar to you.
But, on the other hand, there are a few differences.

If you're not familiar with this kind of architecture, the above examples each declare an endpoint using Minimal APIs.
Where each endpoint sends a command to the "bus" `IMessageBus`.
Using the handler classes the behavior of a command is implemented within the `Handle` method of the class.
Based on the command that's sent to the bus, the appropriate handler is invoked and receives the command as its input argument.

What strikes my eyes, is that it's just code that you write like in any other place.
There's no bloat, and the handlers are just methods that receive input arguments.
The only reference, thus far, within the examples to Wolverine, is the `IMessageBus` interface.

Unlike many Wolverine alternatives, we don't have to decorate our code, nor do you see interfaces to declare the intent of certain classes (e.g. `IRequest` or `IHandler`).

This is because Wolverine makes use **Roslyn for Runtime Code Generation** to reduce most (if not all?) the ceremony/orchestration code (read boilerplate code), for example, to glue the correct handler to the appropriate command behind the scenes. It can do this because it relies on conventional approaches (which can be disabled if that's preferred).

:::info
If this (good) magic is a bit too much, you can always inspect and debug the generator code as described in [Unraveling the Magic in Wolverine](https://jeremydmiller.com/2023/10/02/unraveling-the-magic-in-wolverine/).
:::

But there's more to it than meets the eye.
From simply looking at the code, you'd think that this is everything that's happening.
But, that's not the case.
The reason why I titled this blog post as "Wolverine is for the developers", is because I think it has a great **Developer Experience**, as you'll see in a minute. By taking a look at the documentation or the samples, you'll notice that many daunting tasks are opt-in in Wolverine and that there's put a lot of thought into the workflow of a developer with the intention to keep things as accessible and simple as possible.

When we take a closer look at the `AddCartItemHandler` and `RemoveCartItemHandler` examples, you'll notice two methods in the handler classes, the `LoadAsync` and `Handle` methods.

The `LoadAsync` method is invoked first to read/retrieve the data that's needed to handle the command or message, and the `Handle` method contains the important logic.
Using source generators, Wolverine transforms this code and will pass the retrieved data within the `LoadAsync` method to the `Handle` method.
This is optional and you can do both within the `Handle` method, but I like this design as there's a clear separation between the "building blocks" and business logic. We can say that the `Handle` method is a pure function now.

You can also notice that the `Handle` method can become synchronous because of it.

This design also has a positive side effect on our test cases.
With this small change testing is easier than before, instead of mocking the abstraction to the database, we can simply test the method that includes the business logic.
Within the test, we don't need to worry about the communication to our database, because the `Handle` method is just a pure function that can easily be invoked and tested.

Within the example, you'll also notice that all handlers return an object, more specifically an event message, which is just a class.
The handler methods can also return nothing (`void`), or can return one or more messages that can be asynchronously consumed by other handlers in the background.
This is also a plus because it reduces the code that affects the readability and the test setup of the `Handle` method.
Instead of introducing the bus instance within the handler (and corresponding tests), the handler can focus on what matters most, its logic.

But, it doesn't stop here.
What you don't see within the snippets, but what you get for free is:

- an optional **transaction** around the handler, including a durable outbox (meaning that outgoing messages will only be processed when the command has successfully completed)
- automatic **retry-ability**, incoming and outgoing messages are persisted, and can be retried later on when needed

All of this can be achieved without Wolverine, but it introduces complexity and possibly a lot of noise.
Also, if you do this manually, inconsistencies within the code will probably occur, together with some issues and bugs.
Having Wolverine taking care of all of this keeps things simple, and serves as a solid base.

Of course, a little bit of configuration needs to happen to make all of this work.
Luckily this is straightforward, as you can see in the next snippet.

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

The above threats all handlers in the same way, but you can also be more specific if needed.

We didn't go into very detailed examples in this blog post and mainly talked about the simplicity that comes when introducing Wolverine into a codebase.
Besides the discussed basic functionality, Wolverine brings a lot more to the table.
See the next entry points to the documentation for more information (maybe these will lead to future blog posts):

- [Message Versioning (with transforms)](https://wolverine.netlify.app/guide/messages.html#versioned-message-forwarding)
- [Multi-Tenancy](https://wolverine.netlify.app/guide/handlers/multi-tenancy.html)
- [Telemetry](https://wolverine.netlify.app/guide/logging.html)
- [Test Automation Support](https://wolverine.netlify.app/guide/testing.html)
- [ASP.NET Core Integration](https://wolverine.netlify.app/guide/http/integration.html) (write "handlers" within ASP.NET endpoints)
- [Sagas](https://wolverine.netlify.app/guide/durability/sagas.html) (for process managing)
- [Different built-in transport options](https://wolverine.netlify.app/guide/messaging/transports/local.html) (SQL/Entity Framework, RabbitMQ, Azure Service Bus, Amazon SQS, and TCP)

## Conclusion

From the moment that I discovered Wolverine (almost the same time that it was introduced), I was amazed at how developer-friendly it is.
Features that otherwise might take a while to get right are built into the library.
This is personal, but I also like the conventional approach over the explicitness, which adds noise to the codebase.

If this has piqued your interest, I can recommend checking out [Jeremy D. Miller](https://twitter.com/jeremydmiller)'s [blog posts](https://jeremydmiller.com/?s=Wolverine) about Wolverine.
