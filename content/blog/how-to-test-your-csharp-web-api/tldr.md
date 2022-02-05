Integration tests give you more confidence in the code you write because (almost) nothing is mocked.

## Creating a WebApplicationFactory

The `WebApplicationFactory` is used to create an in-memory instance of your C# Api application.
Create your own implementation to override the configuration of the application.
This is useful to change appsettings, provide mock implementations, and to add an integration test authentication schema.

**The `WebApplicationFactory` allows you to alter the internals of the application, intervene with the pipeline of a request, or to replace objects in the Dependency Injection (DI) container.**

```cs:ApiWebApplicationFactory.cs
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

public class ApiWebApplicationFactory : WebApplicationFactory<Api.Startup>
{
    public IConfiguration Configuration { get; private set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config =>
        {
            Configuration = new ConfigurationBuilder()
                .AddJsonFile("integrationsettings.json")
                .Build();

            config.AddConfiguration(Configuration);
        });

        builder.ConfigureTestServices(services =>
        {
            services
                .AddAuthentication("IntegrationTest")
                .AddScheme<AuthenticationSchemeOptions, IntegrationTestAuthenticationHandler>(
                    "IntegrationTest",
                    options => { }
                );
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigStub>();
        });
    }
}

internal class IntegrationTestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public IntegrationTestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
      ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock)
      : base(options, logger, encoder, clock)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[] {
            new Claim(ClaimTypes.Name, "IntegrationTest User"),
            new Claim(ClaimTypes.NameIdentifier, "IntegrationTest User"),
            new Claim("a-custom-claim", "squirrel 🐿️"),
        };
        var identity = new ClaimsIdentity(claims, "IntegrationTest");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "IntegrationTest");
        var result = AuthenticateResult.Success(ticket);
        return Task.FromResult(result);
    }
}
```

## Creating an xUnit Class Fixture

Create the in-memory instance once for all the tests in a single class with [`IClassFixture` from xUnit](https://xunit.net/docs/shared-context#class-fixture).
This reduces the noise within the test cases.

**Think of the abstract `IntegrationTest` class as a tool to make it easier to interact with the application.**

You can also add a test category to exclude/include integration tests while using the `dotnet test` command.

```cs:IntegrationTest.cs
[Trait("Category", "Integration")]
public abstract class IntegrationTest : IClassFixture<ApiWebApplicationFactory>
{
    protected readonly ApiWebApplicationFactory _factory;
    protected readonly HttpClient _client;

    public IntegrationTest(ApiWebApplicationFactory fixture)
    {
        _factory = fixture;
        _client = _factory.CreateClient();
    }
}
```

## Writing a Test

The test class extends from our `IntegrationTest` class.
Each test makes a request to the in-memory instance of the application and asserts that the result is what it should be.

```cs:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests : IntegrationTest
{
    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
        : base(fixture) { }

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        var forecast = await _client.GetFromJsonAsync<WeatherForecast[]>("/weatherforecast");
        forecast.Should().HaveCount(7);
    }
}
```
