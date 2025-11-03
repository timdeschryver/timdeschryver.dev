---
title: Taking a look at the Problem Details enhancements in ASP.NET 9
slug: taking-a-look-at-the-problem-details-enhancements-in-aspnet-9
description: How to make use of the new StatusCodeSelector property to change the default HTTP response status code (500) of a Problem Details response, based on the thrown exception.
date: 2024-09-26
tags: .NET, ASP.NET, Problem Details
---

## Problem Details in ASP.NET

Last year, I wrote about the new `IExceptionHandler` middleware introduced in ASP.NET 8.
In the post [Translating Exceptions into Problem Details Responses](../translating-exceptions-into-problem-details-responses/index.md), I showed how to leverage the middleware to turn exceptions into Problem Details responses.

In ASP.NET 9, the exception handler middleware has been enhanced to provide more flexibility and control over the response status code when using Problem Details.

To recap, Problem Details is becoming a standardized way ([RFC](https://tools.ietf.org/html/rfc7807)) to represent error information within the response of an HTTP API.
The definition given to a "problem detail" in the RFC goes as follows, to carry machine-readable details of errors in HTTP response content to avoid the need to define new error response formats for HTTP APIs.

ASP.NET already supports Problem Details, but you have to opt into it.
This can quickly be done by registering the Problem Details middleware within the request pipeline with 2 lines of code, and an additional line to also handle thrown exceptions during the execution of the endpoint.

```cs{3-4, 8-10, 12-13}:Program.cs
var builder = WebApplication.CreateBuilder(args);

// Use the Problem Details format for (empty) non-successful responses
builder.Services.AddProblemDetails();

var app = builder.Build();

// Return the body of the response when the status code is not successful
// The default behavior is to return an empty body with a Status Code
app.UseStatusCodePages();

// Translate exceptions into Problem Details responses
app.UseExceptionHandler();

app.Run();
```

Using `AddProblemDetails` in combination with `UseStatusCodePages` is enough to start returning Problem Details responses for endpoints that return an empty non-successful response (e.g. a `BadRequest`).
Keep in mind that if the endpoint returns a non-successful response with a body, the provided body will be used instead (see [examples](#examples)).

But, as you can see in the above example, the `UseExceptionHandler` method is also included.
This will translate exceptions, which are thrown during the execution of the endpoint, into response bodies that are compliant with the Problem Details format.
Otherwise, when the exception middleware is not included, the API will simply return a generic `500` response without a body.

Using the setup shown in the snippet, the following response is returned when an endpoint throws an exception.

```json
{
	"type": "https://tools.ietf.org/html/rfc9110#section-15.6.1",
	"title": "An error occurred while processing your request.",
	"status": 500,
	"traceId": "00-f942c075462cb925f9f1820ce659036a-9a6b9ad75bfcbf22-00"
}
```

This shows the standard behavior.

In [Translating Exceptions into Problem Details Responses](../translating-exceptions-into-problem-details-responses/index.md) I've demonstrated how to customize the Problem Details by implementing an exception handler the `IExceptionHandler` interface.
This allowed us to provide more information to the caller using the information of an exception, include extra information using [extension members](https://www.rfc-editor.org/rfc/rfc9457.html#name-extension-members), and to change the default `500` status code of the response.

## New: `StatusCodeSelector`

With the new addition in ASP.NET 9, we can simplify this by using the [new `StatusCodeSelector` configuration property](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-9.0?view=aspnetcore-8.0#exceptionhandlermiddleware-option-to-choose-the-status-code-based-on-the-exception-type).
This addition makes a custom implementation of an exception handler almost unnecessary (for most cases). You could use this for more complex scenarios, or to log the exception. For the latter, you should really be using [OpenTelemetry](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel) instead.

Using the `StatusCodeSelector` is very handy to quickly change the default status code of `500` based on the exception.
In the following example, the status code is decided based on the exception's type:

```cs{11-21}:Program.cs
var builder = WebApplication.CreateBuilder(args);

// Use the Problem Details format for (empty) non-successful responses
builder.Services.AddProblemDetails();

var app = builder.Build();

// Return the body of the response when the status code is not successful
// The default behavior is to return an empty body with a Status Code
app.UseStatusCodePages();

// Translate exceptions into Problem Details responses
app.UseExceptionHandler(new ExceptionHandlerOptions
{
    StatusCodeSelector = ex => ex switch {
        UserNotFoundException => StatusCodes.Status401Unauthorized,
        UserNotAllowedException => StatusCodes.Status403Forbidden,
        NotImplementedException => StatusCodes.Status501NotImplemented,
        _ => StatusCodes.Status500InternalServerError
 }
});

app.Run();
```

Resulting in the following result when a `UserNotFoundException` exception is thrown by the application.

```json
{
	"type": "https://tools.ietf.org/html/rfc9110#section-15.6.4",
	"title": "Forbidden",
	"status": 403,
	"traceId": "00-b4ebf0c4441b89a97c19d29a73143f69-a4206ff751845f03-00"
}
```

### Using the `StatusCodeSelector` in combination with an Exception Handler

When you decide to implement a custom exception handler, you can still use the `StatusCodeSelector` property to set the status code.
Important to know is that if the `StatusCode` is set by the exception handler, the `StatusCodeSelector` is ignored.

## Conclusion

In this post, we've seen how the new `StatusCodeSelector` property allows us to quickly adapt the default status code of `500` based on the exception type.
Because the `StatusCodeSelector` retrieves the exception, other properties of the exception can also be used to determine the status code.

### Examples

Let's take a look at examples of different ASP.NET endpoints, and how they translate into Problem Details responses.

:::code-group

```cs [title=Endpoint: BadRequest]
app.MapGet("/bad-request", () =>
{
    return TypedResults.BadRequest();
});
```

```json{3-4} [title=Response output]
{
    "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
    "title": "Bad Request",
    "status": 400,
    "traceId": "00-b4d58671c287d817ff262705a2f1c0ed-9e22ef7560a1830b-00"
}
```

:::

:::code-group

```cs [title=Endpoint: BadRequest with body]
app.MapGet("/bad-request-with-body", () =>
{
    return TypedResults.BadRequest("This is a bad request!");
});
```

```json [title=Response output]
"This is a bad request!"
```

:::

:::code-group

```cs [title=Endpoint: Exception]
app.MapGet("/exception", () =>
{
    throw new Exception("Oops... something went wrong.");
});
```

```json{3-4} [title=Response output]
{
    "type": "https://tools.ietf.org/html/rfc9110#section-15.6.1",
    "title": "An error occurred while processing your request.",
    "status": 500,
    "traceId": "00-b164eec4c3a8ba798177734748d449f9-54b8156b91be6c12-00"
}
```

:::

:::code-group

```cs [title=Endpoint: UserNotFound Exception]
app.MapGet("/user-not-found-exception", () =>
{
    throw new UserNotFoundException();
});
```

```json{3-4} [title=Response output]
{
    "type": "https://tools.ietf.org/html/rfc9110#section-15.5.2",
    "title": "Unauthorized",
    "status": 401,
    "traceId": "00-7a4f20d30f537456ac2473eca10a8f79-de5efbdbbb424755-00"
}
```

:::

The code samples shown in this post can be found at my [Sandbox Project](https://github.com/timdeschryver/Sandbox/blob/main/Sandbox.ApiService/Extensions.cs#L7).
