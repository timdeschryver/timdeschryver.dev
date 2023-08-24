## Feature Filter

```cs:FeatureFilter.cs
public abstract class FeatureFilter : IEndpointFilter
{
    protected abstract string FeatureFlag { get; }

    private readonly IFeatureManager _featureManager;

    protected FeatureFilter(IFeatureManager featureManager)
    {
        _featureManager = featureManager;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var isEnabled = await _featureManager.IsEnabledAsync(FeatureFlag);
        if (!isEnabled)
        {
            return TypedResults.NotFound();
        }

        return await next(context);
    }
}
```

## Feature Filter Implementation

```cs:WeatherforecastFeatureFilter.cs
public class WeatherforecastFeatureFilter : FeatureFilter
{
    protected override string FeatureFlag => "WeatherforecastFeature";

    public WeatherforecastFeatureFilter(IFeatureManager featureManager) : base(featureManager)
    {
    }
}
```

## Registering the Feature Endpoint Filter

```cs:Program.cs{20}
var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddFeatureManagement(builder.Configuration.GetSection("FeatureFlags"));

var app = builder.Build();

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateTime.Now.AddDays(index),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return TypedResults.Ok(forecast);
})
.AddEndpointFilter<WeatherforecastFeatureFilter>();

app.Run();
```
