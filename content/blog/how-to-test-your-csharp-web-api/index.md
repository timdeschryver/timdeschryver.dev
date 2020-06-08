---
title: How to test your C# Web API
slug: how-to-test-your-csharp-web-api
description: ... or how to use functional testing to have confidence in the code you ship.
author: Tim Deschryver
date: 2020-03-23
tags: csharp, dotnet, testing, xunit
banner: ./images/banner.jpg
bannerCredit: Photo by [Kinga Cichewicz](https://unsplash.com/@all_who_wander) on [Unsplash](https://unsplash.com)
published: true
---

If you've read some of my other blog posts already, you probably know that I'm not a big fan of unit tests.
Sure, they have their purposes but often it means that one or more parts of the System Under Test are being mocked or stubbed.
It's this practice that I'm not too keen about.
To have full confidence in my code, it are integration tests that I will be grabbing for.

With an integration test, we test the API from the outside out by spinning up the API client and making an actual HTTP request.
I get confidence out of it because I mock as little as possible, and I will consume my API in the same way as an application (or user) would.

Show me some code!

> The following tests are written in .NET Core 3 and are using [XUnit](https://xunit.net/) as test the runner.
> The setup might change with other versions and test runners but the idea remains the same.

## A simple test

The only requirement is that the `Microsoft.AspNetCore.Mvc.Testing` package is installed you can do this with the following command.
I also use `FluentAssertions` to write my assertions because the package contains some useful utility methods, and it's easy to read.

```bash
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

The packages includes a `WebApplicationFactory<TEntryPoint>` class which is used to bootstrap the API in memory.
This is convenient, as we don't need to have the API running before we run these tests.

In the test class, we inject the factory into the constructor.
With the factory, we can create a `HttpClient` which will be used in the tests to make HTTP requests.

```cs
public class WeatherForecastControllerTests: IClassFixture<WebApplicationFactory<Api.Startup>>
{
    public HttpClient Client { get; }

    public WeatherForecastControllerTests(WebApplicationFactory<Api.Startup> fixture)
    {
        Client = fixture.CreateClient();
    }
}
```

Because the test class implements from XUnit's `IClassFixture` interface, the tests inside this class will share a single test context. The API will only be bootstrapped once for all the tests and will be cleanup afterward.

This is everything we need to write the first test.
Using the `HttpClient` we can make a GET request, and assert the response it gives back.

```cs{10-18}
public class WeatherForecastControllerTests: IClassFixture<WebApplicationFactory<Api.Startup>>
{
    readonly HttpClient _client { get; }

    public WeatherForecastControllerTests(WebApplicationFactory<Api.Startup> fixture)
    {
        _client = fixture.CreateClient();
    }

    [Fact]
    public async Task Get_Should_Retrieve_Forecast()
    {
        var response = await _client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var forecast = JsonConvert.DeserializeObject<WeatherForecast[]>(await response.Content.ReadAsStringAsync());
        forecast.Should().HaveCount(5);
    }
}
```

How neat is this! To write a test that provides real value, we (almost) had no setup!

## Writing your own `WebApplicationFactory`

Sadly, in a real application, things get more complicated.
There will be external dependencies, these will still have need to be mocked or stubbed.

I suggest to keep using the real instances of dependencies you're in control, for example the database.
But for dependencies that are out of reach, mostly 3rd-party driven ports, I would use a stubbed instance, or create a mocked instance.

> [Jimmy Bogard](https://twitter.com/jbogard) explains why you should avoid in-memory databases for your tests in his recent blog post ["Avoid In-Memory Databases for Tests"](https://jimmybogard.com/avoid-in-memory-databases-for-tests/)

Luckily, it's simple to overwrite service instances.
By creating a custom `WebApplicationFactory`, the configuration can be altered before the API is built.
To do this, overwrite the `ConfigureWebHost` method.

```cs
public class ApiWebApplicationFactory : WebApplicationFactory<Api.Startup>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // will be called after the `ConfigureServices` from the Startup
        builder.ConfigureTestServices(services =>
        {
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigStub>();
        });
    }
}

