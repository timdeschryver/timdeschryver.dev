Use the new [`SqlQuery` method](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-8.0/whatsnew?WT.mc_id=DT-MVP-5004452#raw-sql-queries-for-unmapped-types):

```csharp
IQueryable<OrderDTO> orders = dbContext.Database
    .SqlQuery<OrderDTO>($"SELECT ...");
```
