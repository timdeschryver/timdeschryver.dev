---
title: 'New in Entity Framework 8: Primitive collection properties'
slug: new-in-entity-framework-8-primitive-collection-properties
date: 2024-01-09
tags: dotnet, entity-framework
---

# New in Entity Framework 8: Primitive collection properties

Starting from EF 8, EF automatically stores a collection of primitive values directly in a column (as JSON), whereas previously a separate table was required.

To query data, the [OPENJSON](https://learn.microsoft.com/en-us/sql/t-sql/functions/openjson-transact-sql) table-valued function is used.
This creates a rowset view of the JSON data, which can be compared as a "normal" relational table, and can thus be queried as you're used to.

Let's explore how this translates into code and SQL.

:::note
`OPENJSON` is more and more used in EF features to support more use-cases (or to improve the query performance). An example of this is the possibility to use inline collections while querying data, as mentioned in the [release announcement](https://devblogs.microsoft.com/dotnet/announcing-ef8-preview-4#and-one-last-thing-queryable-inline-collections).
:::

:::code-group

```cs [title=Define]
public class Person
{
    public required Guid Id { get; init; }
    public required int[] LuckyNumbers { get; init; }
}

/*
  CREATE TABLE [dbo].[Persons](
    [Id] [uniqueidentifier] NOT NULL,
    [LuckyNumbers] [nvarchar](max) NOT NULL,
    CONSTRAINT [PK_Persons] PRIMARY KEY CLUSTERED ([Id] ASC)
  )
*/
```

```cs [title=Insert]
var person = new Person
{
    Id = Guid.NewGuid(),
    LuckyNumbers = [1, 3, 5, 7]
};

dbContext.Add(person);
dbContext.SaveChanges();

/*
  exec sp_executesql N'SET IMPLICIT_TRANSACTIONS OFF;
  SET NOCOUNT ON;
  INSERT INTO [dbo].[Persons] ([Id], [LuckyNumbers])
  VALUES (@p0, @p1);
  ',N'@p0 uniqueidentifier,@p1 nvarchar(4000)',
  @p0='691dbfdd-62b3-43f5-a9bb-498985ac7952',
  @p1=N'[1,3,5,7]'
*/
```

```md [title=Data]
+--------------------------------------+--------------+
| Id | LuckyNumbers |
+--------------------------------------+--------------+
| 691dbfdd-62b3-43f5-a9bb-498985ac7952 | [1,3,5,7] |
+--------------------------------------+--------------+
```

```cs [title=Query]
var persons = dbContext.Set<Person>()
  .Where(p => p.LuckyNumbers.Contains(3))
  .ToList();

/*
  SELECT [p].[Id], [p].[LuckyNumbers]
  FROM [dbo].[Persons] AS [p]
  WHERE 3 IN (
    SELECT [l].[value]
    FROM OPENJSON([p].[LuckyNumbers])
    WITH ([value] int '$') AS [l]
  )
*/
```

:::

For more info and new features introced in EF 8 see the [documentation](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/whatsnew#primitive-collections).