public class WeatherForecastConfigStub : IWeatherForecastConfigService
{
    public int NumberOfDays() => 7;
}
```

To work with a real database I find it easier to create a separate database to run these tests.
Therefore, it's needed to provide some integration test settings.
These settings contain the new connection string that points to the database for the integration tests.
In more complex scenarios, the same settings can also be used to override environment variables.

To configure the application, we can use the `ConfigureAppConfiguration` method to add our configuration settings.

```cs{5-12}
public class ApiWebApplicationFactory : WebApplicationFactory<Api.Startup>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config =>
        {
            var integrationConfig = new ConfigurationBuilder()
              .AddJsonFile("integrationsettings.json")
              .Build();

            config.AddConfiguration(integrationConfig);
        });

        builder.ConfigureTestServices(services =>
        {
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigStub>();
        });
    }
}
```

```json:integrationsettings.json
{
  "ConnectionStrings": {
    "SQL": "Data Source=tcp:localhost,1533;Initial Catalog=IntegrationDB;User Id=sa;Password=password;MultipleActiveResultSets=True"
  }
}
```

## A custom and reusable fixture

What I like to do is making each test independent from each other.
This has as benefit that tests won't interfere with each other, and each test can be written/debugged on its own.
To be able to do this, we have to perform a reseed of the database before each test runs.

> To reseed my databases I'm using the [Respawn](https://github.com/jbogard/Respawn) package

To keep things DRY and to hide some of this logic, one of the possibilities is to create an abstraction layer.
With an abstract class, `IntegrationTest`, it's possible to expose commonly used variables, the most important one being the `HttpClient` because we need it to create the HTTP requests.

```cs
public abstract class IntegrationTest : IClassFixture<ApiWebApplicationFactory>
{
    private readonly Checkpoint _checkpoint = new Checkpoint
    {
        SchemasToInclude = new[] {
            "Playground"
        },
        WithReseed = true
    };

    protected readonly ApiWebApplicationFactory _factory;
    protected readonly HttpClient _client;
    protected readonly IConfiguration _configuration;

    public IntegrationTest(ApiWebApplicationFactory fixture)
    {
        _factory = fixture;
        _client = _factory.CreateClient();
        _configuration = new ConfigurationBuilder()
              .AddJsonFile("integrationsettings.json")
              .Build();

        _checkpoint.Reset(_configuration.GetConnectionString("SQL")).Wait();
    }
}
```

The test class can now inherit from the `IntegrationTest` fixture and looks as follows.

```cs
public class WeatherForecastControllerTests: Fixtures.IntegrationTest
{
    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
      : base(fixture) {}

