To render the OpenAPI document in ASP.NET 9, see the following examples using Swashbuckle (Swagger UI and ReDoc), NSwag (Swagger UI and ReDoc), and Scalar.

````csharp
```cs{3-4,10-11,13-18,20-27,29-34,36-43,45-47}:Program.cs
var builder = WebApplication.CreateBuilder(args);

// Generate OpenAPI document
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // Register an endpoint to access the OpenAPI document
    app.MapOpenApi();

    // Render the OpenAPI document using Swagger UI
    // Available at https://localhost:{port}/swagger
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "OpenAPI V1");
    });

    // Render the OpenAPI document using NSwag's Swagger UI
    // Available at https://localhost:{port}/nswag-swagger
    app.UseSwaggerUi(options =>
    {
        options.DocumentPath = "/openapi/v1.json";
        // Update the path to not conflict with the Swashbuckle's version of Swagger UI
        options.Path = "/nswag-swagger";
    });

    // Render the OpenAPI document using Redoc
    // Available at https://localhost:{port}/api-docs
    app.UseReDoc(options =>
    {
        options.SpecUrl("/openapi/v1.json");
    });

    // Render the OpenAPI document using NSwag's version of Redoc
    // Available at https://localhost:{port}/swagger
    app.UseReDoc(options =>
    {
        options.DocumentPath = "/openapi/v1.json";
        // Update the path to not conflict with the Swagger UI
        options.Path = "/nswag-redoc";
    });

    // Render the OpenAPI document using Scalar
    // Available at https://localhost:{port}/scalar/v1
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.Run();
````
