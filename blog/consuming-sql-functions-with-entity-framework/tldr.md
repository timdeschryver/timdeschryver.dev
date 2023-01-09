## DbContext

```cs{8-12, 14-18}:MyDbContext.cs
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

## Usage

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

## Generated SQL statement

```sql:customers.sql
SELECT [c].[Id], [c].[Name]
FROM [Customers] AS [c]
WHERE SoundEx([c].[Name]) = SoundEx(N'Timothy')
```
