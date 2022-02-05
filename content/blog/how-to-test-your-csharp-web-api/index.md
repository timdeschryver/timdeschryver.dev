---
title: How to test your C# Web API
slug: how-to-test-your-csharp-web-api
description: How to use functional testing to have confidence in the code you ship.
author: Tim Deschryver
date: 2020-03-23
tags: csharp, dotnet, testing, xunit
banner: ./images/banner.jpg
published: true
---

If you've read some of my other blog posts, you probably know that I'm not a big fan of unit tests.
Sure, they have their purposes, but often it means that one or more parts of the System Under Test (SUT) are being mocked or stubbed. It's this practice that I'm not too keen about.

To have full confidence in my code, it is integration tests (or functional tests) that I'm grabbing for.
In my experience, integration tests [are also easier and faster to write](../why-writing-integration-tests-on-a-csharp-api-is-a-productivity-booster/index.md).

With an integration test, we test the API from the outside out by spinning up the (in-memory) API client and making an actual HTTP request. I get confidence out of it because I mock as little as possible, and I will consume my API in the same way as an application (or user) would.

> The following tests are written in .NET 5 (but this also applies to .NET Core 3) and are using [xUnit](https://xunit.net/) as test the runner. For .NET 6 with minimal APIs you have to make a small tweak, which you can read about [here](../refactor-functional-tests-to-support-minimal-web-apis/index.md).

## A simple test

The only requirement to write an integration test is to use the `Microsoft.AspNetCore.Mvc.Testing` NuGet package.
You can install this package with the following command.

```bash
dotnet add package Microsoft.AspNetCore.Mvc.Testing
```

> TIP: I also use `FluentAssertions` to write my assertions because it contains some useful and readable utility methods to assert that the response is correct. I also recommend `AutoFixture` to [stop worrying about test setups](../why-i-stopped-worrying-about-test-setups-by-using-autofixture/index.md).

The `Microsoft.AspNetCore.Mvc.Testing` packages include a `WebApplicationFactory<TEntryPoint>` class that spawns a TestServer instance, which runs the API in-memory during a test. This is convenient because we don't need to have the API running before we run these integration tests.

Once the application instance is created, we can create a new HTTP client to make our HTTP request.
This is all that's required to write the first test.

```cs:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests
{
    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        await using var application = new WebApplicationFactory<Api.Startup>();
        using var client = application.CreateClient();

        var response = await client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

How neat is this!
To write a test that provides real value, there's (almost) no setup!
The test simply spawns the application, makes a request, and verifies that it was successful.

## A simple test using xUnit's Fixtures

To make the test compact we can use the [`IClassFixture`](https://xunit.net/docs/shared-context#class-fixture) from xUnit.
The test class now inherits from `IClassFixture<WebApplicationFactory<Api.Startup>>`, and gets an instance of its generic injected into the constructor.
To prevent the repetition of creating a client in each test, the constructor instantiates an `HttpClient` and assigns it to the private `_client` variable, which is used in each test.

Because the test class implements the xUnit `IClassFixture` interface, the test cases inside the class share a single test context. Meaning that the application is now only bootstrapped once for all the test cases inside the test class, and is disposed of when all tests have been completed.

```cs:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests: IClassFixture<WebApplicationFactory<Api.Startup>>
{
    readonly HttpClient _client;

    public WeatherForecastControllerTests(WebApplicationFactory<Api.Startup> application)
    {
        _client = application.CreateClient();
    }

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        var response = await _client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

## Writing your own `WebApplicationFactory`

Sadly, in a real application, things get more complicated.
In a real application, we have to deal with external dependencies, and these might need to be mocked.
For example, to prevent that e-mails are sent as a side effect of a test.

But I do suggest keeping as many as possible real instances of dependencies that you're in control of, for example, the database.
For the dependencies that are out of your reach, mostly 3rd-party driven-ports, there's a need to create mocked instances.
This allows you to return expected data and prevents that test data is created in a 3rd party service.

> [Jimmy Bogard](https://twitter.com/jbogard) explains why you should avoid in-memory databases for your tests in his blog post ["Avoid In-Memory Databases for Tests"](https://jimmybogard.com/avoid-in-memory-databases-for-tests/)

**The `WebApplicationFactory` allows you to alter the internals of the application, intervene with the pipeline of a request, or to replace objects in the Dependency Injection (DI) container.**

To implement a custom `WebApplicationFactory`, create a new class that inherits from `WebApplicationFactory`.

```cs:ApiWebApplicationFactory.cs
using Microsoft.AspNetCore.Mvc.Testing;

public class ApiWebApplicationFactory : WebApplicationFactory<Api.Startup>
{
}
```

### Override Injected Instances of the DI Container

To change the DI setup of the application, override the `ConfigureWebHost` method.
Now, you can configure the application with your test setup by using the `ConfigureTestServices` extension method.

In the example below, the `IWeatherForecastConfigService` is configured to use a `WeatherForecastConfigMock` mock instance instead of its real implementation.

```cs{9-17}:ApiWebApplicationFactory.cs
using MyApplication.Api.Ports;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

public class ApiWebApplicationFactory : WebApplicationFactory<Api.Startup>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Is be called after the `ConfigureServices` from the Startup
        // which allows you to overwrite the DI with mocked instances
        builder.ConfigureTestServices(services =>
        {
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigMock>();
        });
    }
}
```

### Test specific appsettings

I like to run integration tests against a test-specific database because it allows running seed and teardown scripts without affecting the development or QA environment.

Therefore, create a new `integrationsettings.json` settings file within your test project and set the variables that need to be overwritten to run your tests.
In the example below, the settings file contains the connectionstring pointing towards the integration test database.

```json:integrationsettings.json
{
  "ConnectionStrings": {
    "SQL": "Data Source=tcp:localhost,1533;Initial Catalog=IntegrationDB;User Id=sa;Password=password;"
  }
}
```

To configure the in-memory application to use this settings file, use the `ConfigureAppConfiguration` extension method to add the test configuration settings.

```cs{14-21}:ApiWebApplicationFactory.cs
using MyApplication.Api.Ports;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

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
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigMock>();
        });
    }
}
```

### Using the `ApiWebApplicationFactory` in tests

To use your custom `WebApplicationFactory`, simply swap the default `WebApplicationFactory` class with your own implementation.

```cs{6}:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests
{
    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        await using var application = new ApiWebApplicationFactory();
        using var client = application.CreateClient();

        var response = await client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

Or if you're using the xUnit fixture:

```cs{1}:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests: IClassFixture<ApiWebApplicationFactory>
{
    readonly HttpClient _client;

    public WeatherForecastControllerTests(ApiWebApplicationFactory application)
    {
        _client = application.CreateClient();
    }

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        var response = await _client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
```

## A custom and reusable xUnit fixture

What I like to do is make each test independent of the other.
This has as benefit that the test cases don't interfere with each other and that each case can be written or debugged on its own.
To be able to do this, we have to perform a reseed of the database before each test is run.

> To reseed my databases I'm using the [Respawn](https://github.com/jbogard/Respawn) package

Ideally, we don't want this code to leak through the test cases, these should remain compact and focused.
To hide common logic (for example, clearing a database) and to keep things DRY, I create an abstraction layer.

There are multiple options to do this, but I usually introduce an abstract class, `IntegrationTest`.
The responsibility of this class is to encapsulate the boilerplate code, and it also exposes commonly used variables within the test cases, the most important one being an `HttpClient` because we need it in every test to send HTTP requests to the application.

```cs:IntegrationTest.cs
[Trait("Category", "Integration")]
public abstract class IntegrationTest: IClassFixture<ApiWebApplicationFactory>
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

    public IntegrationTest(ApiWebApplicationFactory fixture)
    {
        _factory = fixture;
        _client = _factory.CreateClient();

        _checkpoint.Reset(_factory.Configuration.GetConnectionString("SQL")).Wait();
    }
}
```

The test class can now inherit from the `IntegrationTest` fixture, this looks as follows.

```cs{1, 3-4}:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests: IntegrationTest
{
    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
      : base(fixture) {}

    [Fact]
    public async Task GET_retrieves_weather_forecast()
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

I also like it because it marks the test class to contain integration tests.
This makes it possible to filter a test run to only run the integration tests of your project, or to exclude them.

```bash
dotnet test --filter Category=Integration
dotnet test --filter Category!=Integration
```

While the `WebApplicationFactory` configures the internals of the application, **think of the abstract `IntegrationTest` class as a tool to make it easier to interact with the application.**

## One-off test setups

To prevent an exponential growth of test fixtures, we can use the `WithWebHostBuilder` method from the `WebApplicationFactory` class. This is helpful for tests that require a specific setup.

The `WithWebHostBuilder` method will create a new instance of the `WebApplicationFactory`.
If a custom `WebApplicationFactory` class is used (in this example, `ApiWebApplicationFactory`) the logic inside `ConfigureWebHost` will still be executed.

In the code below we use the `InvalidWeatherForecastConfigMock` class to fake an invalid configuration, which should result in a bad request. Because this setup is only required once, we can set it up inside the test itself.

```cs{9-16}:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests: IntegrationTest
{
    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
      : base(fixture) {}

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddTransient<IWeatherForecastConfigService, InvalidWeatherForecastConfigMock>();
            });
        })
        .CreateClient(new WebApplicationFactoryClientOptions());

        var response = await client.GetAsync("/weatherforecast");
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
```

## Testing endpoints behind an authentication wall

We need to have a way to make an authenticated request in order to test endpoints that require a user to be authenticated or to have a certain claim

### Using a real token

The first option is to not touch anything and to authenticate the test user before firing an HTTP request to the application.
Once the token is generated it can be put aside, so you don't have to generate a token for each test case.
I'm not a big fan of this method because it slows down the execution of the tests, and more importantly, these integration tests are not responsible to test the authentication nor the authorization behavior of your application. You can have a handful of tests for this, but not it shouldn't intrude in every test case.

### AllowAnonymousFilter

The second and most simple option is to allow anonymous requests, this can be done by adding the `AllowAnonymousFilter`.
For simple applications, this can be enough, but the option we'll se enect is probably the best and most flexible solution.

```cs{18}:ApiWebApplicationFactory.cs
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
            MvcServiceCollectionExtensions.AddMvc(services, options => options.Filters.Add(new AllowAnonymousFilter()));
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigMock>();
        });
    }
}
```

### AuthenticationHandler

The most complete solution to handle the authentication and authorization is to write a custom authentication handler.
This gives you full control over the test user and gives you the flexibility to write multiple users for different scenarios.

This authentication handler implements `AuthenticationHandler` and overrides the `HandleAuthenticateAsync` method.
Within this method, we can create a valid claim for the `IntegrationTest` authentication schema that represents an authenticated user.

```cs:IntegrationTestAuthenticationHandler.cs
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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

Next, register the `IntegrationTest` authentication schema and configure the application to use this schema as the default within the `WebApplicationFactory`.

```cs{18-23}:ApiWebApplicationFactory.cs
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
            services.AddTransient<IWeatherForecastConfigService, WeatherForecastConfigMock>();
        });
    }
}
```

## Useful utilities

### Testing multiple endpoints at once parameterized xUnit tests

For tests that require an identical setup, we can write a `Theory` instead of a `Fact` and use `InlineData` to parameterize our tests.
I suggest only applying this for simple requests that just verify that these endpoints don't throw an error.

```cs
[Theory]
[InlineData("/endoint1")]
[InlineData("/endoint2/details")]
[InlineData("/endoint3?amount=10&page=1")]
public async Task Smoketest_endpoint_with_different_params_are_OK(string endpoint)
{
    var response = await _client.GetAsync(endpoint);
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}
```

### Keep test cases short and readable with extension methods

The test case should focus on its use case, and not on the technical details to arrange or assert the test case.
Don't be afraid to write your own extension methods to accomplish this.

For example, invoking an API request and deserializing the response of the request adds a lot of boilerplate and duplication to a test case. To make a test concise, extract this logic and refactor it into an extension method.

```cs:Extensions.cs
public static class Extensions
{
    public static Task<T> GetAndDeserialize<T>(this HttpClient client, string requestUri)
    {
        var response = await _client.GetAsync(requestUri);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<T>(result);

        // Note: this can be turned into a one-liner starting from .NET 5, or with the System.Net.Http.Json package
        // return client.GetFromJsonAsync<T>(requestUri);
    }
}
```

If we refactor the test to use the extension method, it immediately looks better.
The test case reads easier and with a single look, we can now understand the refactored test.

```cs:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests: IntegrationTest
{
    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
      : base(fixture) {}

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        var forecast = await _client.GetAndDeserialize("/weatherforecast");
        forecast.Should().HaveCount(7);
    }
}
```

#### Parallel tests

If multiple tests try to read and write to the same database, there's a high possibility that this may lead to deadlock errors.
As a solution, turn off the parallelization of the test runner.

With xUnit, this is done by setting the `parallelizeTestCollections` property to `false` inside the `xunit.runner.json` config file.
For more info, see the [xUnit docs](https://xunit.net/docs/configuration-files#parallelizeTestCollections).

```json:xunit.runner.json
{
   "$schema": "https://xunit.net/schema/current/xunit.runner.schema.json",
   "parallelizeTestCollections": false
}
```

## Conclusion

Previously I didn't like to write tests for a C# API.
But now that I've discovered functional testing, I enjoy writing them.

With little to no setup required, the time spent on writing tests has been cut in half (if not more!) while they provide more value.
Whereas previously most of the time was spent (at least for me) on the setup of the test, and not the actual test itself.
The time spent on writing them feels more like time well spent.

If you follow the theory about a refactor, you shouldn't be changing your tests.
In practice, we found out (the hard way) that this is not always true.
Thus, this usually also meant regression bugs in our case.
Because integration tests don't care about the implementation details, it means that you won't have to refactor or rewrite previously written tests when you're refactoring application code.
As maintainers of the codebase this gives us more confidence when we change, move, and delete code.
The test itself almost doesn't change over time, which also trims down the time spent on the maintenance of such tests.

Does this mean I don't write unit tests?
No, it does not, but I write them less than before.
I only write unit tests for real business logic that don't require dependencies, just input in and output out (a pure method).

Yes, it's true that integration tests might take a bit longer to run, but it's worth it in my opinion.
It also isn't that bad, we now have faster machines and a better a infratructure as before, so it isn't a big problem.

In short, I like that integration tests give me more confidence that the code we ship, is actually working the way it's intended to work.
We're not mocking important parts of the application, we're testing the application as a whole.

The full example can be found on [GitHub](https://github.com/timdeschryver/HowToTestYourCsharpWebApi).

## More resources

- [The official docs about integration tests](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests)
- [Easier functional and integration testing of ASP.NET Core applications](https://www.hanselman.com/blog/EasierFunctionalAndIntegrationTestingOfASPNETCoreApplications.aspx) by [Scott Hanselman](https://twitter.com/shanselman)
- [Avoid In-Memory Databases for Tests](https://jimmybogard.com/avoid-in-memory-databases-for-tests/) by [Jimmy Bogard](https://twitter.com/jbogard)
