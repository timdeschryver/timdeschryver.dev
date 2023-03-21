---
title: You can now return unmapped types from raw SQL select statements with Entity Framework 8
slug: you-can-now-return-unmapped-types-from-raw-sql-select-statements-with-entity-framework-8
description: Entity Framework 8 brings a new feature allowing us to execute and return unmapped types from SQL select statements. In this blog post we'll take a quick look at how we can accomplish this, and why this is an important tool to have in your toolkit.
date: 2023-03-21
tags: .NET, Entity Framework, SQL
---

If you're a .NET developer working with relational databases, Entity Framework (EF) is probably your go-to tool, or you at least know about it.
It offers a powerful abstraction layer that makes it easier to persist and retrieve data, and there's a brand new feature that makes EF even better.
Entity Framework Core 8 ([Preview 1](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/whatsnew#raw-sql-queries-for-unmapped-types)) introduces a new feature that I think many of us (at least myself) have been waiting for: the ability to write and execute custom SQL select statements that return an unmapped type. Even if the result type isn't natively supported.

If you haven't heard of Entity Framework, I recommend you check out the [official documentation](https://learn.microsoft.com/en-us/ef/core/get-started/overview/first-app?tabs=netcore-cli/).

In my opinion, EF really shines when you want to persist data to a relational database (the write side).
While querying data (the read side), EF also offers a lot of functionality that makes it easy to retrieve data from the database.

In most of the cases that I've seen, using EF in a .NET application increases the productivity of a team.
The abstraction layer that EF provides eliminates a lot of the otherwise tricky boilerplate code that you have to write yourself.
Because of this, your codebase becomes more readable and maintainable and also contains fewer (regression) bugs.
In short, EF lets you focus more on the business logic of your application.

However, and this could be because I'm a SQL lover, I'm still a fan of writing SQL queries myself.
This is something that EF didn't support, until now.

## How to write raw SQL queries

To write a raw SQL query with EF 8, you can use the `SqlQuery<TResult>` or `SqlQueryRaw<TResult>` methods.
Both methods return the `IQueryable<TResult>` type.

:::warning
It's recommended to use the `SqlQuery` method, as this uses string interpolation for the query parameters.
The `SqlQueryRaw` method simply inserts the parameter strings, which is more prone to SQL injection attacks.
:::

```csharp
IQueryable<OrderDTO> orders = dbContext.Database
    .SqlQuery<OrderDTO>($"SELECT ...");
```

Before EF 8, you could already use the `SqlQuery` method, but this could only be used when the result type was a natively supported element type e.g. a `string` or `int`.
If this wasn't the case, you would get the following exception.

```txt
The element type 'Order' used in 'SqlQuery' method is not natively supported by your database provider.
Either use a supported element type or use ModelConfigurationBuilder.DefaultTypeMapping to define a mapping for your type.
```

With EF 8, the result of a query can be mapped to any type.

:::info
Try it out yourselves.
Get the [latest .NET 8.0 preview version](https://dotnet.microsoft.com/en-us/download/dotnet/8.0):
`winget install Microsoft.DotNet.SDK.Preview`
Then install the prerelease version of Entity Framework:
`dotnet add package Microsoft.EntityFrameworkCore --prerelease`
`dotnet add package Microsoft.EntityFrameworkCore.SqlServer --prerelease`
You're good to go now to play with the new raw SQL queries for unmapped types feature.
:::

## Why raw SQL queries are important

Does this mean that I'm going to write all my queries manually from now on?
No, not really.
But there are cases where using raw SQL statements are useful, or even necessary.

### Types that are not part of your Database model

While the current EF version already supports that you can write your own SQL queries with `FromSql<TEntity>` and its variants, this method only works with types that are part of your database model. It also requires you to return the entity type that's mapped one-on-one, you can't for example leave a few columns out (which are mapped to class or record properties) out of the select statement.

```csharp
IQueryable<Order> order = context.Orders
    .FromSql($"SELECT ...");
```

With the new `SqlQuery` method, you can now write your own SQL queries and map the result to any type that you want.

This is useful for tasks that are not directly related to the day-to-day business of your application.
For example, this can be used to import data, migrate data, or to retrieve data from a legacy system.
Compare this solution with the alternative of adding those types to your database model.
Much cleaner, right?

### Hot code paths

If you have a hot code path, you might want to consider using raw SQL queries.

While EF is a performant tool that continues to improve with each iteration, the generated queries can sometimes be slower than your own SQL queries that you've written.
Because you have fine-grained control over the SQL queries you write, you can optimize these queries to your needs.
This is important on critical paths that handle a lot of traffic or use a lot of data.
These are paths that you want to optimize as much as possible.

You can write queries in a specific way that you know makes it more performant.
Because you can now use custom types, you can only retrieve the data (columns) that you need instead of retrieving all the data and then mapping the entity model in-memory to another model.

### Fewer dependencies

If you're already using raw SQL queries in your application, you're probably using another ORM next to EF, for example [Dapper](https://github.com/DapperLib/Dapper).
With EF 8 having this new feature, you can start to remove extra external or internal dependencies from your codebase.

Using a single ORM library removes the need of extra knowledge of different ORM libraries, which is especially helpful if you're new to the ecosystem.
It also reduces the complexity of having multiple database connections, and more important multiple transactions in your application.

There's an important side note here though, and that's that Dapper currently provides more features (e.g. mapping multiple results at once, or mapping child relations), but this might change in the future.

## Conclusion

I'm really happy that EF 8 now supports raw SQL queries!
EF is already a great tool, but in my opinion the biggest strength of EF is on the write side when we're writing data to the database.
This can otherwise become very messy and error-prone when we have write the insert, update, and delete statements manually.

This new feature makes EF even more powerful, and I'm excited to using this feature in my projects.
It offers more flexibility and control on the read side while querying data from the database.
It doesn't mean that I will only use raw SQL queries from now on to query the database, but it's good to know that we have options.
You can think of it as an extra tool in your toolkit.

In this blog post we've [how](#how-to-write-raw-sql-queries) to write raw SQL queries, and why these are useful in [certain situations](#why-raw-sql-queries-are-important) and remove a couple of otherwise hacky solutions to these problems.

For more information, check out the [EF release notes](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/whatsnew#raw-sql-queries-for-unmapped-types).
