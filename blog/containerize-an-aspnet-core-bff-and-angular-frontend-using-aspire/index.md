---
title: Containerize an ASP.NET Core BFF and Angular frontend using Aspire
slug: containerize-an-aspnet-core-bff-and-angular-frontend-using-aspire
description: Using Damien Bowden's secure ASP.NET Core and Angular BFF template as a starting point, this post shows how to integrate Aspire to improve local development and prepare the application for containerized deployment.
date: 2026-04-07
tags: .NET, Angular, Aspire, Docker, BFF
---

In this article, we use the [bff-aspnetcore-angular](https://github.com/damienbod/bff-aspnetcore-angular) template from [Damien Bowden](https://damienbod.com) as a starting point, and integrate Aspire into the project to improve the local development experience and prepare it for containerized deployment.

:::info
For more information about the template, see Damien's article [Implement a secure web application using nx Standalone Angular and an ASP.NET Core server](https://damienbod.com/2023/09/11/implement-a-secure-web-application-using-nx-standalone-angular-and-an-asp-net-core-server/).
:::

The template implements a BFF (Backend For Frontend) architecture. As Damien has said it in his article "The project implements a secure web application using Angular and ASP.NET Core. The web application implements the backend for frontend security architecture (BFF) and deploys both technical stack distributions as one web application. HTTP only secure cookies are used to persist the session. Microsoft Entra ID is used as the identity provider and the token issuer.". Other security features include the use of CSP (Content Security Policy) headers and Anti-Forgery tokens.

The template and the related articles are already a great starting point for building a secure web application using ASP.NET Core and Angular. We recently used it to create a new project, and integrating Aspire improved the development experience. It also gave us a straightforward way to package the application for deployment with Docker.

If you have not looked at the template and the related articles yet, the project consists of an Angular application and an ASP.NET application.
The Angular application is served from the ASP.NET application, and the ASP.NET application acts as a BFF for the Angular application by handling authentication and API requests. While running locally, the ASP.NET application proxies requests to the Angular development server. In production, the Angular application is served as static files from the `wwwroot` folder of the ASP.NET application.

Let's go through the steps.
If you're just interested in containerizing the application, you can directly jump to the [Dockerize the project](#dockerize-the-project) section.

## Integrate Aspire into the project

I followed the same approach described in my [A minimal way to integrate Aspire into your existing project](../a-minimal-way-to-integrate-aspire-into-your-existing-project/index.md) article.

Within the existing solution, create a new Aspire `AppHost` project, which will be used to run both the ASP.NET Server project and the Angular project.
Then, configure the AppHost to serve the ASP.NET Server project and the Angular project.

To serve the Angular project, we can use the `AddJavaScriptApp` method from the `Aspire.Hosting.JavaScript` packages, which first needs to be installed in the AppHost project.

```bash
dotnet add package Aspire.Hosting.JavaScript
```

Then, we can configure the AppHost to serve the ASP.NET and the Angular project by adding the following code to the `AppHost.cs` file.

```cs [file=AppHost/AppHost.cs]
var builder = DistributedApplication.CreateBuilder(args);

var ui = builder
    .AddJavaScriptApp("bff-angular", "../ui", runScriptName: "start")
    // Automatically install npm packages when the application is run
    .WithNpm(installCommand: "install", installArgs: ["--force"])
    // Pass the PORT environment variable to the Angular application
    // Which is used by the Angular development server to determine the port to run on
    .WithHttpEndpoint(env: "PORT");

var server = builder.AddProject<Projects.BffMicrosoftEntraID_Server>("bff-server");
```

Because the Angular project is served from the ASP.NET application, we need to configure the relationship between the two projects. We can do this by adding a reference to the Angular project in the ASP.NET project and configuring the ASP.NET project to serve the Angular application as static files.

```cs [file=AppHost/AppHost.cs] [highlight="9-10"]
var builder = DistributedApplication.CreateBuilder(args);

var ui = builder
    .AddJavaScriptApp("bff-angular", "../ui", runScriptName: "start")
    .WithNpm(installCommand: "install", installArgs: ["--force"])
    .WithHttpEndpoint(env: "PORT");

var server = builder.AddProject<Projects.BffMicrosoftEntraID_Server>("bff-server")
    .WithReference(ui)
    .WaitFor(ui)
    .WithChildRelationship(ui);
```

Creating this relation between the two projects and create an `services__bff-angular__http__0` environment variable that contains the URL of the Angular application, which can be used in the ASP.NET application to configure the static file serving. In the current version this URL is hardcoded.

### ServiceDefaults

You can also create a new `ServiceDefaults` project to configure the standard middleware for all services in one place, for example, to add OpenTelemetry support.
After creating the project, add a reference to the `ServiceDefaults` project in the `Server` project and call the `AddServiceDefaults` method in the `Program.cs` file to apply the default configuration to the server project.

```cs [file=Server/Program.cs] [highlight="2"]
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
```

## Server changes

To reroute the Angular routes to the Angular development server, the template uses [YARP (Yet Another Reverse Proxy)](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview). To know the URL of the Angular development server, the template uses a hardcoded URL in the `appsettings.Development.config` file. This is not ideal, as it can lead to issues when running the project in different environments. By using the environment variable created by the AppHost, we can make the configuration more flexible and avoid hardcoding URLs. The `bff-angular` is the name of the Angular project given in the `AppHost.cs` file.

```diff [appsettings.Development.config]
{
-  "UiDevServerUrl": "https://localhost:4201",
  "ReverseProxy": {
    "Routes": {
        ...
    },
    "Clusters": {
      "cluster1": {
        "HttpClient": {
          "SslProtocols": ["Tls12"]
        },
        "Destinations": {
          "cluster1/destination1": {
-            "Address": "https://localhost:4201/"
+            "Address": "https+http://bff-angular"
          }
        }
      }
    }
}
```

This doesn't work out of the box, because YARP can't resolve the `bff-angular` URL. To make it work, we need to configure YARP to use the environment variable created by the AppHost for the Angular development server URL. This can be done by installing the `Microsoft.Extensions.ServiceDiscovery.Yarp` package in the Server project and configuring YARP to use the environment variable for the Angular development server URL.

```bash
dotnet add package Microsoft.Extensions.ServiceDiscovery.Yarp
```

After the installation, configure YARP to discover destinations using the `AddServiceDiscoveryDestinationResolver()` extension method.

```cs [file=Server/Program.cs] [highlight="9"]
var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();

...

var services = builder.Services;
services.AddReverseProxy()
        .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
        .AddServiceDiscoveryDestinationResolver();
```

To render the Angular application, also update the `_Host.cshtml` file to load the index.html file from the Angular development server in development. Again, this uses the environment variable instead of the `UiDevServerUrl` configuration value that was previously hard coded.

```cs [file=server/Pages/_Host.cshtml] [highlight="14-18"]
@page "/"
@namespace BlazorBffAzureAD.Pages
@using System.Net;
@using NetEscapades.AspNetCore.SecurityHeaders;
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
@addTagHelper *, NetEscapades.AspNetCore.SecurityHeaders.TagHelpers
@inject IHostEnvironment hostEnvironment
@inject IConfiguration config
@inject Microsoft.AspNetCore.Antiforgery.IAntiforgery antiForgery
@{
    Layout = null;

    var source = "";
    if (hostEnvironment.IsDevelopment())
    {
        var httpClient = new HttpClient();
        source = await httpClient.GetStringAsync($"{config["BFF_ANGULAR_HTTPS"] ?? config["BFF_ANGULAR_HTTP"]}/index.html");
    }
    else
    {
        source = System.IO.File.ReadAllText($"{System.IO.Directory.GetCurrentDirectory()}{@"/wwwroot/index.html"}");
    }

    var nonce = HttpContext.GetNonce();

    // The nonce is passed to the client through the HTML to avoid sync issues between tabs
    source = source.Replace("**PLACEHOLDER_NONCE_SERVER**", nonce);

    if (hostEnvironment.IsDevelopment())
    {
        // do nothing in development, Angular > 18.1.0 adds the nonce automatically
        var viteScriptToUpdate = """<script type="module" src="/@vite/client"></script>""";
        source = source.Replace(viteScriptToUpdate, $"""<script type="module" src="/@vite/client" nonce="{nonce}"></script>""");
    }

    // link rel="stylesheet"
    var nonceLinkStyle = $"<link nonce=\"{nonce}\" rel=\"stylesheet";
    source = source.Replace("<link rel=\"stylesheet", nonceLinkStyle);
    source = source.Replace("<link rel=\"modulepreload", nonceLinkStyle);

    var xsrf = antiForgery.GetAndStoreTokens(HttpContext);
    var requestToken = xsrf.RequestToken;

    // The XSRF-Tokens are passed to the client through cookies, since we always want the most up-to-date cookies across all tabs
    Response.Cookies.Append("XSRF-RequestToken", requestToken ?? "", new CookieOptions() { HttpOnly = false, IsEssential = true, Secure = true, SameSite = SameSiteMode.Strict });
}

@Html.Raw(source)
```

## Angular changes

In the original template, the Angular application was built into the wwwroot folder so it's automatically included when the ASP.NET application is deployed.
Because this isn't the default behavior when building an Angular application and it's also not very visible (added to the `angular.json` configuration), I prefer to use Aspire's infrastructure.

Therefore I removed the output path configuration from the `angular.json` file.
Now when the application is built, it reverts back to the default behavior to add the output build into the `dist` folder of the Angular project.

```diff [angular.json]
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "ui": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
-            "outputPath": {
-              "base": "../server/wwwroot",
-              "browser": ""
-            },
            "browser": "src/main.ts",
            "polyfills": [
              "zone.js",
              "@angular/localize/init"
            ],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": [
              "node_modules/bootstrap/dist/css/bootstrap.min.css",
              "src/styles.css"
            ]
          },
        }
    }
  }
}
```

## Dockerize the project

So far, all these changes improve the development experience, but they also make it easy to containerize the application with Docker. By using Aspire's infrastructure, we can build and run the application without having to manually wire the configuration of the individual projects.

First, we need to add the `Aspire.Hosting.Docker` package to the AppHost project, which adds the container publishing capabilities we need.

```bash
dotnet add package Aspire.Hosting.Docker
```

Next, replace the AppHost contents with the following code, which configures the application for container publishing.

```cs [file=AppHost/AppHost.cs] [highlight="3-4, 10, 13-15, 19-25"]
var builder = DistributedApplication.CreateBuilder(args);

var compose = builder.AddDockerComposeEnvironment("compose")
    .WithDashboard(false);

var ui = builder
    .AddJavaScriptApp("bff-angular", "../ui", runScriptName: "start")
    .WithNpm(installCommand: "install", installArgs: ["--force"])
    .WithHttpEndpoint(env: "PORT")
    .WithAnnotation(new ContainerFilesSourceAnnotation() { SourcePath = "/app/dist/ui/browser" });

var server = builder.AddProject<Projects.BffMicrosoftEntraID_Server>("bff-server")
    .WithExternalHttpEndpoints()
    .PublishWithContainerFiles(ui, "./wwwroot")
    .PublishAsDockerComposeService((_, _) => { });

// In publish mode the Angular app is embedded in the server Docker image.
// The dev-time frontend process is only needed when running locally.
if (!builder.ExecutionContext.IsPublishMode)
{
    server
      .WithReference(ui)
      .WaitFor(ui)
      .WithChildRelationship(ui);
}

builder.Build().Run();
```

Here we see some new concepts, let's go through them:

The `AddDockerComposeEnvironment` method creates a new Docker Compose setup that can run multiple services together. When the image is built, we do not want to include the Aspire Dashboard, so we disable it with the `WithDashboard(false)` method.

For the Angular project, we add a `ContainerFilesSourceAnnotation`, which tells Aspire where to find the Angular build output as a source for published container files.

For the ASP.NET project, we use the `PublishWithContainerFiles` method to include output of the Angular application within the ASP.NET application's image. This copies the content (the `dist` folder) from the Angular application to the `wwwroot` folder during publishing.

The `WithExternalHttpEndpoints` method configures the container to expose the HTTP endpoints of the ASP.NET application outside the container. Because the Angular application is served from the ASP.NET application, its content is also exposed through the same HTTP endpoint. If we don't do this, the ASP.NET application will be running in the container, but we won't be able to access it from outside the container.

Finally, we use the `PublishAsDockerComposeService` method to add this project as a service in the Docker Compose setup. This allows us to run the application with Docker Compose.

Resulting in the following `docker-compose.yaml` file being generated after running `aspire publish`:

```yaml
services:
  bff-server:
    image: '${BFF_SERVER_IMAGE}'
    environment:
      OTEL_DOTNET_EXPERIMENTAL_OTLP_RETRY: 'in_memory'
      ASPNETCORE_FORWARDEDHEADERS_ENABLED: 'true'
      HTTP_PORTS: '${BFF_SERVER_PORT}'
    ports:
      - '${BFF_SERVER_PORT}'
    networks:
      - 'aspire'
networks:
  aspire:
    driver: 'bridge'
```

The `publish` commands also generated the `.env` file containing the variables used in the `docker-compose.yaml` file, in this case, the `BFF_SERVER_IMAGE` and `BFF_SERVER_PORT` variables.

```yaml [file=.env]
# Container image name for bff-server
BFF_SERVER_IMAGE=

# Default container port for bff-server
BFF_SERVER_PORT=
```

Note that we don't we only create a reference between the Angular and ASP.NET project in development, but not in publish mode. This is because in publish mode, the Angular application is built and included in the ASP.NET application's image. This is required, otherwise you will receive an error during publishing that the Angular project can't be found, because it's not included in the publish context. Howerver, at the time of writing this post it does seem that this issue is resolved in the latest version of Aspire (13.2.1), so you might be able to include the reference in publish mode as well.

## Next steps

If you want to customize the Docker image further, you can set [image tags](https://aspire.dev/integrations/compute/docker/#configure-image-pull-policy), set up a [container registry](https://aspire.dev/integrations/compute/docker/#configure-a-container-registry), and [integrate it with GitHub Actions](https://aspire.dev/integrations/compute/docker/#github-actions-workflow-example) for automated builds and deployments.

## Conclusion

By integrating the template with Aspire first, we improve the local development experience without changing the core BFF architecture. Service discovery removes hardcoded frontend URLs, and the same setup makes it much easier to package the application for Docker-based deployment. The result is a cleaner development workflow today and a more predictable path to containerized hosting tomorrow.

Using the best practices already set out by Damien's template, this gives us a solid foundation for building secure web applications with ASP.NET Core and Angular, while also leveraging Aspire's capabilities for orchestration and containerization.

You can find the full project on [GitHub](https://github.com/timdeschryver/aspire-bff-aspnetcore-angular), or inspect the [commit](https://github.com/damienbod/bff-aspnetcore-angular/compare/main...timdeschryver:aspire-bff-aspnetcore-angular:main) that turns Damien's original template into an Aspire project with Docker support.
