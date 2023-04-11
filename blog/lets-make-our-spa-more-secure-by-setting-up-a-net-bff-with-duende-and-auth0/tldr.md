## Install Duende.BFF

```bash
dotnet add package Duende.BFF
```

## Configure the BFF

```cs{1, 8-44, 46-48, 61-63, 66-67, 87-88}:Program.cs
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services
    // Configure ASP.NET Authentication
    .AddAuthentication(options =>
    {
        options.DefaultScheme = "Cookies";
        options.DefaultChallengeScheme = "oidc";
        options.DefaultSignOutScheme = "oidc";
    })
    // Configure ASP.NET Cookie Authentication
    .AddCookie("Cookies", options =>
    {
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = false;
        options.Cookie.Name = "__MySPA";
        // When the value is Strict the cookie will only be sent along with "same-site" requests.
        options.Cookie.SameSite = SameSiteMode.Strict;
    })
    // Configure ASP.NET OpenID Connect
    .AddOpenIdConnect("oidc", options =>
    {
        options.Authority = "https://dev-n533ewmrz1oalj0i.us.auth0.com";
        options.ClientId = "pep0IcJQoatmbDJpkMJDLWJCGnJ5ERdw";
        options.ClientSecret = "AUTH0-BASIC-INFORMATION-CLIENTSECRET";

        options.ResponseType = OpenIdConnectResponseType.Code;
        options.ResponseMode = OpenIdConnectResponseMode.Query;

        // Go to user info endpoint to retrieve additional claims after creating an identity from the id_token
        options.GetClaimsFromUserInfoEndpoint = true;
        // Store access and refresh tokens in the authentication cookie
        options.SaveTokens = true;

        options.Scope.Clear();
        options.Scope.Add("openid");
        options.Scope.Add("profile");
        options.Scope.Add("offline_access");
    });

// Register BFF services and configure the BFF middleware
builder.Services.AddBff();
builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
// Use the BFF middleware (must be before UseAuthorization)
app.UseBff();
app.UseAuthorization();

// Adds the BFF management endpoints (/bff/login, /bff/logout, ...)
app.MapBffManagementEndpoints();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/api/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.AsBffApiEndpoint()
.RequireAuthorization()
.WithOpenApi();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
```
