---
title: Named global query filters in Entity Framework Core 10
slug: named-global-query-filters-in-entity-framework-core-10
description: Entity Framework Core 10 enhances the global query filters feature, allowing you to define multiple filters per entity and selectively disable them by name. This powerful enhancement gives you fine-grained control over query filtering, perfect for implementing soft deletes.
date: 2025-12-04
tags: .NET, Entity Framework
---

Previous version of Entity Framework included a way to define global query filters while configuring the model. These filters were applied to all queries for a given entity type, allowing developers to implement features like soft deletes easily. However, this feature was limited in flexibility, as it did not allow multiple filters.

With Entity Framework 10, a new feature has been introduced that allows developers to define named global query filters. This enhancement provides greater flexibility by enabling multiple filters to be defined, which can be selectively disabled based on their names.

:::info
For the entire change list of new features in Entity Framework 10, refer to the [official documentation](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew).
:::

## Before: Single Global Query Filter

In previous versions, you could define a single global query filter using the `HasQueryFilter` method. For example, to implement a soft delete feature, you might have done something like this:

```csharp
public class CustomerContext : DbContext
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>().HasQueryFilter(p => !p.IsDeleted);
    }
}

// Or as a IEntityTypeConfiguration<T> implementation
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasQueryFilter(p => !p.IsDeleted);
    }
}
```

The filter automatically excludes any `Customer` entities marked as deleted from all queries. If you wanted to include an additional filter, you would have to combine it with the existing one. For example, let's say you wanted to filter customers based on their status as well:

```cs
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        // This does not work as expected
        // The last filter defined overrides the previous one
        builder.HasQueryFilter(p => !p.IsDeleted);
        builder.HasQueryFilter(p => p.Status != CustomerStatus.Archived);

        // Instead, combine both conditions into a single filter
        builder.HasQueryFilter(p => !p.IsDeleted && p.Status != CustomerStatus.Archived);
    }
}
```

For scenarios where you needed to disable the global filter in specific queries, you had to use the `IgnoreQueryFilters` method, which disabled all global filters for that query:

```cs
// Filtered query, customers that are soft-deleted or archived are excluded
var activeCustomers = await context.Customers
    .ToListAsync(cancellationToken);

// Unfiltered query, all customers are included
var customers = await context.Customers
    .IgnoreQueryFilters()
    .ToListAsync(cancellationToken);
```

## Now: Named Global Query Filters

With Entity Framework Core 10, you can now define named global query filters. This allows you to create multiple filters for the same entity type and selectively disable them by name (one or more).

The refactored code for the previous example would look like this.
Instead of combining multiple conditions into a single filter, invoke `HasQueryFilter` multiple times and provide a unique name for each filter.

```csharp
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.HasQueryFilter("SoftDeleteFilter", p => !p.IsDeleted);
        builder.HasQueryFilter("StatusFilter", p => p.Status != CustomerStatus.Archived);
    }
}
```

It's still possible to create a global filter without a name, which behaves as before.
But, you can't use both named and unnamed filters for the same entity type.

Now to disable specific filters in a query, you can use the `IgnoreQueryFilters` method and provide the name(s) of the filters you want to disable.

```csharp
// Filtered query, customers that are soft-deleted or archived are excluded (same as before)
var activeCustomers = await context.Customers
    .ToListAsync(cancellationToken);

// Unfiltered query, all customers are included (same as before)
var customers = await context.Customers
    .IgnoreQueryFilters()
    .ToListAsync(cancellationToken);

// Filtered query, customers that are soft-deleted are excluded, but archived customers are included
var customersWithArchived = await context.Customers
    .IgnoreQueryFilters(["StatusFilter"])
    .ToListAsync(cancellationToken);


// Unfiltered query, both soft-deleted and archived customers are included because both filters are ignored
var customersAll = await context.Customers
    .IgnoreQueryFilters(["StatusFilter", "SoftDeleteFilter"])
    .ToListAsync(cancellationToken);
```
