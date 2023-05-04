---
title: Prevent a Hangfire job from running when it is already active
slug: prevent-a-hangfire-job-from-running-when-it-is-already-active
description: Concurrency in recurrent jobs can cause race condition issues. However, we can prevent such problems by queuing new jobs when the same job is still pending. This approach helps to manage the job execution and avoids issues that may arise when multiple instances of the same job are active at the same time. In this post we'll see how we can ensure that only one instance of the job is running at any given time, thus preventing conflicts and ensuring a reliable job execution.
date: 2023-05-03
tags: .NET, Hangfire
---

I'm writing this blog post about Hangfire as a reminder for my future myself because I keep forgetting the syntax to do this, and perhaps this can help you as well.
To give a small version of what [Hangfire](https://www.hangfire.io/) is and does to those who are not familiar with it, it's a NET library that allows you to easily run background (fire and forget) jobs, delayed jobs, and recurring jobs.

> An easy way to perform background processing in .NET and .NET Core applications. No Windows Service or separate process required. Backed by persistent storage.

What I really enjoy about Hangfire is that it also comes with a useful [dashboard](https://docs.hangfire.io/en/latest/configuration/using-dashboard.html) to make the jobs visual, and you also get a screen with the failed jobs with a retry functionality.

I particularly use Hangfire for its recurring background job capabilities, which is a job that uses a [CRON expression](https://en.wikipedia.org/wiki/Cron) to run some logic on a regular interval.
It's also about this that I want to write a small reminder.
My use case is that I have a recurring job that runs frequently and I want to prevent it from running if its previous job is still active.
Ideally, the job runs as soon as possible. Using Hangfire the lowest interval is every minute, which can be configured using the [\* \* \* \* \*](https://crontab.guru/#*_*_*_*_*) (at every minute) CRON expression .

In 90% of the cases that doesn't become a problem because the recurring job normally takes a few seconds, and thus finishes on time before the new job is due.
But due to circumstances, a higher amount of work, a slower network, or other hiccups, the job can take longer than a minute, and thus a new job is queued up before the previous one finishes. This can all lead to issues.

To prevent Hangfire from running a new job while the previous one is still running, you can use the [DisableConcurrentExecution](https://docs.hangfire.io/en/latest/background-methods/performing-recurrent-tasks.html#disabling-concurrent-execution) attribute. This attribute queues up the next job but doesn't run it until the previous one is finished.

To use it, add the `DisableConcurrentExecution` attribute on top of the method that is invoked by Hangfire.
The attribute also accepts a parameter that configures the duration until a timeout is thrown.

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
