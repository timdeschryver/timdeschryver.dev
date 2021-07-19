Integration tests give you more confidence in the code you write because (almost) nothing is mocked.

## Creating a WebApplicationFactory

The `WebApplicationFactory` is used to create an in-memory instance of your C# Api.
For simple projects this step can be skipped, for the more complex projects, this allows you to configure the API.
[Microsoft docs](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-5.0#customize-webapplicationfactory).

```cs
public class ApiWebApplicationFactory : WebApplicationFactory<Api.Startup>
{
    public IConfiguration Configuration { get; private set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config =>
        {
            // Override config
            // Can be useful to change connectionstrings
            Configuration = new ConfigurationBuilder()
                .AddJsonFile("integrationsettings.json")
                .Build();
            config.AddConfiguration(Configuration);
        });

        // Shared test setup
        builder.ConfigureTestServices(services =>
        {
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigStub>();
        });
    }
}
```

## Creating an xUnit Class Fixture

Create the in-memory instance once for all the tests in a single class with `IClassFixture`.
This makes the execution of multiple tests faster.  
[xUnit docs](https://xunit.net/docs/shared-context#class-fixture).

```cs
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

The test class extends from `IntegrationTest`.
Each test makes a request to the in-memory instance of the API and asserts the result.

```cs
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

## Writing a one-off Test

Create a new instance of the API by invoking `WithWebHostBuilder`.
This is useful for single tests that need a specific configuration.

```cs
public class WeatherForecastControllerTests : IntegrationTest
{
    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
        : base(fixture) { }

    [Fact]
    public async Task GET_with_invalid_config_results_in_a_bad_request()
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddTransient<IWeatherForecastConfigService, InvalidWeatherForecastConfigStub>();
            });
        })
        .CreateClient();

        var response = await client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
```
