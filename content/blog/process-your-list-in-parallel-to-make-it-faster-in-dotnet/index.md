---
title: Process your list in parallel to make it faster in .NET
slug: process-your-list-in-parallel-to-make-it-faster-in-dotnet
description: Lessons learned while refactoring a process to make a migration from one system to another system faster
author: Tim Deschryver
date: 2020-11-02
tags: .NET, C#, performance
banner: ./images/banner.jpg
bannerCredit: Photo by [David Pisnoy](https://unsplash.com/@davidpisnoy) on [Unsplash](https://unsplash.com)
published: true
---

When you have a chore that takes a long time to complete then it's probably going to be faster if you can divide the amount of work.

For example, if you paint a room on your own, this job might take a couple of hours. But with a couple of friends, the same amount of work can be completed in an hour or less, depending on the number of friends that are helping and how hard everyone is working.

The same applies to programming, where these friends are called threads.
When you want to work through a collection faster, a common solution is to divide the work among threads that run concurrently.

In the early days of .NET, spawning new threads was manual work and required some knowledge.
If you take a look at the [thread docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.thread) you can see that it takes some "orchestration code" to manage these threads.

Because we write the code on your own, there's also a probability that this code contains bugs. It even gets more complex when you spawn multiple threads to achieve the best performance.

Luckily, C# hides all of the implementation details for us with the [Task Parallel Library (TPL)](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl) introduced in .NET Framework 4. It's also safe to say that the chance of bugs within this code is far less in comparison with a custom implementation.

> Data parallelism refers to scenarios in which the same operation is performed concurrently (that is, in parallel) on elements in a source collection or array. In data parallel operations, the source collection is partitioned so that multiple threads can operate on different segments concurrently.

In this article, we'll take a look at the different ways to process a collection faster.

### Initial code

For our case, we had 60.000 items that had to be migrated from one system to another system.
It took 30 minutes to process 1.000 items, which makes it 30 hours in total to process all of the items in the collection.

That's a lot of time, especially if you know that it isn't a difficult task to migrate an item.
The simplified version of the initial code looked like this.
A simple iteration over a list, and within the loop, the migration of an item where we:

- retrieve the details of the item
- migrate the item
- save the item into system B

```cs
foreach (var itemId in itemsFromSystemA)
{
    var item = GetItemFromSystemA(itemId);
    var result = MigrateToSystemB(item);
    SaveToSystemB(result);
}
```

When we take a closer look at where we lose time, it was clear that a lot of time was spent waiting.
Waiting while the item is retrieved and waiting on the item to be saved.
The migration in `MigrateToSystemB` is fast and only took a couple of milliseconds.

Normally, I would suggest limiting the amount of I/O to make this process faster.
This can be done when we retrieve and save the items in batch, instead of one-by-one.
For this use case, doing that wasn't an option.

The only way to make this migration faster is to add parallelism to the code.
Instead of migrating item by item in a sequential order, where the following item is migrated after the previous item is migrated, we want to migrate multiple items at the same time. Each migration will have its own thread and that makes it more efficient.

### Parallel

The easiest way to add parallelism to the loop is to use [`Parallel.ForEach`](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/how-to-write-a-simple-parallel-foreach-loop). Internally, the `Parallel.ForEach` method divides the work into multiple tasks, one for each item in the collection.

> The Parallel class provides library-based data parallel replacements for common operations such as for loops, for each loops, and execution of a set of statements.

A [Task](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.task) can be compared to a lightweight thread, with more functionality. For the difference between the two, see [Task Vs Thread differences in C#](http://csharp.net-informations.com/language/task.htm).

To my surprise, the refactored code doesn't look much different from the initial implementation.
With a small change to wrap the iteration within the `Parallel.ForEach` method.

```cs
Parallel.ForEach(itemsFromSystemA, itemId => {
    var item = GetItemFromSystemA(itemId);
    var result = MigrateToSystemB(item);
    SaveToSystemB(result);
});
```

Doing this results that we now process the same list concurrently.
By default, `Parallel.ForEach` tries to use all of the available threads of the machine.
To lower the impact on the system we can use the `MaxDegreeOfParallelism` option. This property limits the number of spawned concurrent tasks so we don't impact the other running processes of the application.

The `MaxDegreeOfParallelism` option can be set to a static value, or we can use the `Environment.ProcessorCount` property to make it dependant on the machine's resources. In the snippet below, we configure the `MaxDegreeOfParallelism` option to use a maximum of 75% resources of the machine.

```cs{3-6}
Parallel.ForEach(
    itemsFromSystemA,
    new ParallelOptions {
        // multiply the count because a processor has 2 cores
        MaxDegreeOfParallelism = Convert.ToInt32(Math.Ceiling((Environment.ProcessorCount * 0.75) * 2.0))
    },
    itemId => {
        var item = GetItemFromSystemA(itemId);
        var result = MigrateToSystemB(item);
        SaveToSystemB(result);
    }
);
```

In our case, this "refactor" resulted that it now only takes 40 seconds to process 1.000 items.
For the whole collection of 60.000 items, it takes 40 minutes.
From 30 hours to 40 minutes with just a few lines of extra code!
Because we're using the number of processors of the machine, it takes 20% longer on my machine compared to the server.

But it doesn't stop here.

### Parallel LINQ (PLINQ)

While the `Parallel` solution works fine for my use case, .NET also has [Parallel LINQ (PLINQ)](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/introduction-to-plinq).

`PLINQ` brings parallelism to the well-known LINQ API.
This ensures that the code remains readable while writing more complex business logic, where you need to order, filter, or transform the data.

If you're already familiar with LINQ, I got good news for you because you'll immediately feel right at home.

> A PLINQ query in many ways resembles a non-parallel LINQ to Objects query. PLINQ queries, just like sequential LINQ queries, operate on any in-memory IEnumerable or IEnumerable&lt;T&gt; data source, and have deferred execution, which means they do not begin executing until the query is enumerated. The primary difference is that PLINQ attempts to make full use of all the processors on the system. It does this by partitioning the data source into segments, and then executing the query on each segment on separate worker threads in parallel on multiple processors. In many cases, parallel execution means that the query runs significantly faster.

To process the collection in a parallel manner, we can use the [`AsParallel()` extension method](https://docs.microsoft.com/en-us/dotnet/api/system.linq.parallelenumerable.asparallel) followed by any of the existing LINQ extension methods. The `Parallel` example rewritten with the `PLINQ` syntax looks like this, where we use the [`ForAll` extension method](https://docs.microsoft.com/en-us/dotnet/api/system.linq.parallelenumerable.forall) to iterate over the items.

```cs{4-8}
itemsFromSystemA
    .AsParallel()
    .WithDegreeOfParallelism(Convert.ToInt32(Math.Ceiling((Environment.ProcessorCount * 0.75) * 2.0)))
    .ForAll(itemId => {
        var item = GetItemFromSystemA(itemId);
        var result = MigrateToSystemB(item);
        SaveToSystemB(result);
    });
```

This can also be rewritten by using more of the LINQ syntax.
For this example, doing this doesn't add much value but it's just to give you the idea.
Each item is handled on a separate thread, sequent tasks for the same item are handled on the same thread.

```cs{4-6}
itemsFromSystemA
    .AsParallel()
    .WithDegreeOfParallelism(Convert.ToInt32(Math.Ceiling((Environment.ProcessorCount * 0.75) * 2.0)))
    .Select(itemId => GetItemFromSystemA(itemId))
    .Select(item => MigrateToSystemB(item))
    .ForAll(itemId => SaveToSystemB(result));
```

Note that we can set the degree of parallelism with the [`WithDegreeOfParallelism` extension method](https://docs.microsoft.com/en-us/dotnet/api/system.linq.parallelenumerable.withdegreeofparallelism).

The performance benefits between the `Parallel` solution and this `PLINQ` solution were the same.

#### Differences between `Parallel` and `PLINQ`

While performance isn't a factor (in most cases) to choose between these two solutions, there are subtle differences between the `PLINQ` and the `Parallel` methods. Both solutions have a right to exist and provide a solution to different problems.

The distinct advantages of both are well-explained in ["When To Use Parallel.ForEach and When to Use PLINQ"](https://devblogs.microsoft.com/pfxteam/when-to-use-parallel-foreach-and-when-to-use-plinq/).

The main differences that I will remember are:

##### The degree of parallelism

- with `Parallel` you set the maximum degree, which means that it's impacted based on the available resources
- with `PLINQ` you set the degree, meaning that that's the actual number of threads that are used

##### The order of execution

- the order in which the tasks are invoked within a `Parallel` iteration is random. In other words, use `Parallel` to execute independent tasks
- if the order is important, use `PLINQ` because the order is preserved

##### Using the result

- `Parallel` doesn't return a result. The output of `Parallel` is [`ParallelLoopResult`](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallelloopresult?view=netcore-3.1), which contains the completion information of the collection (for example if all tasks are completed) but nothing more.
- when you need a return value of the processed stream use `PLINQ`. Because the tasks do run concurrently, we need a way to merge the results of all the tasks to one result object. To specify how the result of each task must be merged back to the output result, use the [merge options](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/merge-options-in-plinq).

##### Break early to stop processing

- `Parallel` provides a way to exit early with [`ParallelLoopState.Stop()`](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallelloopstate.stop) and [`ParallelLoopState.Break()`](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.parallelloopstate.break?view=netcore-3.1). Both prevent more iterations from starting but have the difference that `Stop`, stops the loop immediately while `Break` still runs previous iterations.
- to stop a `PLINQ` iteration, a [CancellationToken](https://docs.microsoft.com/en-us/dotnet/api/system.threading.cancellationtoken) is used but this doesn't guarantee that the following iterations are not started.

### Dataflow (Task Parallel Library)

Besides the `Parallel` and `PLINQ` methods, there's a third library called [Dataflow (Task Parallel Library)](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/dataflow-task-parallel-library). By solving my performance issue, this was the first time I encountered `Dataflow`.

`Dataflow` could be an article on its own and my knowledge of it is very minimal. Based on what I've read these past days, I see `Dataflow` as a library to build ([the blocks](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/dataflow-task-parallel-library#configuring-dataflow--block-behavior)) of a processing pipeline.

> The Task Parallel Library (TPL) provides dataflow components to help increase the robustness of concurrency-enabled applications. These dataflow components are collectively referred to as the TPL Dataflow Library. This dataflow model promotes actor-based programming by providing in-process message passing for coarse-grained dataflow and pipelining tasks. The dataflow components build on the types and scheduling infrastructure of the TPL and integrate with the C#, Visual Basic, and F# language support for asynchronous programming.

To be honest, I over-simplified the initial code snippet, the real use case is using the `async/await` syntax to get and save an item.
Sadly, this syntax doesn't play nice with the `Parallel` nor the `PLINQ` API, but it can be with `Dataflow`.

After doing some research I stumbled upon the post ["Parallel Foreach async in C#"](https://medium.com/@alex.puiu/parallel-foreach-async-in-c-36756f8ebe62), in which the author iterates over an implementation of an async variant of the `Parallel.Foreach` method.

The last implementation in the post uses the latest features of C#, containing the `Dataflow` library to obtain the best result.

Because I like the implementation, and it still remains readable I shamelessly copy-pasted the method into our codebase.

With the `Dataflow` variant, I was able to cut another 3 minutes off of the time to process the whole collection.

```cs
await itemsFromSystemA
    .ParallelForEachAsync(
        async item =>
        {
            var result = await MigrateToSystemB(item);
            await Save(result);
        },
        Convert.ToInt32(Math.Ceiling((Environment.ProcessorCount * 0.75) * 2.0))
    );

public static class AsyncExtensions
{
    public static Task ParallelForEachAsync<T>(this IEnumerable<T> source, Func<T, Task> body, int maxDop = DataflowBlockOptions.Unbounded, TaskScheduler scheduler = null)
    {
        var options = new ExecutionDataflowBlockOptions {
            MaxDegreeOfParallelism = maxDop
        };
        if (scheduler != null)
            options.TaskScheduler = scheduler;

        var block = new ActionBlock<T>(body, options);

        foreach (var item in source)
            block.Post(item);

        block.Complete();
        return block.Completion;
    }
}
```

### Conlusion

The use case that inspired this post was one of the few times where I actually needed to use parallel programming.
It's also the first time that it has such a big impact.

I like how easy .NET makes it to rewrite code that runs sequentially into code that runs in parallel.
Because of it, we can focus on delivering business value without making the code difficult to write and read.

The learning curve isn't steep and it grows with the complexity of the use case:

- use the `Parallel.ForEach` method for the simplest use case, where you just need to perform an action for each item in the collection
- use the `PLINQ` methods when you need to do more, e.g. query the collection or to stream the data
- use the `DataFlow` methods for when you want complete control over the processing pipeline

Does this mean that I'll sprinkle parallel programming all over in the codebase?
No, that's not what I'm recommending because it might even have a negative result, as it comes with its own [potential pitfalls](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/potential-pitfalls-in-data-and-task-parallelism).

I wrote this post to get more familiar with parallel programming and to use it as a reference point in the future.
I only scratched the surface, if you're also interested (like me) in learning more about this topic I can highly recommend these resources, which I used to gain insights during the process of writing this post.

### More Resources

- [Parallelism vs. Concurrency](https://wiki.haskell.org/Parallelism_vs._Concurrency)
- [Patterns for Parallel Programming: Understanding and Applying Parallel Patterns with the .NET Framework 4](https://www.microsoft.com/en-us/download/details.aspx?id=19222)
- [ParallelOptions.MaxDegreeOfParallelism vs PLINQ’s WithDegreeOfParallelism](https://devblogs.microsoft.com/pfxteam/paralleloptions-maxdegreeofparallelism-vs-plinqs-withdegreeofparallelism/)
- [Potential pitfalls with PLINQ](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/potential-pitfalls-with-plinq#prefer-forall-to-foreach-when-it-is-possible)
- [Exiting from Parallel Loops Early](https://devblogs.microsoft.com/pfxteam/exiting-from-parallel-loops-early/)
- [Practical Parallelization in C# with MapReduce, ProducerConsumer and ActorModel](https://www.nimaara.com/practical-parallelization-with-map-reduce-in-c/)
- [Processing Pipelines Series - Concepts](https://jack-vanlightly.com/blog/2018/4/17/processing-pipelines-series-introduction)
- [Data Processing Pipelines with TPL Dataflow in C# .NET Core](https://blog.wedport.co.uk/2020/06/22/data-processing-pipelines-with-tpl-dataflow-in-c-net-core/)
- [Rx.Net](https://github.com/dotnet/reactive)
