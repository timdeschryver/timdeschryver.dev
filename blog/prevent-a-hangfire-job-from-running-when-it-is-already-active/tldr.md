```cs{11-16, 24}:Program.cs
using Hangfire;

var builder = WebApplication.CreateBuilder(args);
builder.Services
    .AddHangfire(x => x.UseSqlServerStorage("..."))
    .AddHangfireServer();

var app = builder.Build();
app.UseHangfireDashboard();

// Register the recurring job
RecurringJob.AddOrUpdate<ImportStateChanges>(
    "Import state changes",
    (job) => job.Run(),
    Cron.Minutely()
);

app.Run();


// Job implementation
internal class ImportStateChanges
{
    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    public Task Run()
    {
        // Job implementation comes here
    }
}
```
