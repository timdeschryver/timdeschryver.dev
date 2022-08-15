---
title: Refactor Functional Tests to support Minimal Web APIs
slug: refactor-functional-tests-to-support-minimal-web-apis
description: Some small changes that are needed to create application instances in Functional Tests for Minimal Web APIs
author: Tim Deschryver
date: 2021-10-11
tags: .NET, csharp, testing, minimal api
---

I really like to write functional tests for my code.
The biggest reason is that each test represents a client that interacts with the application.
Just like a real client, the test doesn't care about the internal details of the application. The test only cares about the result.

Because of it, existing test cases don't need to be touched while we're refactoring the code base, for example, when we're migrating to the new ASP.NET 6 Minimal Web API structure.

To be fair... in this case, some small changes are required.
Luckily, these changes are minor and are only affecting the setup of the tests suites.
The tests themselves remain untouched.
This gives us the confidence to ship our application when the migration is complete.

In [How to test your C# Web API](/blog/how-to-test-your-csharp-web-api?tldr=1) we learned how to write functional tests.
To freshen up our memory, here's the base setup that is used in that article.

```cs:ApiWebApplicationFactory.cs
public class ApiWebApplicationFactory : WebApplicationFactory<Startup>
{
    public IConfiguration Configuration { get; private set; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config => {});
        builder.ConfigureTestServices(services => {});
    }
}
```

If you look closely, you'll notice that the `WebApplicationFactory` is created by using the `Startup` type from the Web API project.
This causes to be the problem because `Startup` doesn't exist anymore in a Minimal Web API.

> More info about the new structure in [Maybe it's time to rethink our project structure with .NET 6](/blog/maybe-its-time-to-rethink-our-project-structure-with-dot-net-6).

Fortunately, this doesn't mean that we have to rethink and rewrite our tests (setup).

## Reference a Minimal Web API

There is one _special_ file in a Minimal Web API, which is the one that uses [top-level statements](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/tutorials/top-level-statements) (there can only be one file like this). This file can be referenced as `Program`, and unusually the file is also named `Program.cs` (the name of the file doesn't affect the `Program` type name).

This `Program` type has the `internal` access modifier and thus can't be referenced from outside the project by default.
To make it accessible in the test project, we need to give the test project access to the internals of the API Project.
This is done by adding an `InternalsVisibleTo` attribute to the API `csproj`.

```html{12-14}:ApiProject.csproj
<Project Sdk="Microsoft.NET.Sdk.Web">
    <PropertyGroup>
        <TargetFramework>net6.0</TargetFramework>
        <Nullable>enable</Nullable>
        <ImplicitUsings>enable</ImplicitUsings>
    </PropertyGroup>

    <ItemGroup>
        <PackageReference Include="Swashbuckle.AspNetCore" Version="5.6.3" />
    </ItemGroup>

    <ItemGroup>
        <InternalsVisibleTo Include="ApiProject.Tests" />
    </ItemGroup>
</Project>
```

Afterward, the `Program` type (instead of `Startup`) can be used in the test project to create the application.

```cs:ApiWebApplicationFactory.cs{1}
public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config => {});
        builder.ConfigureTestServices(services => {});
    }
}
```

But we're not there yet.
When we try to create the application by using `Project`, we get the compile error [CS0060](https://docs.microsoft.com/en-us/dotnet/csharp/misc/cs0060).

```cs:ApiWebApplicationFactory.cs{2-4}
public class ApiWebApplicationFactory : WebApplicationFactory<Program>
             ~~~~~~~~~~~~~~~~~~~~~~~~
             base class 'WebApplicationFactory<Program>'
             is less accessible than class 'ApiWebApplicationFactory'
{
}
```

This can quickly be fixed by also modifying the access modifier of our class to `internal`.

```cs:ApiWebApplicationFactory.cs{1}
internal class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config => {});
        builder.ConfigureTestServices(services => {});
    }
}
```

If you're manually spawning new applications then you're job is done here.
You can now spawn a new instance of the API application and test it, just like before.

```cs{5}:WeatherForecastControllerTests.cs
public class WeatherForecastControllerTests {
    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
        var api = new ApiWebApplicationFactory();
        var forecast = await api.CreateClient().GetAndDeserialize<WeatherForecast[]>("/weatherforecast");
        forecast.Should().HaveCount(7);
    }
}
```

Though, another problem appears with this code if you're using XUnit fixtures to create the API application.
It might be worthwhile to continue to read, _even if you're not using XUnit_, because the following solution might have your preference.

## Working with XUnit Fixtures

Because we've changed the test's class to internal, we get the next compiler error, `xUnit1000 Test classes must be public`.

```cs:WeatherForecastControllerTests.cs{2-3}
internal class WeatherForecastControllerTests : IClassFixture<ApiWebApplicationFactory>
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               xUnit1000 Test classes must be public
{
    private readonly ApiWebApplicationFactory _fixture;

    internal WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
    }
}
```

The workaround for this is to reference a public type from the API project.
This can be any type you'd want, but [it seems like](https://github.com/DamianEdwards/MinimalApiPlayground/issues/13#issuecomment-936910971) creating your own `Program` type is the desired way to do this.

```cs{8}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services.RegisterModules();

var app = builder.Build();
app.MapEndpoints();
app.Run();

public partial class Program { }
```

After this, we can [revert the changes](#33d970997f7d4e4f9b47e86282767228) to make the internals of the API projects visible.
Next, the `Program` type can now be referenced to create the fixture.

```cs:WeatherForecastControllerTests.cs{1,10}
public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config => {});
        builder.ConfigureTestServices(services => {});
    }
}

public class WeatherForecastControllerTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _fixture;

    public WeatherForecastControllerTests(ApiWebApplicationFactory fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GET_retrieves_weather_forecast()
    {
    }
}
```

The final step is to run the tests again and make sure they're all turning green.

Happy upgrading!
