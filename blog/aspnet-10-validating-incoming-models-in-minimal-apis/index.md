---
title: 'ASP.NET 10: Validating incoming models in Minimal APIs'
slug: aspnet-10-validating-incoming-models-in-minimal-apis
description: Using data annotations to validate incoming models in ASP.NET 10 Minimal APIs makes it easy to ensure that the model is valid before processing the request.
date: 2025-05-14
tags: .NET, ASP.NET, Minimal APIs, Validation
---

I've been going back and forth on how to validate incoming models.
Over the time this has changed from doing the validation manually and throwing exceptions or building a result object, to using libraries such as [FluentValidation](https://docs.fluentvalidation.net/en/latest/) for this task.

For ASP.NET Controllers there's also the option to use data annotations to [validate](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation) the models, but this was not possible for Minimal APIs.
With the upcoming release of .NET 10 there is a new feature that allows us to use the same data annotations in Minimal APIs.

:::info
This feature available from ASP.NET 10.0.0 Preview 3.
Preview 4 also added support to use the data annotations with record types.
:::

## Differences between Controllers and Minimal APIs

While the validation makes use of the same data annotations as the ASP.NET Controllers, there are a couple of differences between the two approaches.

With Controllers, the validation feature is provided out of the box, but you need to validate the model state manually within the controller endpoint using the `ModelState.IsValid`.

With Minimal APIs, the validation feature is opt-in, and automatically validates the model state for you.
If the model state is invalid, it returns a uniform [ProblemDetails](https://datatracker.ietf.org/doc/html/rfc7807) response with a 400 Bad Request status code.

## How to start using Validation in Minimal APIs

To start using this feature, call the `AddValidation` method to register the validation services to the DI container.

```cs{4}:Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddValidation();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.Run();
```

Additionaly, it's also required to include a `InterceptorsNamespaces` to the project file.

> An interceptor is a method which can declaratively substitute a call to an interceptable method with a call to itself at compile time. This substitution occurs by having the interceptor declare the source locations of the calls that it intercepts. This provides a limited facility to change the semantics of existing code by adding new code to a compilation (e.g. in a source generator).
> https://github.com/dotnet/roslyn/blob/main/docs/features/interceptors.md

```xml{7}:Project.csproj
<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <InterceptorsNamespaces>$(InterceptorsNamespaces);Microsoft.AspNetCore.Http.Validation.Generated</InterceptorsNamespaces>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.0-preview.3.25172.1" />
  </ItemGroup>

</Project>
```

For each discovered model type, the interceptor generates a `ValidatableTypeInfo` containing the validation rules for the corresponding type.
We will take a look at how this looks like later.

It will use this information to validate the model when it is bound to the request.

## Model Validation

With this technique, it's very easy to validate a model.
By adding one (or multiple) of the [built-in](https://learn.microsoft.com/en-us/dotnet/api/system.componentmodel.dataannotations) data attributes to the model properties, the validation is automatically applied.

As an example, let's take a look at the model below, which is used to create a new customer.
The command receives the first and last name of the customer, and optionally a billing and shipping address.

```cs:Program.cs
public sealed record Command(
    [Required, MinLength(2)] string FirstName,
    [Required, MinLength(2)] string LastName,
    BillingAddress? BillingAddress,
    ShippingAddress? ShippingAddress);
public sealed record BillingAddress(
    [Required, MinLength(2)] string Street,
    [Required, MinLength(2)] string City,
    [Required, Length(2, 10)] string ZipCode);
public sealed record ShippingAddress(
    [Required, MinLength(2)] string Street,
    [Required, MinLength(2)] string City,
    [Required, Length(2, 10)] string ZipCode,
    string? Note);
```

The required attribute is used to indicate that the property is required, and the `MinLength` attribute is used to specify the minimum length of the string.
This way we can ensure that the model is valid before it reaches the endpoint, and before we process the request.

### Generated code

An extract of generated code for the `Command` model includes the definition of the defined types, which are later used for the validation.

:::info
If you want to see the complete generated code, you persist the generated code files to your disk by adding `EmitCompilerGeneratedFiles` to the project file, or by adding it to your build command.
For a detailed explanation, check out [Andrew Lock](https://x.com/andrewlocknet)'s blog post: [Saving source generator output in source control](https://andrewlock.net/creating-a-source-generator-part-6-saving-source-generator-output-in-source-control/).
:::

```cs
private ValidatableTypeInfo CreateCommand()
{
    return new GeneratedValidatableTypeInfo(
        type: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.Command),
        members: [
            new GeneratedValidatablePropertyInfo(
                containingType: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.Command),
                propertyType: typeof(string),
                name: "FirstName",
                displayName: "FirstName"
            ),
            new GeneratedValidatablePropertyInfo(
                containingType: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.Command),
                propertyType: typeof(string),
                name: "LastName",
                displayName: "LastName"
            ),
            new GeneratedValidatablePropertyInfo(
                containingType: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.Command),
                propertyType: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.BillingAddress),
                name: "BillingAddress",
                displayName: "BillingAddress"
            ),
            new GeneratedValidatablePropertyInfo(
                containingType: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.Command),
                propertyType: typeof(global::Sandbox.Modules.CustomerManagement.Application.CreateCustomer.ShippingAddress),
                name: "ShippingAddress",
                displayName: "ShippingAddress"
            ),
        ]
    );
}
```

The validation uses this information to look up the validation attributes for each property.

### Problem Details response

When the model is invalid, the validation will return a `ProblemDetails` containing a detailed collection error messages per property.

```json
{
	"title": "One or more validation errors occurred.",
	"errors": {
		"FirstName": [
			"The field FirstName must be a string or array type with a minimum length of '2'."
		],
		"ShippingAddress.ZipCode": ["The ZipCode field is required."]
	}
}
```

## Summary

In this blog post, we've seen how to use validation attributes to validate incoming models.
While this feature was already available for ASP.NET Controllers, it an upcoming feature in ASP.NET 10, which adds support for this feature with Minimal APIs.

By enabling this feature (calling `Services.AddValidation()`), the models are automatically validated when they are bound to the request. If the model is invalid, a `ProblemDetails` response is returned, containing the the error details. This makes it efficient for your frontend to display the errors to the user.

Personally, I like this approach because it makes it easy to validate the models without having to write a lot of boilerplate code without having to use a third-party library. I also like the fact that the validation logic is close to the model, which makes it easier to understand and maintain. Of course, this is only viable for simple validation scenarios. For more complex validation, I prefer to have this logic in my application.

The attributes can be used on the form body, and also on route parameters, query parameters, and headers.
While this blog post only demonstrated the basic usage of the validation attributes, there are more advanced options available, such as creating your own [custom validation attributes](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation#custom-attributes), and changing the [error message](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation#error-messages).

For the source code, see my [Sandbox](https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.Modules.CustomerManagement/Application/CreateCustomer.cs) repository.
