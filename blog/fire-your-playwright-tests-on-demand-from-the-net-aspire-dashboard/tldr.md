You can find the complete code of the example on [GitHub](https://github.com/timdeschryver/sandbox).

```cs{5-7,9-12}:Program.cs
var builder = DistributedApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    var playwright = builder
        .AddNpmApp("playwright", "../Sandbox.EndToEndTests", "test")
        .WithExplicitStart()
        .WithPlaywrightRepeatCommand()
        .WithReference(gateway)
        .WithEnvironment("ASPIRE", "true")
        .ExcludeFromManifest()
        .WithParentRelationship(gateway);
}

builder.Build().Run();
```

```ts{7, 9}:playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    reporter: process.env.CI ? [['github'], ['html'], ['dot']] : process.env['ASPIRE'] ? 'list' : 'html',
    use: {
        baseURL: process.env['services__gateway__http__0'] || process.env.APPLICATION_URL,
    },
});
```
