---
title: Consuming SQL Functions with Entity Framework
slug: consuming-sql-functions-with-entity-framework
description: Using DbFunctions is a method to use database-specific functions in your Entity Framework queries. They allow you to take advantage of features that are specific to a particular database provider, such as SQL Server and use them in your Entity Framework queries in a provider-agnostic way. As an example, let's use the SOUNDEX SQL function.
date: 2023-01-09
tags: .NET, SQL, Entity Framework
---

SQL Server (or another database) has many built-in functions that can be used in queries.
But when you use Entity Framework, these functions can't be used in your Entity Framework queries.

Some of the functions have a .NET counterpart, for example, to add days to a date you use `DATEADD` in TSQL, and in C# this becomes `DateTime.AddDays`.
But some of them don't, for example [`SOUNDEX` in TSQL (to find similar strings instead of a full-match)](https://learn.microsoft.com/en-us/sql/t-sql/functions/soundex-transact-sql) does not have a C# version.
This is done to keep the Entity Framework API consistent across different database providers.

As a workaround, you can write your own C# version of the missing behavior, or you can make it yourself easy and register these SQL functions within the `DBContext`.
Once a function is registered you can use it in your Entity Framework queries in a database provider-agnostic way.

For example, let's register the `SOUNDEX` function.
To do this, create a new method in the `DbContext`, and annotate it with the [`DbFunction` attribute](TK).

```cs{8-12}:MyDbContext.cs
public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options)
        : base(options)
    {
    }

    [DbFunction(Name = "SoundEx", IsBuiltIn = true)]
    public static string SoundEx(string input)
    {
        throw new NotImplementedException();
    }
}
```

Notice that we don't implement the method, we just provide the correct signature.

You can now use the `SoundEx` method and call the function in your Entity Framework query.
In the next example, we use a name query parameter to filter customers based on their name by using the `SoundEx` method.

```cs{8-12}:Program.cs
var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("SqlConnection");
builder.Services.AddDbContext<MyDbContext>(ctx => ctx.UseSqlServer(connectionString));

var app = builder.Build();

app.MapGet("/customers", ([FromQuery] customerName, MyDbContext ctx) => {
    return ctx.Customers
        .Where(c => MyDbContext.SoundEx(c.Name) == MyDbContext.SoundEx(customerName))
        .ToListAsync();
});

app.Run();
```

When the query is executed this generates the following SQL statement. To give you an idea, if we search for customers with the name "Timothy", this also matches the following names "Timmothy", "Timoteo", or "Timotheo".

```sql:customers.sql
SELECT [c].[Id], [c].[Name]
FROM [Customers] AS [c]
WHERE SoundEx([c].[Name]) = SoundEx(N'Timothy') OR ((SoundEx([c].[Name]) IS NULL) AND (SoundEx(N'Timothy') IS NULL))
```

Or, to clean up the SQL statement, we can set the `IsNullable` property of the `DbFunction` attribute to `false`.

```cs{8}:MyDbContext.cs
public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options)
        : base(options)
    {
    }

    [DbFunction(Name = "SoundEx", IsBuiltIn = true, IsNullable = false)]
    public static string SoundEx(string input)
    {
        throw new NotImplementedException();
    }
}
```

Resulting in a cleaner SQL statement.

```sql:customers.sql
SELECT [c].[Id], [c].[Name]
FROM [Customers] AS [c]
WHERE SoundEx([c].[Name]) = SoundEx(N'Timothy')
```

Besides the built-in functions, you can also create your own SQL functions and add them to the `DbContext` in a similar way.
For your custom functions, set the `IsBuiltIn` property to `false` and you can also define the function's schema.

I wouldn't recommend creating your own SQL functions, but registering existing functions can be useful while porting an existing codebase to a newer version.

```cs{14-18}:MyDbContext.cs
public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options)
        : base(options)
    {
    }

    [DbFunction(Name = "SoundEx", IsBuiltIn = true, IsNullable = false)]
    public static string SoundEx(string input)
    {
        throw new NotImplementedException();
    }

    [DbFunction(Name = "MyCustomFunction", Schema = "dbo", IsBuiltIn = false)]
    public static int MyCustomFunction(int input)
    {
        throw new NotImplementedException();
    }
}
```

## Conclusion

Overall, using DbFunctions can be a useful way to take advantage of specific database features in your Entity Framework queries, but there is one caveat.
Because you're using database specific function it becomes harder to port to other databases if you ever want to do this.
In our example, the `SOUNDEX` function does not exist in all databases, or it has a different name.
So, when you ever want to switch to another database you should revisit all the added `DbFunction`s.