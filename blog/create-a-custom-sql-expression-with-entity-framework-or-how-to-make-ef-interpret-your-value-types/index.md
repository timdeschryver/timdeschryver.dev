---
title: Create a custom SQL expression with Entity Framework, or how to make EF interpret your Value Types
slug: create-a-custom-sql-expression-with-entity-framework-or-how-to-make-ef-interpret-your-value-types
description: A deep-dive at the internals of Entity Framework to come up with a solution to make EF interpret your value types, in this particular case a strongly-typed ID (of the StronglyTypedId NuGet Package).
date: 2024-10-10
tags: .NET, SQL
---

## The problem

In this blog post, I want to offer a solution to a problem we encountered while querying data with Entity Framework using "lookup" methods on Value Type properties.
In short, we want to execute the following query:

```cs
var persons = db.Set<Class>().Where(p => p.CustomType.Value.Contains("3FE8DBB6"));
```

Spoiler alert... this won't work out of the box.
To address this issue, we need to help Entity Framework how it can interpret this C# code and explain how it can be translated to a SQL Expression. write (and configure) a [DbFunction](https://learn.microsoft.com/en-us/ef/core/querying/user-defined-function-mapping#mapping-a-method-to-a-custom-sql) that translates the some C# code to a SQL expression.

## Strongly-type id value types

Before I discuss the solution, I want to take a quick detour to give you some more context and explain how we got there.

At my current project, we're currently busy migrating our project to use strongly-typed IDs.
Instead of using primitive types like `long` or `Guid`, we use a custom type that wraps the primitive type.
The benefit of doing this is that we can't accidentally mix up the IDs of different entities.
We're using the [StronglyTypedId](https://github.com/andrewlock/StronglyTypedId) NuGet Package to create these strongly-typed IDs easily.

