---
title: Writing isolated (integration)tests with TestContainers
slug: writing-isolated-integrationtests-with-testcontainers
description: If you're having troubles with setting up or running your test environment, then this blog post is for you. We will explore what TestContainers is, what problem it solves, and why you should consider using it within your testing strategy.
date: 2025-08-28
tags: .NET, Testing, TestContainers, TUnit
---

There are two main categories of tests: unit tests and integration tests. Unit tests are small, fast, and isolated. They test a single unit of code, usually a function or method, in isolation from the rest of the system. Integration tests, on the other hand, test how different parts of the system work together. They are usually larger and might be slower than unit tests. Because integration tests cover more ground, they require a more complex setup process, which is a hurdle that you have to overcome.

Nevertheless, I [prefer writing integration tests over unit tests](/blog?q=C%23+test+api), because they give me more confidence that the system works as expected.
That's why I want to show you that writing integration tests doesn't always have to be a complex and tedious task.

Almost all applications interact with external systems, such as databases, SMTP clients, message brokers, and third-party APIs.
Which is needed and fine, but you don't want your tests to depend on these external systems, because that would make them slow, flaky, and dangerous.
Think about a message communication system, where you don't want to send test emails to real (or test) users.
This is something to avoid; your users won't laugh about it, even if you're using test users, and this can become costly over time.

To prevent this, you want your tests to be isolated from these external systems, which can be done in multiple ways.
You can create mocks or use packages that provide a different implementation of the external system (e.g. an in-memory database).
But by doing so, you are not testing the actual integration with the real external system. What's worse, you might hit on issues because the mock behaves differently from the real instance.

Another approach is to use a live testing instance that all tests connect to, and swap out the connection to the test instance during testing.
However, because the tests (and developers, and pipelines) share a live instance, this is not ideal, as it can lead to issues such as tests interfering with each other.
This approach is not applicable to all external systems.
I'm also always worried about accidentally connecting to the wrong instance, let's hope not against a production instance.