    [Fact]
    public async Task Get_Should_Return_Forecast()
    {
        var response = await _client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var forecast = JsonConvert.DeserializeObject<WeatherForecast[]>(
          await response.Content.ReadAsStringAsync()
        );
        forecast.Should().HaveCount(7);
    }
}
```

As you can see in the code above, the test class doesn't contain setup logic because of the `IntegrationTest` abstraction.

## WithWebHostBuilder

To prevent an exponential growth of test fixtures, we can use the `WithWebHostBuilder` method on `WebApplicationFactory`. This is helpful for tests that require a different, specific setup.

The `WithWebHostBuilder` method will create a new instance of the `WebApplicationFactory`.
If a custom `WebApplicationFactory` class is used (in this example, `ApiWebApplicationFactory`) the logic inside `ConfigureWebHost` will still be executed.

In the code below we use the `InvalidWeatherForecastConfigStub` class to fake an invalid configuration, which should result in a bad request. Because this setup is only required once, we can set it up inside the test itself.

```cs{4-11}
[Fact]
public async Task Get_Should_ResultInABadRequest_When_ConfigIsInvalid()
{
    var client = _factory.WithWebHostBuilder(builder =>
    {
        builder.ConfigureServices(services =>
        {
            services.AddTransient<IWeatherForecastConfigService, InvalidWeatherForecastConfigStub>();
        });
    })
    .CreateClient(new WebApplicationFactoryClientOptions());

    var response = await client.GetAsync("/weatherforecast");
    response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
}
```

## Useful utilities

### Testing basic endpoints at once

For tests that require an identical setup we can write a `Theory` with `InlineData` to test multiple endpoints at once.
This tip only applies for simple queries and are a quick way to verify these endpoints to do fail.

```cs
[Theory]
[InlineData("/endoint1")]
[InlineData("/endoint2/details")]
[InlineData("/endoint3?amount=10&page=1")]
public async Task Smoketest_Should_ResultInOK(string endpoint)
{
    var response = await _client.GetAsync(endpoint);
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}
```

### Testing authenticated endpoints

For testing endpoints where you have to be authenticated, we have some options.

#### AllowAnonymousFilter

The most simple one is to just allow anonymous requests, this can be done by adding the `AllowAnonymousFilter`.

```cs
builder.ConfigureTestServices(services =>
{
    MvcServiceCollectionExtensions.AddMvc(services, options => options.Filters.Add(new AllowAnonymousFilter()));
});
```

#### AuthenticationHandler

The second option is to create a custom authentication handler.

> In a [GitHub issue](https://github.com/dotnet/AspNetCore.Docs/issues/6882) you can find multiple solutions to implement this.

The authentication handler will create a claim to represent an authenticated user.

```cs
public class IntegrationTestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
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
        };
        var identity = new ClaimsIdentity(claims, "IntegrationTest");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "IntegrationTest");
        var result = AuthenticateResult.Success(ticket);
        return Task.FromResult(result);
    }
}
```

We must configure application by adding the authentication handler.
To create an authenticated request we must add the `Authorization` header to the request.

```cs
builder.ConfigureTestServices(services =>
{
    services.AddAuthentication("IntegrationTest")
        .AddScheme<AuthenticationSchemeOptions, AuthenticationHandler>(
          "IntegrationTest",
          options => { }
        );
});

...

_client = _factory.CreateClient();
_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("IntegrationTest");
```

#### Using a real token

The last option is to use a real token.
This also means that you will have to generate a token before the tests run.
Once the token is generated it can be stored in order to not having to generate a token for each test, which will slow down the execution of the tests. Plus, we're not testing the authentication in these integration tests.

Just like before, we must add the token to the request header, but we're also assigning the token to the header.

```cs
_client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GetToken());

public static string GetToken()
{
    if (accessToken != null)
    {
        return accessToken;
    }

    // actual logic of generating a token
    return accessToken;
}
```

## Conclusion

Previously I didn't like to write tests for a C# API.
But now that I've discovered functional testing, I enjoy writing them.

With little to no setup required, the time spent on writing tests has been cut in half.
Whereas previously most of the time was spent (at least for me) on the setup of the test, and not the actual test itself.
The time spent on writing them feels more as time well spent.

If you follow the theory about a refactor, you shouldn't be changing your tests.
In practice, we found out (the hard way) that this is not always true.
Thus, this usually also meant regression bugs.
Because integration tests don't care about the implementation details, it should mean that you won't have to refactor or rewrite previously written tests.
This will give us, as maintainers of the codebase, more confidence when we change, move, and delete code.
The test itself will almost not change over time, which also trims down the time spent on the maintenance of these tests.

Does this mean I don't write unit tests?
No, it does not, but they are less written.
Only for real business logic that don't require dependencies, just input in and a result as output.

These integration tests might be slower to run, but it's worth it in my opinion.
Why? Because they give me more confidence that the code we ship, is actually working, the way it's intended to work.
We're not mocking or stubbing parts of the application, we're testing the whole application.
With machines being faster, there won't be much difference anyway between the other tests and the integration tests.
A couple of years ago, this time difference was higher, and this usually meant that fewer (or no) integration tests were written.
Time to change that, if you ask me!

## More resources

- [The official docs about integration tests](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-3.0)
- [Easier functional and integration testing of ASP.NET Core applications](https://www.hanselman.com/blog/EasierFunctionalAndIntegrationTestingOfASPNETCoreApplications.aspx) by [Scott Hanselman](https://twitter.com/shanselman)
- [Avoid In-Memory Databases for Tests](https://jimmybogard.com/avoid-in-memory-databases-for-tests/) by [Jimmy Bogard](https://twitter.com/jbogard)
