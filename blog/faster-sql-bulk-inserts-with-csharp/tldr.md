Using the [SqlBulkCopy](https://docs.microsoft.com/en-us/dotnet/api/system.data.sqlclient.sqlbulkcopy)
is the fastest way to insert data into a database.

```cs
var customers = new List<Customer>();

using var copy = new SqlBulkCopy(connectionString);

copy.DestinationTableName = "dbo.Customers";
copy.ColumnMappings.Add(nameof(Customer.Id), "Id");
copy.ColumnMappings.Add(nameof(Customer.FirstName), "FirstName");
copy.ColumnMappings.Add(nameof(Customer.LastName), "LastName");
copy.ColumnMappings.Add(nameof(Customer.Street), "Street");
copy.ColumnMappings.Add(nameof(Customer.City), "City");
copy.ColumnMappings.Add(nameof(Customer.State), "State");
copy.ColumnMappings.Add(nameof(Customer.PhoneNumber), "PhoneNumber");
copy.ColumnMappings.Add(nameof(Customer.EmailAddress), "EmailAddress");

copy.WriteToServer(ToDataTable(customers));
```

This generates a [bulk insert](https://docs.microsoft.com/en-us/sql/t-sql/statements/bulk-insert-transact-sql?view=sql-server-ver15) statement in TSQL.
