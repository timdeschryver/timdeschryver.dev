---
title: The decorator pattern using .NET's dependency injection
slug: the-decorator-pattern-using-nets-dependency-injection
description: Taking leverage of the decorator pattern to add extra behavior to existing an implementation. We first see how to do this manually, before taking a look at Scrutor to simplify this task.
date: 2023-12-22
tags: .net
---

## The Problem

Imagine you have a (globally used) interface (from your own, or from a 3rd party) in your codebase and you want to introduce common behavior that needs to apply to all instances. Let's say you want to add extra logging, build resiliency, or add some caching. How would you tackle this problem?

One way to achieve this is by creating a new (abstract) class that contains the new behavior, and then inherit from this class in all derived classes.
This might seem the most straightforward thing to do, but there are a few problems that you'll encounter immediately or in the future:

- you have to modify the code within the derived classes to invoke the parent's behavior
- when the implementation changes in the future, you might need to update derived classes again
- derived classes might become harder to test
- what will you do when you need to add additional behavior?

While this implementation seemed simple at first, there are a few gotcha's to take into consideration.
It even becomes impossible to maintain if you want to add the behavior to all inheritors of an interface.

## The (Manual) Solution

Instead, it's probably better to resort to the [Decorator pattern](https://en.wikipedia.org/wiki/Decorator_pattern), from the "Gang of Four" book.
In this blog post, we'll look at how we can leverage the dependency injection (DI) container to implement the decorator pattern.

The decorator pattern is a structural design pattern that allows you to introduce some new behavior to an existing class, without affecting the original class. It achieves this by enclosing a class with one (or more) decorator classes, which delegate method calls to the linked class.

You can think of the decorator pattern as a clothing layering system.
As a runner this resonates with me, especially in the colder months.
When the temperature drops, I still wear the same clothes as with "normal" weather, but I add an extra layer on top to keep me warm.
When it rains, I add a waterproof jacket to keep my dry.
The base layer doesn't change through the colder months, but extra layers are added depending on the weather conditions.

> There’s no such thing as bad weather, only bad clothes - a Norwegian saying

The same philosophy applies to the decorator pattern.
Extra layers are added to an existing implementation to add extra functionality to it.

Let's take a look at an example.
In the example below we define a decorator that logs a message before and after the `Get` method of a repository (`IRepository`) is invoked.

The decorator `RepositoryLoggerDecorator` receives the "inner" repository `IRepository<T>`, which is the real instance (or a decorated instance), and wraps it with its own implementation. In its implementation, the messages are logged, and the decorated version invokes the inner method.

```cs RepositoryLoggerDecorator.cs
public class RepositoryLoggerDecorator<T>(
    IRepository<T> repository,
    ILogger<IRepository<T>> logger)
    : IRepository<T> where T : class
{
    public async Task<T> Get()
    {
        logger.LogInformation("Before calling Get() on {Repository}", typeof(T).Name);
        var result = await repository.Get();
        logger.LogInformation("After calling Get() on {Repository}", typeof(T).Name);
        return result;
    }
}
```

As you can see within the above snippet, the repositories implementation hasn't changed.
If that were the case, multiple repositories would need to be updated.
Or, if we went with inheritance, then all derived classes had to inject an `ILogger` instance to pass it to the parent class.

To decorate a repository with the `RepositoryLoggerDecorator`, configure the DI container to new up a decorated instance and pass it the required dependencies.

```cs Program.cs
builder.Services.AddScoped<Repository<Customer>>();
builder.Services.AddScoped<IRepository<Customer>>(provider =>
{
    var repository = provider.GetRequiredService<Repository<Customer>>();
    var logger = provider.GetRequiredService<ILogger<IRepository<Customer>>>();
    return new RepositoryLoggerDecorator<Customer>(repository, logger);
});
```

Now every time an `IRepository<Customer>` instance is requested, this will resolve to the decorated version.
Voila, we achieved the decorator pattern with .NET's dependency injection.

## The (Automatic) Solution by using Scrutor

The above implementation has a downside.
We have to resort to a factory function to manually instantiate the decorator.
This leaks some implementation details, and we'll have to update the factory every time the constructor arguments change.

By bringing in [Scrutor](https://github.com/khellang/Scrutor), we can make this simpler and less brittle.
Although Scrutor is mostly known for its assembly scanning capabilities, it also includes an extension to decorate instances with ease.

To use Scrutor, first install the NuGet package with the following command (or via the UI).

```bash
dotnet add package Scrutor
```

Next, update the DI configuration to make use of the `Decorate` method of Scrutor instead of doing this manually by using a factory method.
In the next snippet `Decorate` will decorate `IRepository<Customer>` using the `RepositoryLoggerDecorator` class.

```cs Program.cs
builder.Services.AddScoped<IRepository<Customer>, CustomerRepository>();
builder.Services.Decorate<IRepository<Customer>, RepositoryLoggerDecorator<Customer>>();
```

:::warning
Make sure to first register the derived classes to the DI container while using this pattern.
Otherwise, this will result in an error that the required service (`IRepository<Customer>`) cannot be found.
:::

We can make this even simpler by using the following overload for `Decorate`.
This will decorate all generic instances of `IRepository<T>` using the `RepositoryLoggerDecorator`.

For example, in the next snippet both `IRepository<Customer>` and `IRepository<Order>` will be decorated.

```cs Program.cs
builder.Services.AddScoped<IRepository<Customer>, CustomerRepository>();
builder.Services.AddScoped<IRepository<Order>, OrderRepository>();
builder.Services.Decorate(typeof(IRepository<>), typeof(RepositoryLoggerDecorator<>));
```

Finally, to automatically register all `IRepository<T>` instances, we can make use of the scanning capabilities of Scrutor.

```cs Program.cs
builder.Services.Scan(scan => scan
    .FromAssembliesOf(typeof(IRepository<>))
    .AddClasses(classes => classes.AssignableTo(typeof(IRepository<>)))
    .AsImplementedInterfaces()
    .WithScopedLifetime());
builder.Services.Decorate(typeof(IRepository<>), typeof(RepositoryLoggerDecorator<>));
```

:::info
To get to know how Scrutor implements this, I recommend [Andrew Lock](https://twitter.com/andrewlocknet)'s article [Adding decorated classes to the ASP.NET Core DI container using Scrutor](https://andrewlock.net/adding-decorated-classes-to-the-asp.net-core-di-container-using-scrutor/#scrutor-behind-the-curtain-of-the-decorate-method).
:::

## Conclusion

Using the decorator pattern it's possible to add extra functionality on top of an existing implementation without changing the original code.
In this blog post, we've seen that the DI container of .NET allows us to configure specific instances with a decorator.
To make this simpler we can bring in Scrutor to automate this configuration.
