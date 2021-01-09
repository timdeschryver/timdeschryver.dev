---
title: Faster SQL Bulk Inserts With C#
slug: faster-sql-bulk-inserts-with-csharp
description: Using SQL Bulk Copy to have a huge performance gain
author: Tim Deschryver
date: 2021-01-06
tags: dotnet, sql, performance
banner: ./images/banner.jpg
bannerCredit: Photo by [Priscilla Du Preez](https://unsplash.com/@priscilladupreez) on [Unsplash](https://unsplash.com)
published: true
---

Over the past year, I've had to migrate multiple legacy applications to a new application. These new applications had their own database structure, so we needed to migrate the data from the legacy application to the new application.
With each migration, the quality of the code improved because of the experiences from the past migrations, and my overall knowledge.
Not only did the code quality improve, but there was also a very noticeable speed difference (in a good way) although the amount of data increased.

In this post, we'll incrementally refactor slow inserts into blazing fast inserts.
If you're only interested in the fastest technique, please navigate to [SQL Bulk Copy](#sql-bulk-copy).
We do this by inserting a collection of N customers (that have an id, a name, and some contact information) into a SQL table.

```cs:customers.sql
record Customer (
  Guid Id,
  string FirstName,
  string LastName,
  string Street,
  string City,
  string State,
  string PhoneNumber,
  string EmailAddress )
```

In this example, the `Customers` table has the same structure as the C# object.

```sql
CREATE TABLE [dbo].[Customers] (
  [Id] [uniqueidentifier] ROWGUIDCOL NOT NULL
    CONSTRAINT [PK_Customers] PRIMARY KEY CLUSTERED,
  [LastName] [nvarchar](255) NULL,
  [FirstName] [nvarchar](255) NULL,
  [Street] [nvarchar](255) NULL,
  [City] [nvarchar](255) NULL,
  [State] [nvarchar](255) NULL,
  [PhoneNumber] [nvarchar](255) NULL,
  [EmailAddress] [nvarchar](255) NULL
)
```

Let's take a look at some benchmarks.

### Simple insert

The simplest approach is to create a single `SqlCommand` for each customer in the collection and insert it one by one.

```cs
var cmdText = @"
    insert into dbo.Customers (Id, FirstName, LastName, Street, City, State, PhoneNumber, EmailAddress)
    values (@Id, @FirstName, @LastName, @Street, @City, @State, @PhoneNumber, @EmailAddress)";

foreach (var customer in customers)
{
    using (var connection = new SqlConnection(connectionString))
    {
        var command = new SqlCommand(cmdText, connection);
        command.Parameters.AddWithValue("@Id", customer.Id);
        command.Parameters.AddWithValue("@FirstName", customer.FirstName);
        command.Parameters.AddWithValue("@LastName", customer.LastName);
        command.Parameters.AddWithValue("@Street", customer.Street);
        command.Parameters.AddWithValue("@City", customer.City);
        command.Parameters.AddWithValue("@State", customer.State);
        command.Parameters.AddWithValue("@PhoneNumber", customer.PhoneNumber);
        command.Parameters.AddWithValue("@EmailAddress", customer.EmailAddress);

        connection.Open();
        command.ExecuteNonQuery();
    }
}
```

Results:

```txt:simple
Simple insert for 1 customer: 11ms
Simple insert for 10 customers: 121ms
Simple insert for 100 customers: 1122ms
Simple insert for 1_000 customers: 10457ms
Simple insert for 10_000 customers: 161930ms
Simple insert for 100_000 customers: SKIPPED
Simple insert for 1_000_000 customers: SKIPPED
```

We can get a slightly better result when we tweak this a little bit, and share the connection for each sql command.

```cs
var cmdText = @"
    insert into dbo.Customers (Id, FirstName, LastName, Street, City, State, PhoneNumber, EmailAddress)
    values (@Id, @FirstName, @LastName, @Street, @City, @State, @PhoneNumber, @EmailAddress)";

using (var connection = new SqlConnection(connectionString))
{
    foreach (var customer in customers)
    {
        var command = new SqlCommand(cmdText, connection);
        command.Parameters.AddWithValue("@Id", customer.Id);
        command.Parameters.AddWithValue("@FirstName", customer.FirstName);
        command.Parameters.AddWithValue("@LastName", customer.LastName);
        command.Parameters.AddWithValue("@Street", customer.Street);
        command.Parameters.AddWithValue("@City", customer.City);
        command.Parameters.AddWithValue("@State", customer.State);
        command.Parameters.AddWithValue("@PhoneNumber", customer.PhoneNumber);
        command.Parameters.AddWithValue("@EmailAddress", customer.EmailAddress);

        connection.Open();
        command.ExecuteNonQuery();
    }
}
```

Results:

```txt:simple-shared-connection
Simple insert (shared connection) for 1 customer: 11ms
Simple insert (shared connection) for 10 customers: 119ms
Simple insert (shared connection) for 100 customers: 958ms
Simple insert (shared connection) for 1_000 customers: 7923ms
Simple insert (shared connection) for 10_000 customers: 130205ms
Simple insert (shared connection) for 100_000 customers: SKIPPED
Simple insert (shared connection) for 1_000_000 customers: SKIPPED
```

### Generating the SQL command text

We already noticed that opening and closing the SQL connection is a costly operation.
So what if we only execute one SQL command?

```cs
var cmdText = customers.Aggregate(
    new StringBuilder(),
    (sb, customer) => sb.AppendLine(@$"
        insert into dbo.Customers (Id, FirstName, LastName, Street, City, State, PhoneNumber, EmailAddress)
        values('{customer.Id}', '{customer.FirstName}', '{customer.LastName}', '{customer.Street}', '{customer.City}', '{customer.State}', '{customer.PhoneNumber}', '{customer.EmailAddress}')")
);

using (var connection = new SqlConnection(connectionString))
{
    var command = new SqlCommand(cmdText.ToString(), connection);
    connection.Open();
    command.ExecuteNonQuery();
}
```

Results:

```txt:generated-sql
Manual insert for 1 customer: 10ms
Manual insert for 10 customers: 13ms
Manual insert for 100 customers: 39ms
Manual insert for 1_000 customers: 557ms
Manual insert for 10_000 customers: 17006ms
Manual insert for 100_000 customers: 23637ms
Manual insert for 1_000_000 customers: SKIPPED
```

Okay, that's already better but this has a drawback.
We have to escape the SQL command text manually, which doesn't look pretty.
And spoiler... we make it faster.

### Entity Framework

Let's take a look at the performance of [Entity Framework](https://docs.microsoft.com/en-us/ef/core/get-started/overview/first-app?tabs=netcore-cli).

Don't forget to use the `AddRange` method, instead of iterating through the whole collection and adding the records one by one with the `Add` method. The `AddRange` method is significantly faster because it [disables change detection](https://docs.microsoft.com/en-us/ef/ef6/saving/change-tracking/auto-detect-changes) automatically.

```cs
using (var context = new CustomersContext())
{
    context.Customers.AddRange(customers);
    context.SaveChanges();
}
```

When we take a look at the generated SQL commands (by using [SQL Extended Events](/blog/getting-to-know-sql-server-extended-events)) we notice that Entity Framework generates multiple SQL insert statements. Each statement inserts multiple customers at once, which seems to be the cause of our next speed gain.

```sql
exec sp_executesql N'SET NOCOUNT ON;
INSERT INTO [Customers] ([Id], [City], [EmailAddress], [FirstName], [LastName], [PhoneNumber], [State], [Street])
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7),
(@p8, @p9, @p10, @p11, @p12, @p13, @p14, @p15),
...;
',N'@p0 uniqueidentifier,@p1 nvarchar(4000),@p2 nvarchar(4000),@p3 nvarchar(4000),@p4 nvarchar(4000),@p5 nvarchar(4000),@p6 nvarchar(4000),@p7 nvarchar(4000),@p8 uniqueidentifier,@p9 nvarchar(4000),@p10 nvarchar(4000),@p11 nvarchar(4000),@p12 nvarchar(4000),@p13 nvarchar(4000),@p14 nvarchar(4000),@p15 nvarchar(4000)...',@p0='FEA8EAE8-58E1-469B-951C-4DABD0FEF48C',@p1=N'City 1',@p2=N'EmailAddress 1',@p3=N'FistName 1',@p4=N'LastName 1',@p5=N'PhoneNumber 1',@p6=N'State 1',@p7=N'Street 1',@p8='E77C70F2-86B5-45C4-8A67-D95F81C42004',@p9=N'City 66672',@p10=N'EmailAddress 66672',@p11=N'FistName 66672',@p12=N'LastName 66672',@p13=N'PhoneNumber 66672',@p14=N'State 66672',@p15=N'Street 66672'...'
```

Result:

```txt:entity-framework
Entity Framework insert for 1 customer: 10ms
Entity Framework insert for 10 customers: 13ms
Entity Framework insert for 100 customers: 38ms
Entity Framework insert for 1_000 customers: 155ms
Entity Framework insert for 10_000 customers: 1015ms
Entity Framework insert for 100_000 customers: 12290ms
Entity Framework insert for 1_000_000 customers: 119269ms
```

### Table Valued Parameter

We can notice that using Entity Framework, speeds up the inserts again.
I think this is because it inserts multiple records at once instead of record per record.

This can be verified by tweaking the [Generating the SQL command text](#generating-the-sql-command-text) to reflect this way of working.
But we can quickly experience why Entity Framework chops the insert statements in batches.
When we try to insert more than 1000 records, SQL throws the error:

```bash
The number of row value expressions in the INSERT statement
exceeds the maximum allowed number of 1000 row values
```

We can work around this restriction, by using a [Table Valued Parameter](https://docs.microsoft.com/en-us/sql/relational-databases/tables/use-table-valued-parameters-database-engine). For this solution, the first step is to create a User-defined Table Type.
We'll use (read, populate it with the customers) this table type later when we execute the SQL query.

```sql
CREATE TYPE [dbo].[CustomersTableType] AS TABLE (
    [Id] [uniqueidentifier] NOT NULL,
    [LastName] [nvarchar](255) NOT NULL,
    [FirstName] [nvarchar](255) NOT NULL,
    [Street] [nvarchar](255) NOT NULL,
    [City] [nvarchar](255) NOT NULL,
    [State] [nvarchar](255) NOT NULL,
    [PhoneNumber] [nvarchar](255) NOT NULL,
    [EmailAddress] [nvarchar](255) NOT NULL
)
```

Next, we must convert the customer list into a [DataTable](https://docs.microsoft.com/en-us/dotnet/api/system.data.datatable) to be able to pass the data to the SQL query. Do not forget to assign the SQL parameter's type name to the name given to the above table type.

In the SQL query, we select all the customers assigned to the table type parameter and insert them into the customer table.
With this way, we execute one SQL query, which inserts all of the customers at once.

```cs{9-10}
var cmdText = @"
    insert into dbo.Customers (Id, FirstName, LastName, Street, City, State, PhoneNumber, EmailAddress)
    select Id, FirstName, LastName, Street, City, State, PhoneNumber, EmailAddress
    from @customers";

using (var connection = new SqlConnection(connectionString))
{
    var command = new SqlCommand(cmdText, connection);
    var param = command.Parameters.AddWithValue("@customers", ToDataTable(customers));
    param.TypeName = "dbo.CustomersTableType";
    connection.Open();
    command.ExecuteNonQuery();
}
```

Results:

```txt:table-valued-parameter
Table Valued Parameter insert for 1 customer: 12ms
Table Valued Parameter insert for 10 customers: 13ms
Table Valued Parameter insert for 100 customers: 15ms
Table Valued Parameter insert for 1_000 customers: 49ms
Table Valued Parameter insert for 10_000 customers: 108ms
Table Valued Parameter insert for 100_000 customers: 2090ms
Table Valued Parameter insert for 1_000_000 customers: 12259ms
```

### SQL Bulk Copy

SQL has a built-in mechanism to import a large volume of data, called [Bulk Insert](https://docs.microsoft.com/en-us/sql/t-sql/statements/bulk-insert-transact-sql). Luckily for us, dotnet supports a Bulk Insert with the [SqlBulkCopy](https://docs.microsoft.com/en-us/dotnet/framework/data/adonet/sql/bulk-copy-operations-in-sql-server) class.

Besides the visible performance advantage over the other solutions, we can also easily tweak the behavior with some [Options](https://docs.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlbulkcopyoptions).

To use the `SqlBulkCopy`, we need to create a new instance of the class and provide the SQL destination table.
When we write the customer list into the customers table, with the `WriteToServer` method on the `SqlBulkCopy` class, the method expects the collection to be a `DataTable`.

```cs
using (var copy = new SqlBulkCopy(connectionString))
{
    copy.DestinationTableName = "dbo.Customers";
    // Add mappings so that the column order doesn't matter
    copy.ColumnMappings.Add(nameof(Customer.Id), "Id");
    copy.ColumnMappings.Add(nameof(Customer.FirstName), "FirstName");
    copy.ColumnMappings.Add(nameof(Customer.LastName), "LastName");
    copy.ColumnMappings.Add(nameof(Customer.Street), "Street");
    copy.ColumnMappings.Add(nameof(Customer.City), "City");
    copy.ColumnMappings.Add(nameof(Customer.State), "State");
    copy.ColumnMappings.Add(nameof(Customer.PhoneNumber), "PhoneNumber");
    copy.ColumnMappings.Add(nameof(Customer.EmailAddress), "EmailAddress");

    copy.WriteToServer(ToDataTable(customers));
}
```

When we take another look at what this does under the hood (with [SQL Extended Events](/blog/getting-to-know-sql-server-extended-events)), we notice that `SqlBulkCopy` generates the following SQL import statement.

```sql
select @@trancount; SET FMTONLY ON select * from dbo.Customers SET FMTONLY OFF exec ..sp_tablecollations_100 N'[dbo].[Customers]'
insert bulk dbo.Customers ([Id] UniqueIdentifier, [LastName] NVarChar(255) COLLATE Latin1_General_CI_AS, [FirstName] NVarChar(255) COLLATE Latin1_General_CI_AS, [Street] NVarChar(255) COLLATE Latin1_General_CI_AS, [City] NVarChar(255) COLLATE Latin1_General_CI_AS, [State] NVarChar(255) COLLATE Latin1_General_CI_AS, [PhoneNumber] NVarChar(255) COLLATE Latin1_General_CI_AS, [EmailAddress] NVarChar(255) COLLATE Latin1_General_CI_AS)
```

Results:

```txt:bulk-insert
Bulk insert for 1 customer: 3ms
Bulk insert for 10 customers: 3ms
Bulk insert for 100 customers: 5ms
Bulk insert for 1_000 customers: 17ms
Bulk insert for 10_000 customers: 187ms
Bulk insert for 100_000 customers: 1921ms
Bulk insert for 1_000_000 customers: 9510ms
```

### Conclusion

We can see that there are multiple tactics to make a bulk insert fast(er), and why a technique is faster than another.
Not that we always must use the fastest solution out there, but I think it's good to know the options that can be used in different scenarios. For smaller collections, it's probably good enough to use the solution that offers the best developer's ergonomics.

By using a [SQL Bulk Copy](#sql-bulk-copy) in our migration, we've won many hours that would otherwise be wasted while waiting on a migration run to complete.

If you know another way to insert a hundred-thousands of records in a fast way, feel free to send me a DM at [@tim_deschryver](/twitter).
I'd love to hear and learn from you.

Recommendations from our community:

- [C# Bulk Operations](https://bulk-operations.net/)
- [Dapper Plus](https://dapper-plus.net/overview)
- [Entity Framework Plus](https://entityframework-plus.net/)
- [EFCore.BulkExtensions](https://github.com/borisdj/EFCore.BulkExtensions)

### Results

```txt
- 1 Customer -
Simple: 11ms
Simple (shared connection): 11ms
Manual: 10ms
Entity Framework: 10ms
Table Valued Parameter: 12ms
BulkCopy: 3ms

- 10 Customers -
Simple: 121ms
Simple (shared connection): 119ms
Manual: 13ms
Entity Framework: 13ms
Table Valued Parameter: 13ms
BulkCopy: 3ms

- 100 Customers -
Simple: 1122ms
Simple (shared connection): 958ms
Manual: 39ms
Entity Framework: 38ms
Table Valued Parameter: 15ms
BulkCopy: 5ms

- 1_000 Customers -
Simple: 10457ms
Simple (shared connection): 7923ms
Manual: 557ms
Entity Framework: 155ms
Table Valued Parameter: 49ms
BulkCopy: 17ms

- 10_000 Customers -
Simple: 161930ms
Simple (shared connection): 130205ms
Manual: 17006ms
Entity Framework: 1015ms
Table Valued Parameter: 108ms
BulkCopy: 187ms

- 100_000 Customers -
Simple: SKIPPED
Simple (shared connection): SKIPPED
Manual: 23637ms
Entity Framework: 12290ms
Table Valued Parameter: 2090ms
BulkCopy: 1921ms

- 1_000_000 Customers -
Simple: SKIPPED
Simple (shared connection): SKIPPED
Manual: SKIPPED
Entity Framework: 119269ms
Table Valued Parameter: 12259ms
BulkCopy: 9510ms
```

![Chart representing the results](./images/chart.jpg)
