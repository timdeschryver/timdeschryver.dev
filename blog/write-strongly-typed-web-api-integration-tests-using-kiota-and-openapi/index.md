---
title: Write strongly typed Web API integration tests using Kiota and OpenAPI
slug: write-strongly-typed-web-api-integration-tests-using-kiota-and-openapi
description: Recently, I discovered Kiota, a tool that generates API clients from OpenAPI specifications, and it has significantly simplified my testing process. In this blog post, I'll share how I use Kiota to create type-safe HTTP clients that are consumed within the integration tests for my ASP.NET Web API endpoints.
date: 2025-10-30
tags: .NET, ASP.NET, Testing, Kiota, OpenAPI
---

I like to write integration tests for my ASP.NET Web API endpoints to ensure that they behave as expected. For most of the APIs I work with, I believe **these tests are crucial for maintaining code quality and reliability**.

## The problem with typical integration tests

An integration test typically hosts the API in a test server and fires (one or more) HTTP requests against it, verifying the responses against expected results.
To invoke the API, you have to manually create an HTTP request, setting the correct route and body for each request.

This practice can be tedious. It's easy to accidentally make a typo in the route, post a wrong model, or simply forget to update the test when the API changes. This can lead to some frustration and wasted time to figure out why the test is failing.

It can also lead to a bad design. To make testing easier, many tests reuse the API models as the request and response bodies. While this is convenient, it can be the cause to make changes to the production code simply to accommodate the tests. An example of this is that it's a good practice to treat the incoming request model as an immutable object, of which its properties cannot be modified. However, this makes it difficult to create test requests, where you might want to have the possibility to modify the request model. The same applies when you're using tools to dynamically create the models, such as [AutoFixture](https://github.com/AutoFixture/AutoFixture), which requires the models to have public setters. On the other hand, we also don't want to manually create separate request and response models just for testing purposes, as this leads to code duplication and maintenance overhead.

### Testcase without client generation

Before diving into the solution, let's first look at a typical integration test without using a generated client.

The test below creates a new customer by sending an HTTP POST request, in the test:

- A customer is created using the constructor of the `CreateCustomer.Command` model, this model exists in the API layer
- An HTTP POST request is sent to the `/customers` endpoint with the customer data in the request body, the route is hardcoded as a string

```cs
[Test]
public async Task CreateCustomer_WithValidData_Returns_CreatedResponse()
{
    using var client = WebAppFactory.CreateClient();

    var createCustomerCommand = new CreateCustomer.Command(
        FirstName: "John",
        LastName: "Doe",
        BillingAddress: new CreateCustomer.BillingAddress(
            Street: "123 Main St",
            City: "Anytown",
            ZipCode: "12345"
        ),
        ShippingAddress: new CreateCustomer.ShippingAddress(
            Street: "456 Oak Ave",
            City: "Somewhere",
            ZipCode: "67890",
            Note: "Leave at door"
        )
    );

    var response = await client.PostAsJsonAsync("/customers", createCustomerCommand);
    await Assert.That(response.StatusCode).IsEqualTo(HttpStatusCode.Created);
}
```

While this works, it has its downsides...
As mentioned before, the test is tightly coupled to the API's internal implementation.

## Why Kiota

To make the code within the test strongly typed, a better approach would be to use a generated API client that mirrors the API's structure and endpoints. This way, you can leverage the benefits of strong typing and avoid hardcoding routes and request structures. There are several tools available to generate API clients from an [OpenAPI specification](https://spec.openapis.org/oas/latest.html), such as [NSwag](https://github.com/RicoSuter/NSwag) and [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview). In this post, I'll focus on Kiota, as I recently discovered it and found it had a better experience compared to other tools.

> Kiota is a command line tool for generating an API client to call any OpenAPI-described API you're interested in. The goal is to eliminate the need to take a dependency on a different API client library for every API that you need to call. Kiota API clients provide a strongly typed experience with all the features you expect from a high quality API SDK, but without having to learn a new library for every HTTP API.

### Using Kiota to generate the client

To get started with Kiota, you first need to install the Kiota CLI tool. You can do this using the following command:

```bash
dotnet tool install --global Kiota
```

Using the `kiota` command, you can generate a client library from an OpenAPI specification:

```bash
kiota generate \
    -l CSharp \
    --namespace-name ApiServiceSDK \
    --class-name ApiClient \
    --openapi ./Sandbox.ApiService/obj/Sandbox.ApiService.json \
    --output ../Sandbox.Modules.CustomerManagement.IntegrationTests/ApiServiceSDK
```

The above command generates a C# client library in the specified output directory, using the provided OpenAPI specification file from the API project.
It's also possible to provide the URL to the API's OpenAPI endpoint instead of a local file path.
Personally, I prefer the local file approach, as it allows me generate the client without needing to run the API first.

### Prerequisite: Generating the OpenAPI specification

To enable OpenAPI support in your ASP.NET Core Web API and generate the OpenAPI specification file, you can use the `Microsoft.AspNetCore.OpenApi` package (this is added by default starting from .NET 9). Next, configure the OpenAPI middleware in your `Program.cs` file as shown in the minimal example below:

```cs [highlight=4,7-10]
using Microsoft.AspNetCore.OpenApi;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();
```

This configuration activates the OpenAPI middleware, which generates the OpenAPI specification file for your API at run-time.
To also generate the OpenAPI specification file during the build process, you must add the `Microsoft.Extensions.ApiDescription.Server` package as well.
I also like to set the [`GenerateDocumentationFile` property](https://learn.microsoft.com/en-us/dotnet/core/project-sdk/msbuild-props#generatedocumentationfile) in your API project's `.csproj` file to include XML comments in the generated OpenAPI specification:

```xml [highlight=2-4]
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <GenerateDocumentationFile>true</GenerateDocumentationFile>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" />
    <PackageReference Include="Microsoft.Extensions.ApiDescription.Server">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>
</Project>
```

Now the specification file is automatically generated during the build process, and is created within the `obj` directory of your project directory (this can be customized using the [`OpenApiDocumentsDirectory` property](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi#modifying-the-output-directory-of-the-generated-open-api-file)). For more information about generating the OpenAPI documents, please take a look at the [official documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi).

For an example of a generated OpenAPI specification document, you can check out the file [Sandbox.ApiService.json](https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.ApiService/documentation/Sandbox.ApiService.json). It contains information about the available endpoints, request and response models, and other relevant details about the API.

### Generated client

With the openAPI specification file in place, you can now generate the API client using Kiota as shown earlier. Once the client is generated, you can use it in your integration tests to interact with the API in a type-safe manner.

Using the OpenAPI specification, Kiota generates classes and methods that correspond to the API's endpoints and models, and adds these to your project.
Because we want to use Kiota for testing, the generated client is added to the integration test project.

The generated client for my sample API can be found at [Sandbox/Sandbox.Modules.CustomerManagement.IntegrationTests
/ApiServiceSDK](https://github.com/timdeschryver/Sandbox/tree/main/Sandbox.Modules.CustomerManagement.IntegrationTests/ApiServiceSDK).

### Testcase with generated client

The refactored integration test using the generated API client looks like this.

```cs [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.Modules.CustomerManagement.IntegrationTests/CustomerApiTests.cs]
[Test]
public async Task CreateCustomer_WithValidData_Returns_CreatedResponse()
{
    var apiClient = WebAppFactory.CreateApiClient();

    var response = await apiClient.Customers.PostAsync(new ApiServiceSDK.Models.Command()
    {
        FirstName = "John",
        LastName = "Doe",
        BillingAddress = new ApiServiceSDK.Models.Command.Command_billingAddress()
        {
            BillingAddress = new ApiServiceSDK.Models.BillingAddress()
            {
                Street = "123 Main St",
                City = "Anytown",
                ZipCode = "12345"
            }
        },
        ShippingAddress = new ApiServiceSDK.Models.Command.Command_shippingAddress()
        {
            ShippingAddress = new ApiServiceSDK.Models.ShippingAddress()
            {
                Street = "456 Oak Ave",
                City = "Somewhere",
                ZipCode = "67890",
                Note = "Leave at door"
            }
        }
    });
}
```

To create the `ApiClient` instance, I added a method to the `WebApplicationFactory` class, which instantiates the client using the `HttpClientRequestAdapter` provided by Kiota.

```cs
public ApiClient CreateApiClient()
{
    var client = CreateClient();
    var authProvider = new AnonymousAuthenticationProvider();
    using var adapter = new HttpClientRequestAdapter(authProvider, httpClient: client);
    return new ApiClient(adapter);
}
```

### Bonus tip

Instead of manually running the Kiota command each time the API changes, you can automate the client generation process by adding a custom MSBuild target to your integration test project's `.csproj` file. This way, the client will be regenerated automatically during the build process.

```xml [highlight=2-7] [source=https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.Modules.CustomerManagement.IntegrationTests/Sandbox.Modules.CustomerManagement.IntegrationTests.csproj]
<Project Sdk="Microsoft.NET.Sdk.Web">
    <Target Name="GenerateClient" AfterTargets="Build"
        Condition="$(Configuration)=='Debug'">
        <Exec
            Command="kiota generate -l CSharp --output ./ApiServiceSDK --namespace-name ApiServiceSDK --class-name ApiClient --openapi ../Sandbox.ApiService/documentation/Sandbox.ApiService.json --clean-output"
            WorkingDirectory="$(ProjectDir)" />
    </Target>
</Project>
```

Keep in mind that if you're building your application within a CI/CD pipeline, you might need to install the Kiota tool in the pipeline environment first.
That's why I added the condition to only run the target in Debug mode, so it only runs during local development.

## Conclusion

Using the OpenAPI specification document to generate a strongly typed API client with Kiota has significantly improved my integration test flows. It eliminates the need for hardcoded routes and allows me to leverage the generated models, allowing me to quickly update models (even while this is prohibited by the production API models). If you're looking for a way to streamline your API testing process. While other tools exists, I highly recommend giving Kiota a try because of its ease of use and the way it creates the API methods.

### Benefits

Using Kiota to generate a strongly typed API client from the OpenAPI specification has several benefits for integration testing:

- **Type safety**: The generated client provides strong typing for API endpoints and models, reducing the risk of runtime errors due to typos or usage of incorrect data types.
- **Maintainability**: When the API changes, you can simply regenerate the client using Kiota, ensuring that your tests are always in sync with the API's specification.
- **Decoupling from production code**: By using the generated client, you can avoid coupling your tests to the internal implementation of the API, allowing for more flexible and isolated testing.

### More than just testing

In this blog post we've seen how Kiota is used for testing purposes, but Kiota can also be used to generate clients for consuming APIs in production code. This can be especially useful when working with third-party APIs that provide OpenAPI specifications. Instead of manually re-creating the client code, you can use Kiota to generate a client that is always in sync with the API's specification. This makes integrating with external APIs much easier and faster to implement.

You can find the complete integration test code in my [Sandbox project](https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.Modules.CustomerManagement.IntegrationTests).

## More resources

- [Introducing project Kiota a client generator for OpenAPI | .NET Conf 2023](https://www.youtube.com/watch?v=sQ9Pv-rQ1s8)
