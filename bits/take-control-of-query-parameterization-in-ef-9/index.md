---
title: Take control of query parameterization in EF 9
slug: take-control-of-query-parameterization-in-ef-9
date: 2024-04-16
tags: dotnet, entity-framework
---

# Take control of query parameterization in EF 9

In Entity Framework 9 we will have more control on how parameters and constants are used within the generated SQL queries.
Using the two new methods `EF.Parameter` and `EF.Constant` you can decide on how the query parameters are generated, which is useful when you want to force or prevent query parameterization.

- `EF.Parameter` is used to indicate that the parameter should be used as a parameter in the generated SQL query.
- `EF.Constant` is used to indicate that the parameter should be used as an inline constant in the generated SQL query.

This feature makes it easier to manage the query plans that are created, and thus can help to improve the performance of your queries and application.

:::code-group

```cs{2} [title=EF.Parameter]
var blogs = await ctx.Set<Blog>()
    .Where(blog => blog.Title.Contains(EF.Parameter("entity framework")))
    .ToListAsync();
```

```sql{1-3} [title=compiled.sql]
SELECT [b].[Id], [b].[Tags], [b].[Title]
FROM [Blog] AS [b]
WHERE [b].[Title] LIKE @__p_0_contains
WHERE [b].[Title] LIKE '%entity framework%' -- before using EF.Parameter
```

:::

:::code-group

```cs{2} [title=EF.Constant]
var blog = await ctx.Set<Blog>()
    .Where(blog => blog.Id == EF.Constant(id))
    .SingleAsync();
```

```sql{1-3} [title=compiled.sql]
SELECT TOP(2) [b].[Id], [b].[Tags], [b].[Title]
FROM [Blog] AS [b]
WHERE [b].[Id] = 1
WHERE [b].[Id] = @__id_0 -- before using EF.Constant
```

:::

For more information, see the ["What's New in EF Core 9" documentation](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-9.0/whatsnew#force-or-prevent-query-parameterization).
