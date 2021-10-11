When you're migrating an existing codebase to use the new ASP.NET 6 Minimal Web API structure or if you're writing your first test, then you might notice that the setup of a functional test is a tiny bit different.

Because we're testing the application from the outside, and not its internal details, the tests should be green after these changes.

## Make `Program` public

```diff:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.RegisterModules();

var app = builder.Build();
app.MapEndpoints();
app.Run();

+ public partial class Program { }
```

## Use the `Program` type (instead of `Startup`) to create a `WebApplicationFactory`

```diff:WebApplicationFactory.cs
- public class ApiWebApplicationFactory : WebApplicationFactory<Startup>
+ public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config => {});
        builder.ConfigureTestServices(services => {});
    }
}
```
