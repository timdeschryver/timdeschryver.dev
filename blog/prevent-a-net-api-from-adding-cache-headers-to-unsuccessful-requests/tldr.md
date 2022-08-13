## Add the `ResponseCache` attribute to an endpoint (or class) to add the cache headers to the response

```cs{6}:WeatherForecastController.cs
[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
        [HttpGet]
        [ResponseCache(Duration = 60_000)]
        public async Task<StatusCodeResult> Get()
        {
        }
}
```

## Implement cache middleware to remove the cache headers for non-200 response status codes

```cs{10, 14-34}:Startup.cs
public class Startup
{
    public Startup(IConfiguration configuration) { }

    public void ConfigureServices(IServiceCollection services) { }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        ...
        app.Use(RemoveCacheControlHeadersForNon200s());
        ...
    }

    private Func<HttpContext, Func<Task>, Task> RemoveCacheControlHeadersForNon200s()
    {
        return async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.GetTypedHeaders();
                if (context.Response.StatusCode != StatusCodes.Status200OK &&
                    headers.CacheControl?.NoCache == false)
                {
                    headers.CacheControl = new CacheControlHeaderValue
                    {
                        NoCache = true
                    };
                }

                return Task.FromResult(0);
            });
            await next();
        };
    }
}
```