A better approach is to use [TestContainers](https://www.testcontainers.com/).

## Why TestContainers

From the [TestContainers website](https://www.testcontainers.com/), this is how they describe themselves:

> Testcontainers is an open source library for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container.
> No more need for mocks or complicated environment configurations. Define your test dependencies as code, then simply run your tests, and containers will be created and then deleted.

The key part here is that the infrastructure is defined as code, which makes it easy to set up and tear down the infrastructure needed for your tests. Without TestContainers, this would be a tedious task.

This gives you a lot of benefits, without the downsides of the other approaches.
The biggest value for me is that I can run my tests against a real instance, ensuring that the integration works as expected.

Let's go over the other benefits:

- **Isolation**: Each test can have its own container, ensuring that tests or people do not interfere with each other.
- **Consistency**: Tests always run against the same environment, which is set up for each run.
- **Simplicity**: No need to create and maintain mocks.

## Prerequisites

To make use of TestContainers, the only requirement is that your machine has [Docker](https://www.docker.com/) installed and running.

## Install TestContainers

TestContainers is available for multiple programming languages and provides a container for many popular external systems.
The full list of supported modules can be found on the [TestContainers website](https://testcontainers.com/modules/).

In this blog post, we'll be keeping it simple with just a  PostgreSQL database.
To install the PostreSQL TestContainers package, run the following command in your project:

```bash
dotnet add package Testcontainers.PostgreSql
```

## Creating a test container

Now that we have the package installed, we can set up a PostgreSQL container in our tests, which can be done within a couple of lines of code.

To create the container, TestContainers provides a builder pattern to configure the container.
Here, it's possible to define the image (this can be useful if you have a custom image), and more. For now, we'll just use the default image.

```cs
var postgresContainer = new PostgreSqlBuilder()
 // .WithImage("...")
 .Build();
```

This container can be started, and you're good to go!
As an example, let's create a connection to the database and execute a simple query.
The test:

- creates and starts a PostgreSQL container
- creates a connection to the database - use the `GetConnectionString` method to access the connection string
- executes the query

```cs
[Test]
public async Task Executes_a_query()
{
   var postgreSqlContainer = new PostgreSqlBuilder().Build();
   await postgreSqlContainer.StartAsync();

   var connectionString = postgreSqlContainer.GetConnectionString();
   await using var dataSource = new NpgsqlDataSourceBuilder(connectionString).Build();

   var command = dataSource.CreateCommand("SELECT 1");
   var result = await command.ExecuteNonQueryAsync();

   await Assert.That(result).IsEqualTo(-1);

   await postgreSqlContainer.StopAsync();
   await postgreSqlContainer.DisposeAsync();
}
```

## Integrating a test container in your tests

The above code gives you an idea of how to use TestContainers, but it's not very practical.
We don't want to repeat the setup and teardown of the container in each test.

Within ASP.NET integration tests, we also want to replace the database connection of the application with the connection to the test container.

To achieve this, we can create a custom [`WebApplicationFactory`](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.testing.webapplicationfactory-1?view=aspnetcore-9.0) to configure the application for testing.

Depending on the test framework, this code is slightly different, but the concept is the same.
Using `WebApplicationFactory`, we want to spin up the ASP.NET application. It also provides a method to configure the services, which is useful for overriding certain services or configurations for the testing environment. We will use this to replace the database connection string with the connection string of the test container.

Here is an example of a `WebApplicationFactory` that sets up a PostgreSQL test container and replaces the database connection string, using [TUnit](https://github.com/thomhurst/TUnit) as the test framework.

In the example below, the `CustomerApiWebApplicationFactory` class inherits from `WebApplicationFactory<Program>`, which is the entry point of the ASP.NET application.
Using the `IAsyncInitializer` and `IAsyncDisposable` interfaces, the PostgreSQL container is started before the tests run and disposed of after the tests complete.
Within the `ConfigureWebHost` method, the connection string is replaced with the connection string of the test container.

```cs:CustomerApiWebApplicationFactory.cs
public class CustomerApiWebApplicationFactory : WebApplicationFactory<Program>, IAsyncInitializer, IAsyncDisposable
{
   private readonly PostgreSqlContainer _postgreSqlContainer = new PostgreSqlBuilder().Build();

   public async Task InitializeAsync()
   {
       await _postgreSqlContainer.StartAsync();
   }

   public override async ValueTask DisposeAsync()
   {
       await base.DisposeAsync();
       await _postgreSqlContainer.DisposeAsync();
   }

   protected override void ConfigureWebHost(IWebHostBuilder builder)
   {
       ArgumentNullException.ThrowIfNull(builder);
       builder.UseSetting("ConnectionStrings:sandbox-db", _postgreSqlContainer.GetConnectionString());

       builder.UseEnvironment("IntegrationTest");
   }
}
```

Using this `WebApplicationFactory`, we can now create integration tests that run against an isolated PostgreSQL instance.
But this just creates an empty database, which is not very useful.
To make the database useful, we can apply migrations and seed data during the setup of the test container.

## Applying EF migrations

To apply EF migrations, I also configure the database context within the `ConfigureServices` method to include the migrations assembly (in my application, I have a separate project for the migrations that runs separately).
After the container is started, the migrations are applied.

```cs:CustomerApiWebApplicationFactory.cs{11-13,26-36}
public class CustomerApiWebApplicationFactory : WebApplicationFactory<Program>, IAsyncInitializer, IAsyncDisposable
{
   private readonly PostgreSqlContainer _postgreSqlContainer = new PostgreSqlBuilder().Build();

   public async Task InitializeAsync()
   {
       await _postgreSqlContainer.StartAsync();

       _ = Server;

       using var scope = Server.Services.CreateScope();
       var dbContext = scope.ServiceProvider.GetRequiredService<CustomerDbContext>();
       await dbContext.Database.MigrateAsync();
   }

   public override async ValueTask DisposeAsync()
   {
       await base.DisposeAsync();
       await _postgreSqlContainer.DisposeAsync();
   }

   protected override void ConfigureWebHost(IWebHostBuilder builder)
   {
       ArgumentNullException.ThrowIfNull(builder);
       builder.UseSetting("ConnectionStrings:sandbox-db", _postgreSqlContainer.GetConnectionString());

       builder.ConfigureServices(services =>
       {
           services.AddDbContext<CustomerDbContext>(
               options =>
                   options.UseNpgsql(
                       _postgreSqlContainer.GetConnectionString(),
                       x => x.MigrationsAssembly(typeof(migrations.Program).Assembly.GetName().Name)
                    )
            );
        });

       builder.UseEnvironment("IntegrationTest");
    }
}
```

If you want, you can also extend this to seed data, which can be useful for testing.
If this takes a long time, you might want to consider creating a base image with the database pre-seeded.

## Example test case

Now that we have the `CustomerApiWebApplicationFactory`, we can write integration tests that run against an isolated PostgreSQL instance with the latest migrations applied.
To speed up the tests, we can share the same instance of the `WebApplicationFactory` across multiple tests. TUnit makes this very easy and readable to configure using the `ClassDataSource` attribute.

The test creates a new HTTP client for our API, creates a new customer using the POST endpoint, and retrieves the customer using the GET endpoint.
Finally, it asserts that the response is as expected.

```cs:CustomerApiTests.cs
[ClassDataSource<CustomerApiWebApplicationFactory>(Shared = SharedType.PerTestSession)]
public class CustomerApiTests(CustomerApiWebApplicationFactory WebAppFactory)
{
   [Test]
   public async Task GetCustomer_WithValidId_Returns_OkWithCustomer()
   {
       using var client = WebAppFactory.CreateClient();

       var createCustomerCommand = new CreateCustomer.Command(
           FirstName: "Individual",
           LastName: "Customer",
           BillingAddress: new CreateCustomer.BillingAddress(
               Street: "789 Pine St",
               City: "TestCity",
               ZipCode: "54321"
            ),
           ShippingAddress: null
        );

      var createResponse = await client.PostAsJsonAsync("/customers", createCustomerCommand);
      var customerId = await createResponse.Content.ReadFromJsonAsync<CustomerId>();
      var response = await client.GetAsync(new Uri($"/customers/{customerId}", UriKind.Relative));

      await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.OK);

      var customer = await response.Content.ReadFromJsonAsync<GetCustomer.Response>();
      await Assert.That(customer).IsNotNull();
      await Assert.That(customer!.FirstName).IsEqualTo("Individual");
      await Assert.That(customer.LastName).IsEqualTo("Customer");
      await Assert.That(customer.BillingAddresses.Count()).IsEqualTo(1);
      await Assert.That(customer.ShippingAddresses.Count()).IsEqualTo(0);
   }
}
```

You can notice that the test has more assertions (one to create the customer, one to retrieve it) compared to a unit test, but I prefer this as it covers the flow just by the external ports of the application.
This prevents us from testing the internal implementation details, which I strongly want to avoid.

## What about the CI pipeline?

Your test suite becomes self-contained when you replace all external systems with test containers.
This makes it effortless to run these tests anywhere, including your CI pipeline.

Just as with a local development environment, the only requirement is that the machine running the tests has Docker installed and running. Luckily, most hosted CI agents (including Azure DevOps, and GitHub) already have Docker installed, so you don't have to worry about it. If you're using self-hosted agents, make sure to install Docker on the machine.

## Conclusion

Personally, I believe that integration tests give a lot of value and confidence that the system works as expected.
That's why I prefer writing integration tests over unit tests for applications/endpoints without much logic.

The thing to keep in mind while writing integration tests, is that it's important to ensure that they do not consume external systems. Otherwise it's possible to accidentally affect real data and users.
In the past, this was not always easy, but with TestContainers this becomes a lot easier.

A test container is a Docker container that can be started and stopped programmatically, making it fast to set up and tear down the infrastructure needed for your tests without jumping through hoops.
TestContainers also provides an isolated environment for each test, ensuring that tests do not interfere with each other. Because of this your test suite can also be run parallely, which might offer a significant speed boost.

In short, a test container makes it easy to write reliable and repeatable integration tests that give you confidence that your application works as expected.

For the full source code of the examples in this blog post, you can check out the code on [GitHub](https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.Modules.CustomerManagement.IntegrationTests/CustomerApiTests.cs).