:::tip
The StronglyTypedId package uses source generators to generate the code behind the strongly-typed IDs, helping you to battle [primitive obsession](https://blog.ploeh.dk/2011/05/25/DesignSmellPrimitiveObsession/) in your codebase.

See the blog post series [Using strongly-typed entity IDs to avoid primitive obsession](https://andrewlock.net/updates-to-the-stronglytypedid-library/) by [Andrew Lock](https://x.com/andrewlocknet), who's also the author of StronglyTypedId, for more information about strongly-typed IDs and the StronglyTypedId library.
:::

In practice, this results in the following code:

:::code-group

```cs{1-2, 6, 18} [title=Strongly-typed ID]
[StronglyTypedId(Template.Guid, "guid-efcore")]
public readonly partial struct PersonId { }

public class Person
{
    public PersonId Id { get; }
    public string Name { get; }

    public Person(PersonId id, string name)
    {
        Id = id;
        Name = name;
    }
}

public class PersonService
{
    public Person GetPersonById(PersonId id)
    {
        // ...
    }
}
```

```diff [title=Compare]
public class Person
{
-   public Guid Id { get; }
+   public PersonId Id { get; }
    public string Name { get; }

-   public Person(Guid id, string name)
+   public Person(PersonId id, string name)
    {
        Id = id;
        Name = name;
     }
}

public class PersonService
{
-   public Person GetPersonById(Guid id)
+   public Person GetPersonById(PersonId id)
    {
        // ...
    }
}
```

:::

This approach prevents us from accidentally passing the wrong ID, an ID from a different entity, which can lead to bugs that are hard to track down.

## The encountered issue

The move to strongly-typed IDs is working well for us, but we've recently run into an issue when querying our database.
Writing simple queries that query data by its ID using the equality operator are working fine.

```cs
PersonId personId = new PersonId(...);
var person = db.Set<Person>().Single(p => p.Id == personId);
```

However, it becomes more a different story when we need to query data using different lookup techniques, which require more complex expressions.
For example, let's say we want to query all persons containing a specific part of the ID.

```cs
var persons = db.Set<Person>().Where(p => p.Id.Value.ToString().Contains("3FE8DBB6"));
```

In theory, this should work, as Entity Framework Core should be able to translate the `ToString()` and `Contains()` methods to SQL.

At least, that's what we thought...
In practice, when we run this code, we get the following exception:

```txt
Unhandled exception. System.InvalidOperationException: The LINQ expression 'DbSet<Person>()
 .Where(p => p.Id.Value.ToString().Contains("3FE8DBB6"))' could not be translated. Either rewrite the query in a form that can be translated, or switch to client evaluation explicitly by inserting a call to 'AsEnumerable', 'AsAsyncEnumerable', 'ToList', or 'ToListAsync'. See https://go.microsoft.com/fwlink/?linkid=2101038 for more information.
```

We were surprised by this exception, as accessing `.Value` just works for nullable types.
For example, if the `Id` property was a nullable `Guid` type instead of the strongly-typed ID `PersonId`, the same query would just execute correctly.
To work around this issue we wanted to know how Entity Framework works, as this could help us to solve the encountered issue.

## How EF translates C# to SQL

Entity Framework is open-source, so we can look at how it handles the translation of expressions.

After some digging, we were led to the [`SqlServerMemberTranslatorProvider` class](https://github.com/dotnet/efcore/blob/5eebc0eee785b6bbf5d36186cfdc5047daa31f4e/src/EFCore.SqlServer/Query/Internal/SqlServerMemberTranslatorProvider.cs#L27-L34), in which you can notice that Entity Framework works with a collection of translators to translate C# members to SQL expressions, specifically for Sql Server. An example of such a translator is the `SqlServerStringMemberTranslator`, which translates the C# `string.Length` member to `LEN` in SQL.

We see that the `SqlServerMemberTranslatorProvider` class derives from [`RelationalMemberTranslatorProvider`](https://github.com/dotnet/efcore/blob/5eebc0eee785b6bbf5d36186cfdc5047daa31f4e/src/EFCore.Relational/Query/RelationalMemberTranslatorProvider.cs#L24). This base class contains a collection of translators that are shared between all relational databases. One of the translators is the [`NullableMemberTranslator`](https://github.com/dotnet/efcore/blob/5eebc0eee785b6bbf5d36186cfdc5047daa31f4e/src/EFCore.Relational/Query/Internal/Translators/NullableMemberTranslator.cs#L29-L38) that translates expressions for nullable types. The translator checks if the member is a nullable type, and if so, it provides a translation for the `.Value` and `.HasValue` properties.

This was exactly what we needed to know, as we could use this information to create our translator for the `Value` property of the strongly-typed ID.

But after some more research, we hit a wall and found out that we can't just extend the translator's collection and add our translator to it.

Then what about creating our own `TranslatorProvider`?
It turns out that this is possible ([GitHub issue](https://github.com/dotnet/efcore/issues/28111#issuecomment-1139451586)), but on the other hand it is not recommended.

This warning is clearly mentioned in the summary description of `SqlServerMemberTranslatorProvider`, "You should only use it directly in your code with extreme caution and knowing that doing so can result in application failures when updating to a new Entity Framework Core release"

```cs{2-5}:SqlServerMemberTranslatorProvider
/// <summary>
///     This is an internal API that supports the Entity Framework Core infrastructure and not subject to
///     the same compatibility standards as public APIs. It may be changed or removed without notice in
///     any release. You should only use it directly in your code with extreme caution and knowing that
///     doing so can result in application failures when updating to a new Entity Framework Core release.
/// </summary>
public class SqlServerMemberTranslatorProvider : RelationalMemberTranslatorProvider
{
    ...
}
```

:::note
You can also check out how methods are translated in [SqlServerMethodCallTranslatorProvider](https://github.com/dotnet/efcore/blob/5eebc0eee785b6bbf5d36186cfdc5047daa31f4e/src/EFCore.SqlServer/Query/Internal/SqlServerMethodCallTranslatorProvider.cs#L22), e.g. `DateTime.AddDays`, `string.Contains`, and more.
:::

## `HasDbFunction` to the rescue

Instead of extending the built-in translators, Entity Framework provides an extensible way to allow us to map C# code to SQL expressions.
It turns out we can use the [`HasDbFunction` method](https://learn.microsoft.com/en-us/ef/core/querying/user-defined-function-mapping#mapping-a-method-to-a-custom-sql) for this task.

:::info
In another blog post [Consuming SQL Functions with Entity Framework](https://timdeschryver.dev/blog/consuming-sql-functions-with-entity-framework) I've already explained how you can use SQL functions that aren't natively supported by Entity Framework, e.g. the `SOUNDEX` function. This blog post takes it a step further by creating your own SQL expression.
:::

We can take our knowledge about the built-in translators and apply it to our own custom translator, using the `HasDbFunction` method.
To create a `DbFunction`, add the function within the `OnModelCreating` method of your `DbContext` class.

Similar to the nullable translator, we hook into the `Value` member of the `PersonId` type.
Using `HasTranslation` we create a `SqlFunctionExpression` that represents the SQL expression, in the case of the strongly-typed ID, this means that we map the `Value` member to a `SqlFunctionExpression` that represents the value of the Id.
In this case, this can be an empty implementation, as we just want to tell Entity Framework that it should use the `Value` member of the `PersonId` type.

```cs{10-18}:ApplicationDb.cs
public class ApplicationDb : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(...);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasDbFunction(() => typeof(PersonId).GetMember(nameof(PersonId.Value)))
            .HasTranslation(args => new SqlFunctionExpression(
            functionName: "",
            arguments: args,
            nullable: false,
            argumentsPropagateNullability: [false],
            type: typeof(string),
            typeMapping: null));
    }
}
```

When we run the query again, we see that the exception is gone, but that it now throws a different exception:

```txt
Unhandled exception. System.ArgumentException: The DbFunction 'Type.GetMember' defined on type 'Type' must be either a static method or an instance method defined on a DbContext subclass. Instance methods on other types are not supported.
```

Luckily, the exception provides us with a clear message on how it can be resolved.
We decided to use a static method:

```cs:StronglyTypedIdValue.cs
public static class StronglyTypedIdValue
{
    public static string InnerValue(this PersonId value)
    {
        throw new NotImplementedException();
    }
}
```

The static method received the strongly-typed ID as an argument, and has the return type of `string`.
We don't need an implementation for this method, as we only want to use it to translate our code.

Because the `InnerValue()` returns a string, the query also becomes simpler.
Instead of calling `ToString()` on the `Value` property, we can now call the `InnerValue()` method directly.
The query now looks like this:

```cs
var persons = db.Set<Person>().Where(p => p.Id.InnerValue().Contains("3FE8DBB6"));
```

Lastly, this change also impacts the `DdFunction`.
The `DdFunction` method also needs to be updated to use the `InnerValue()` method:

```cs{10-18}:ApplicationDb.cs

public class ApplicationDb : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(...);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasDbFunction(() => StronglyTypedIdValue.InnerValue(default))
            .HasTranslation(args => new SqlFunctionExpression(
            functionName: "",
            arguments: args,
            nullable: false,
            argumentsPropagateNullability: [false],
            type: typeof(string),
            typeMapping: null));
    }
}
```

When we run the query again, we see that a new exception is thrown:

```txt
Unhandled exception. System.InvalidOperationException: The parameter 'value' for the DbFunction 'StronglyTypedIdValue.InnerValue(PersonId)' has an invalid type 'PersonId'. Ensure the parameter type can be mapped by the current provider.
```

This exception is thrown because the `PersonId` type cannot be mapped to a SQL type.
To fix this issue, we provide the correct SQL type via the `HasStoreType` (and `HasParameter`) method.

```cs{10-18}:ApplicationDb.cs

public class ApplicationDb : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(...);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasDbFunction(() => StronglyTypedIdValue.InnerValue(default))
            .HasTranslation(args => new SqlFunctionExpression(
            functionName: "",
            arguments: args,
            nullable: false,
            argumentsPropagateNullability: [false],
            type: typeof(string),
            typeMapping: null))
            .HasParameter("value")
            .HasStoreType("NVARCHAR(255)");
    }
}
```

Now, finally, when we run the query, we see that the query is successfully translated to SQL, and that the query returns the expected results.
The SQL query that is executed looks as follows:

```sql
SELECT TOP(2) [p].[Id], [p].[Name]
FROM [Persons] AS [p]
WHERE ([p].[Id]) LIKE N'%3FE8DBB6%'
```

## Going over the solution in detail

We went over the solution very quickly, so let's explain it in more detail.
We need to give the compiler a little hand of how it can translate a C# expression into a valid SQL expression.
In our case this meant that it should be able to translate a member access of a value type (a strongly-typed ID).

To do this, we created a `DbFunction` to map the `Value` property of the strongly-typed ID to a `SqlFunctionExpression`.
Because Entity Framework only supports static methods or methods within the `DbContext` class, we created a static method that receives the strongly-typed ID as an argument and returns a string.
To make the previous solution more generic, we can replace the StronglyTypedId `PersonId` with the `object` type.

:::code-group

```cs{10-18}:ApplicationDb.cs [title=ApplicationDb]

public class ApplicationDb : DbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseSqlServer(...);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasDbFunction(() => StronglyTypedIdValue.InnerValue(default))
            .HasTranslation(args => new SqlFunctionExpression(
            functionName: "",
            arguments: args,
            nullable: false,
            argumentsPropagateNullability: [false],
            type: typeof(string),
            typeMapping: null))
            .HasParameter("value")
            .HasStoreType("NVARCHAR(255)");
    }
}
```

```cs:StronglyTypedIdValue.cs [title=StronglyTypedIdValue]
public static class StronglyTypedIdValue
{
    public static string InnerValue(this object value)
    {
        // This is method is not invoked at runtime, instead it's translated to a SQL expression
        throw new NotImplementedException();
    }
}
```

:::

`HasDbFunction` receives an expression that represents the method that should be translated.
Within the `HasTranslation` method, the C# function is translated to a `SqlFunctionExpression`.
The translation receives an `args` as an argument, which represents the arguments that are passed to the `StronglyTypedIdValue.InnerValue()` extension method.
In our case, this is the strongly-typed ID `PersonId`.
If more arguments are passed to the method, they will be added to the `args` argument as well.

The `SqlFunctionExpression` is built up using the following arguments:

- `functionName`: The name of the SQL function, in our case an empty string because we don't require a function.
- `arguments`: The arguments that are passed to the function, in our case just the `value` argument, which is the value of the strongly-typed id.
- `nullable`: Configures if the function can return `null`, in our case this is `false` because the `Value` property of the strongly-typed ID is never `null`.
- `argumentsPropagateNullability`: Configures if the arguments can be `null`, in our case this is `false` because the `Value` property of the strongly-typed ID is never `null`.
- `type`: The return type of the function, in our case this is `string`.
- `typeMapping`: to be honest, I'm not entirely sure what this does, but it can be `null` in our case.

This `SqlFunctionExpression` is then used to translate the `p.Id.InnerValue()` in the EF query below.

```cs
var persons = db.Set<Person>().Where(p => p.Id.InnerValue().Contains("3FE8DBB6"));
```

Of course, this works because the inner type of our strongly-typed ID `PersonId` is a `Guid`, which can be converted to a `string`.
When the inner type is a number, you need to convert the number to a string first.
An example of this is shown below:

```cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder
        .HasDbFunction(() => StronglyTypedIdValue.InnerValue(default))
        .HasTranslation(args => new SqlFunctionExpression(
        functionName: "CONVERT",
        arguments: args.Prepend(new SqlFragmentExpression("nvarchar(255)")),
        nullable: false,
        argumentsPropagateNullability: [false, false],
        type: typeof(string),
        typeMapping: null))
        .HasParameter("value")
        .HasStoreType("NVARCHAR(255)");
}
```

In the example above, we use the `CONVERT` function to convert the number to a string.
For this, the following changes are made:

- `functionName`: The name of the SQL function, in our case `CONVERT`.
- `arguments`: The arguments that are passed to the function, in this case the `value` argument, but we prepend the `nvarchar(255)` argument to it. This to create the following valid SQL expression: `CONVERT(nvarchar(255), value)`.
- `argumentsPropagateNullability`: Because an additional argument is added, the `argumentsPropagateNullability` is updated to `[false, false]`.

This translates into the following SQL query:

```sql
SELECT TOP(2) [p].[Id], [p].[Name]
FROM [Persons] AS [p]
WHERE CONVERT(nvarchar(255), [p].[Id]) LIKE N'%123%'
```

## Conclusion

In this blog post, we've seen how we configure Entity Framework to translate a C# expression, which isn't by the compiler, to a SQL expression.

To come up with this solution, we've looked at how Entity Framework translates expressions using its built-in translators, but it turned out that this is meant for internal use only and is not recommended to extend.

The better solution is to create a `DbFunction` that maps a C# expression to a SQL expression.
While configuring the `DbContext`, we created a `DbFunction` within the `OnModelCreating` method.
Our function maps the `Value` property of the strongly-typed ID into a valid SQL expression using a `SqlFunctionExpression`.
To create a valid hook that Entity Framework can use, we created a static method that receives the strongly-typed ID as an argument.

## Resources

Most of the information to come up with this solution was found in the Entity Framework GitHub issues.

- [GH issue: EF Translators](https://github.com/dotnet/efcore/issues/28111#issuecomment-1139451586)
- [GH Issue: EF configure proper type mapping](https://github.com/dotnet/efcore/issues/28393#issuecomment-1181498610)
- [Blog: Going down the rabbit hole of EF Core and converting strings to dates](https://dasith.me/2022/01/23/ef-core-datetime-conversion-rabbit-hole/)
