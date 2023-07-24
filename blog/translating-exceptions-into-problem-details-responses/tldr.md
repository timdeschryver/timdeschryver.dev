## Configuration

```cs{2-9, 12-13}:Program.cs
var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddProblemDetails(options =>
        options.CustomizeProblemDetails = ctx =>
        {
            ctx.ProblemDetails.Extensions.Add("trace-id", ctx.HttpContext.TraceIdentifier);
            ctx.ProblemDetails.Extensions.Add("instance", $"{ctx.HttpContext.Request.Method} {ctx.HttpContext.Request.Path}");
        });
builder.Services.AddExceptionHandler<ExceptionToProblemDetailsHandler>();

var app = builder.Build();
app.UseStatusCodePages();
app.UseExceptionHandler();

app.Run();
```

```csharp:ExceptionToProblemDetailsHandler.cs
public class ExceptionToProblemDetailsHandler : Microsoft.AspNetCore.Diagnostics.IExceptionHandler
{
    private readonly IProblemDetailsService _problemDetailsService;

    public ExceptionToProblemDetailsHandler(IProblemDetailsService problemDetailsService)
    {
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        httpContext.Response.StatusCode = (int)HttpStatusCode.BadRequest;
        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails =
                {
                    Title = "An error occurred",
                    Detail = exception.Message,
                    Type = exception.GetType().Name,
                },
            Exception = exception
        });
    }
}
```

## Response

```txt:response
HTTP/1.1 400 Bad Request
Connection: close
Content-Type: application/problem+json
Date: Mon, 24 Jul 2023 17:08:52 GMT
Server: Kestrel
Alt-Svc: h3=":5099"; ma=86400
Cache-Control: no-cache,no-store
Expires: -1
Pragma: no-cache
Transfer-Encoding: chunked

{
  "type": "ArgumentException",
  "title": "An error occurred",
  "status": 400,
  "detail": "Id must be greater than zero (Parameter 'id')",
  "trace-id": "0HMSCD2K3EJLN:00000001",
  "instance": "GET /users/-5"
}
```
