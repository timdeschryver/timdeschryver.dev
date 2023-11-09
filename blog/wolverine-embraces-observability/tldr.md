```cs{10,17}:Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .WithTracing(configure =>
    {
        configure
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSqlClientInstrumentation()
            .AddSource("Wolverine");
    })
    .WithMetrics(configure =>
    {
        configure
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddMeter($"Wolverine:{ProjectName}");
    });

var app = builder.Build();
```
