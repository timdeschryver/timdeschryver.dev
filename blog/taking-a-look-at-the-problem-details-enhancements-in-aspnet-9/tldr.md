The new `StatusCodeSelector` property allows us to quickly adapt the default status code of `500` based on the exception type.

```cs{11-20}:Program.cs
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

Resulting in the following results:

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
