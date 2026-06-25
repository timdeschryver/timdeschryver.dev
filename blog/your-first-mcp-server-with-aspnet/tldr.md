```cs [name=Program.cs]
var builder = WebApplication.CreateBuilder(args);

builder.Services
    // Adds the Model Context Protocol (MCP) server to the service collection with default options.
    .AddMcpServer()
    // Adds the services necessary for McpEndpointRouteBuilderExtensions.MapMcp to handle MCP requests and sessions using the MCP Streamable HTTP transport.
    .WithHttpTransport()
    // Adds types marked with the ModelContextProtocol.Server.McpServerToolTypeAttribute attribute from the given assembly as tools to the server.
    .WithToolsFromAssembly();

var app = builder.Build();

app.MapMcp("mcp");

app.Run();

[McpServerToolType]
public sealed class CatalogTools
{
    [McpServerTool, Description("Searches products in the catalog by name.")]
    public static async Task<IEnumerable<ProductResult>> SearchProducts(
        [Description("Part of the product name, for example 'smartphone'. If not provided, all products will be returned.")]
        string? query)
    {
        return new[]
        {
            new ProductResult(1, "Keyboard", 10, 99.99m),
            new ProductResult(2, "Mouse", 25, 49.99m),
            new ProductResult(3, "Monitor", 0, 399.99m),
            new ProductResult(4, "Smartphone", 5, 899.99m),
        }.Where(p => query == null || p.Name.Contains(query, StringComparison.OrdinalIgnoreCase));
    }
}

public record ProductResult(int Id, string Name, int Stock, decimal Price);
```
