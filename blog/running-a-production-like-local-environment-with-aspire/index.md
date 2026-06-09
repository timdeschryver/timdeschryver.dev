---
title: Running a production-like local environment with Aspire
slug: running-a-production-like-local-environment-with-aspire
description: Prevent integration surprises in production by using Aspire to run local dependencies in a consistent, production-like setup, with Azure Blob Storage and Azurite as a practical example.
date: 2026-05-20
tags: .NET, Aspire, Azure
---

Setting up a local development environment that behaves like production is often harder than it should be.

The application code might run fine locally, but the surrounding services are usually where the differences and problems appear. Databases, queues, caches, storage accounts, mail servers, identity providers and external APIs all have their own setup, configuration and lifecycle.

In many projects, this leads to (small) differences between local development and deployed environments. Those differences are easy to miss while building a feature. They usually become visible later, during testing, deployment or in the worst-case scenario, production environments.

The most common example is probably the database as it's a critical dependency for most applications.
In my early days, a common approach was to use a shared development database for the entire team. That worked, but it also created conflicts. Developers could overwrite each other's data, migrations could get out of sync, and one small schema change could affect everyone else, it could even break the entire environment for everyone. This wasn't ideal, as it was a fragile setup that required constant communication and coordination.
Later, with the popularity of containerization, local database instances became more common. That improved things because you could work in isolation, but it still required manual setup that every developer had to be aware of. You had to remember to run the database container, ensure it was up to date with the latest migrations, and handle any issues that came up with the local instance.

Other dependencies were even more challenging to run locally.
Think about:

- mail systems
- blob storage
- queues
- caching layers
- identity providers
- external HTTP services

Because many of these services were difficult to replicate, we would implement workarounds to run the code.
Some integrations could be disabled, teams relied on mocks and stubs, or used a shared resource (with the same issues as the shared database) to get by. Another possibility could be to update data, e.g. updating email addresses to prevent emails from being sent to real users in non-production environments.

While this works, it lowers the confidence that solutions that work locally also work in production environments.
You are no longer testing the application in a context that behaves close enough to the real one.
That can lead to surprises later on, when the code interacts with the real dependencies and the differences become apparent.

Because these workarounds were often implemented in an ad-hoc way within the application, they also added complexity to the codebase. It could even lead to accidental mistakes causing a big impact if gone wrong, where local environments accidentally hit production integrations, for example during debugging sessions.
Or the other way around, when code running in production is not using the production systems.

## Where Aspire helps

Aspire gives you a way to describe your application and its dependencies from one place: the `AppHost`.

Within the `AppHost`, you define the services your application needs. Aspire can then orchestrate those services for local development and wire the required connection information into the consuming projects.

That does not make your local environment identical to production, but it does make it much easier to run a production-like environment on your machine. It can also help to document the dependencies of your application, and visualize how the different pieces of a system interact with each other.

That distinction matters. A local emulator is still an emulator. A containerized dependency is still not the same as a managed cloud service. But for day-to-day development, it gives you a much better feedback loop than manually configured shared resources or incomplete mocks. This results in more confidence in your code and fewer surprises when you deploy.

Later on, that same application model can be published to a non-local environment, being a staging environment or production environment.

