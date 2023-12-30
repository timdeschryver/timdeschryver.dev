---
title: Bulk updates in Entity Framework
slug: bulk-updates-in-entity-framework
date: 2023-10-24
tags: dotnet, entity-framework
---

# Bulk updates in Entity Framework

Use bulk updates to update entities with a single command (without the need of the change tracker).

The entities will not be loaded into memory, which results in more efficient updates and deletes.

For more info, see my blog post ["New in Entity Framework 7: Bulk Operations with ExecuteDelete and ExecuteUpdate"](../../blog/new-in-entity-framework-7-bulk-operations-with-executedelete-and-executeupdate/index.md), or the [documentation](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-7.0/whatsnew#executeupdate-and-executedelete-bulk-updates).

```csharp
// Use ExecuteDeleteAsync to delete entities
await context.Set<CartItem>()
  .ExecuteDeleteAsync();

// Use Where as a filter to find specific entities (to delete or update)
await context.Set<CartItem>()
  .Where(c => c.Sku == "ABC")
  .ExecuteDeleteAsync();

// Use ExecuteUpdateAsync to update entities
await context.Set<CartItem>()
  .ExecuteUpdateAsync(s =>
    // Use SetProperty with a fixed value to update a property
    s.SetProperty(p => p.Amount, 100)
  );

await context.Set<CartItem>()
  .Where(c => c.Amount == 2)
  .ExecuteUpdateAsync(s =>
    // Use SetProperty to update a property using its current value
    s.SetProperty(p => p.Amount, v => v.Amount + 1)
  );
```