While the aspire team manages many integrations to help you run local integrations, Aspire also provides the flexibility to write your own custom integrations for any service you need. With that flexibility in place, it makes it possible that there is also a growing ecosystem of community integrations (thank you [CommunityToolkit](https://github.com/CommunityToolkit/Aspire)) to run a wide variety of dependencies locally.

Some typical examples:

- Databases: use the SQL Server or PostgreSQL integration to easily set up a local instance of your database with automated migrations, ensuring that you are always working with the latest schema changes.
- Caching: use the Redis integration to set up a local caching layer.
- Azure resources: use the Azure Storage integration to set up local instances using Azurite to emulate Azure Storage services.
- Mailing systems: use the Mailpit integration to set up a SMTP server for testing email functionality without sending emails to external recipients.
- Observability: if you want to use something different than the built-in dashboard, you can use the Elastic Stack or Seq integrations to set up local instances of these popular observability tools.
- Messaging: use the RabbitMQ, Kafka, or Azure Service Bus integrations to set up local instances of these messaging systems for testing and development.
- Identity providers: use the IdentityServer integration with Keycloak or Zitadel.

:::tip

The full list changes rapidly, so the [Aspire integrations documentation](https://aspire.dev/integrations) is the best place to check what is currently available.

:::

## Example: Azure Blob Storage with Azurite

Let's make this more concrete with an integration of Azure Blob Storage as an example.

In this scenario, the application interacts with Azure Blob Storage to store and retrieve files. In production, this connects to the actual Azure Storage account. However, for local development, you want to avoid using shared cloud resources due to the isolation level, and potential costs.

With Aspire, you can model the Azure Storage dependency in the `AppHost` and run it locally through Azurite.

First, add the Azure Storage hosting integration to your AppHost project:

```bash
aspire add azure-storage
```

This will install the `Aspire.Hosting.Azure.Storage` package, which allows Aspire to connect and use the Azure Storage services.

Then define the storage resource in the `AppHost.cs` file:

```cs [file=AppHost.cs] [highlight=3-14, 18-19]
var builder = DistributedApplication.CreateBuilder(args);

var storage = builder
    .AddAzureStorage("storage")
    .RunAsEmulator(azurite =>
    {
        azurite
            .WithLifetime(ContainerLifetime.Persistent)
            .WithDataVolume();
    });
var blobs = storage.AddBlobs("blob-storage");
var filesContainer = storage.AddBlobContainer(
    "app-files",
    blobContainerName: "app-files");

builder
    .AddProject<Projects.Project_Api>("project-api")
    .WithReference(blobs)
    .WaitFor(filesContainer);

builder.Build().Run();
```

This does a few things:

- It defines an Azure Storage resource called `storage`.
- It runs that resource locally through Azurite.
- It adds a blob service resource called `blobs`.
- It adds a specific blob container called `app-files`.
- It references the blob service from the API project, so the API receives the required connection information through Aspire as environment variables.

The `WithLifetime(ContainerLifetime.Persistent)` and `WithDataVolume()` calls are useful during development. They make sure the Azurite container and its data survive across local runs, instead of starting from an empty state every time.

## Consuming Blob Storage from the API

Inside the API project, add the Aspire Azure Blob Storage client integration:

```bash
dotnet add package Aspire.Azure.Storage.Blobs
```

Then register the client in `Program.cs` using the `AddAzureBlobServiceClient` method, specifying the same connection name as defined in the `AppHost`.

```cs [file=Program.cs]
var builder = WebApplication.CreateBuilder(args);

builder.AddAzureBlobServiceClient(connectionName: "blob-storage");

var app = builder.Build();

app.Run();
```

The important part here is the connection name.
The `connectionName` in the API project must match the blob resource name from the AppHost. In this example, that name is `blob-storage`.

Aspire then handles the configuration and interaction with the blob service for you.
The API project does not need to know whether the blob service is backed by Azurite locally or by Azure Storage in another environment.
For consumers of the blob service, it's just a blob client that can be used to interact with the blob storage, regardless of the underlying implementation.

## Switching between local and Azure

For local development, Azurite is usually the right choice.
For deployed environments, you probably want to connect to a real Azure Storage account.

Because we're using Aspire, the configuration is handled in the `AppHost`, without any changes needed in the consumer project(s).
This makes it easy to switch between local and Azure environments because the logic is centralized in one place. You also don't have to worry about environment-specific branching in your application code.

One option is to use `AsExisting` when publishing, so the application connects to an existing Azure Storage account.
Using the `ExecutionContext` allows you to conditionally configure the storage resource based on whether you are in publish mode or not.

```cs [file=AppHost.cs] [highlight=5-20]
var builder = DistributedApplication.CreateBuilder(args);

var storage = builder.AddAzureStorage("storage");

if (builder.ExecutionContext.IsPublishMode)
{
    var existingStorageName = builder.AddParameter("existingStorageName");
    var existingStorageResourceGroup = builder.AddParameter("existingStorageResourceGroup");

    storage.AsExisting(existingStorageName, existingStorageResourceGroup);
}
else
{
    storage.RunAsEmulator(azurite =>
    {
        azurite
            .WithLifetime(ContainerLifetime.Persistent)
            .WithDataVolume();
    });
}

var blobs = storage.AddBlobs("blob-storage");

var filesContainer = storage.AddBlobContainer(
    "app-files",
    blobContainerName: "app-files");

builder
    .AddProject<Projects.Project_Api>("project-api")
    .WithReference(blobs)
    .WaitFor(filesContainer);

builder.Build().Run();
```

## Using a connection string directly

Not all packages and integrations will have built-in support for the `AsExisting` method, or similar methods to connect to existing resources.
For these cases you can provide the connection string to the resource manually.

For demo purposes, this is also a possibility for Azure Storage if you want to use the connection string directly instead of the `AsExisting` method.

Just as before, this logic is still centralized within the `AppHost`.

The difference, is that the connection string is provided directly as an environment variable to the API project when publishing, instead of configuring it through the built-in Azure Storage integration.

```cs [file=AppHost.cs] [6-27]
var builder = DistributedApplication.CreateBuilder(args);

var api = builder
    .AddProject<Projects.Project_Api>("project-api");

if (builder.ExecutionContext.IsPublishMode)
{
    api.WithEnvironment(
        "ConnectionStrings__blob-storage",
        builder.Configuration["ConnectionStrings:blob-storage"]);
}
else
{
    var storage = builder.AddAzureStorage("storage")
        .RunAsEmulator(azurite =>
        {
            azurite
                .WithLifetime(ContainerLifetime.Persistent)
                .WithDataVolume();
        });
    var blobs = storage.AddBlobs("blob-storage");
    var filesContainer = storage.AddBlobContainer(
        "app-files",
        blobContainerName: "app-files");

    api.WithReference(blobs).WaitFor(filesContainer);
}

builder.Build().Run();
```

In this version, the API still uses the same connection name: `blob-storage`.
If you're unsure about the environment variable name that is used, you can look at the Aspire dashboard, or check the documentation of the integration you're using to see how it configures the information for the consuming projects.

## Why this is useful

The main benefit is not that Aspire magically removes all environment differences. You still have to make choices about how close your local environment is to production, and there are always going to be some trade-offs.

The benefit is that Aspire gives you control over those differences and makes it manageable.
Dependencies are centralized and become visible in the application model.

Your local setup becomes consistent and repeatable.
Developers have fewer manual steps and don't have to read extensive documentation files to get up and running.

Your application code doesn't get polluted with environment-specific branching logic for every integration. The application code can just consume the services it needs, and Aspire takes care of providing the right configuration for the environment it's running in.

Using the same application model, you can publish the same application to a non-local environment, but with different configurations for the dependencies. Again, without any code changes needed in the application projects.

With the many integrations available, it's easy to run a wide variety of dependencies locally, which gives you a much better feedback loop during the development process. You also don't need to know and share credentials or connection strings to connect to resources.

This makes the local environment reflect the real environment much better.
This is crucial, as many bugs are not caused by business logic alone. They appear in the interaction between those integrations.

:::tip
During (integration) testing, you can also use the same approach to run tests against a production-like environment, instead of relying on mocks and stubs, you can use [TestContainers](https://testcontainers.org/) to run real instances of the dependencies your application interacts with.
:::

## Conclusion

In my experience, a good local environment gives the entire team confidence, and allows them to move faster without worrying about breaking things for others or running into unexpected issues when deploying.

The local environment should be easy to start, easy to inspect and close enough to production to catch integration issues early.

Aspire helps by letting you model your application and its dependencies in one place. With its many (and growing list of) integrations, it gives you a flexible way to run local instances of your dependencies. Aspire also handles and maintains the integration with those external services, so you don't have to worry about the setup and configuration details.

Because the configuration is centralized in the `AppHost`, you can easily switch between local and production configurations without any code changes needed in your application projects.

That doesn't only make your local development less fragile, it also prevents bad deployments when new integrations are not properly configured.

This all prevents scenarios where "it works on my machine" is a common excuse for bugs that only appear in production, and it gives you confidence that your code works in the real environment as well as it works locally.

In this post we looked at Azure Storage as an example, but the same principles apply to any other dependency you have in your application. Aspire's flexibility and growing ecosystem of integrations make it a powerful tool for managing your local environment and ensuring that it behaves as close to production as possible.
