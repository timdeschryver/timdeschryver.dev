---
title: Treat your .NET Minimal API Endpoint as the application layer
slug: treat-your-net-minimal-api-endpoint-as-the-application-layer
description: Leverage the power of Minimal APIs to treat your endpoint as the application layer. This has several benefits, but I find the biggest one being the simplicity of it.
date: 2023-06-14
tags: .NET, architecture
---

In this post, I want to talk about using as few layers as possible to keep your application's structure easy to navigate.

Inspired by [Oskar Dudycz](https://www.linkedin.com/in/oskardudycz/)'s talk "Facts and Myths about CQRS" at Techorama, this blog post is a continuation of a previous post [Maybe it's time to rethink our project structure with .NET 6](../maybe-its-time-to-rethink-our-project-structure-with-dot-net-6/index.md).

## Layering

I've worked on projects that had layers on top of layers, and while it's nice to have a clear separation of concerns, it can also become a pain.
When this becomes the case then working on a new feature means adding multiple files in different projects (and it also involves changes to correctly transform the objects in between the layers).
This makes that a small change looks like a bigger change than it actually is and of course also takes up more time to test and review.

A project that's using many layers can also lead to endless discussions about the correct way of doing this, or where the code should be located.
A discussion doesn't always need to be negative, and I promote healthy discussions, but sadly these discussions can also become repetitive and often involve personal opinions.

I've also seen the opposite with projects which had zero or almost no layers. Here, most of the logic lived within the controller files.
That's also not ideal, because it's hard(er) to test, and you'll end up with large controller files that are hard to understand.
Funny enough, on the other hand, the code is easier to comprehend once you know where to look.

Another issue that may arise with this approach is that it's almost impossible to reuse the business logic of the application.
When it does become necessary to reuse business logic, it requires a lot of attention to not end up with multiple variations of implementations on how to reuse parts of the codebase. Luckily those projects weren't complex enough where this became a problem.

The trick is to end up with the right amount of layers, not too little, and not too many.
Each layer should have a clear intention and purpose.
The goal is to keep it as simple as possible, and we'll apply its philosophy throughout this post.

In this post, we'll take a look at removing the, in my opinion, extra unneeded application layer(s).
This doesn't mean we totally get rid of the application layer, but we'll leverage the C# Minimal Api feature(s) to repurpose a "minimal API endpoint" as the application layer.

## Treat your endpoint as an application layer

The first step of treating your endpoint as an application layer is to chop your endpoints into single files. This is different than the traditional controllers where endpoints are grouped within a controller.

Each file defines its request object, the endpoint, and the response object. This pattern also has a name, The Request Endpoint Response (REPR) Pattern.
My opinion is that this achieves the goal of keeping things simple.

The REPR Pattern plays very nicely with the Command Query Responsibility Segregation (CQRS) pattern, where each request is either a command or a query. The endpoint is responsible for that specific incoming request.

Because an endpoint is its own file (and class and method) we don't have to worry about bloated files. The reason why the application layer became popular was to overcome this problem within controllers. But do we still need the extra layer if the endpoints are only responsible for their own use case?

Instead of walking through each layer (and probably the translation of objects between them), an endpoint orchestrates how the request is handled within its handler and returns a response. If this sounds familiar, that's because it is, and it has the name "Vertical Slice Architecture".

The responsibility of the endpoint as your application layer is similar to your traditional application layer.
The endpoint:

- validates the request
- translates the request to something the domain or core understands
- invokes the business logic
- returns a response

A good thing to keep in mind is that your business logic is not a part of your application layer.
The business logic is extracted out of the application layer into its own separate "layer".

How this separate layer is structured depends on your preferences, you can use a functional approach or a more object-oriented approach.
It's ok to just update the state in a CRUDish way, it can leverage Domain Driven Design (DDD) concepts, it can be driven by commands or events, or it can even be something else.
It can make use of 3rd party libraries, or it can just be a simple method that you invoke.

The most important part is that the business logic is isolated from the rest of the code, and ideally not coupled to a technology.
This makes that the core of the application, the business logic, and its rules, are flexible.

### Benefits

The next advantages are not solely introduced by treating your endpoint as an application layer.
Instead, these are also gained by organizing code into vertical slices that are using a more CQRS-like approach.

You can easily change how an individual business rule is structured.
Depending on the complexity of the domain/feature, the implementation of it can differ to its own needs.
For simple CRUD-based features, the feature can just rely on simple operations.
While for a more complex feature, the feature can be enhanced with principles and patterns.
If needed, an endpoint can also be a one-off implementation for a specific reason, e.g. an optimization for a hot code path.

Code becomes easy to delete and update. You don't have to worry about breaking other parts of the application.

With the business rules extracted and isolated it means that they can be reused in multiple contexts:

- Multiple endpoints can invoke the same business rule;
- A test case can be interpreted as a user that's interacting with your application, and to improve the experience it can interact with business rules directly;

Because there are almost no layers, the code can fit in your head and thus becomes easier to reason about.
The endpoint should make the intention clear so that you don't have to jump around between files to understand what's going on.

With endpoints being single files, it's also easier to navigate through the codebase. You can just search for the action and you'll end up in the right file.

### Testability

Because the business logic is not a part of the technical side of the flow but lives on its own, it becomes easier to write unit tests for it.
Writing tests on an isolated piece of code means that you don't have to worry about all of the other fluff around it, and you can just focus on the functional logic.

With the business logic covered by unit tests, you can have good confidence that things are working as expected.
I don't recommend writing unit tests for the application layer, because it's a thin orchestration layer that doesn't contain any real logic.
These tests almost don't add any value, while taking a longer time to write, because they rely on many mock implementations. Another thing to keep in mind is that these tests are the most brittle and will break the easiest/fastest when refactoring the code. Focus on [integration tests](../how-to-test-your-csharp-web-api/index.md) that test the whole flow instead. These integration tests won't break as easily, and are in my experience also easier to write and maintain while bringing more value.

While the ease of writing unit tests on the business logic is important for complex situations, I also prefer to write integration tests for simple scenarios (e.g. CRUD operations) that test the whole flow.

## Example

Let's take a look at how this all looks in practice.

### Minimal API

With the release of minimal APIs a couple versions ago, we've seen the advantages it brings in [The simplicity of ASP.NET Endpoints](../the-simplicity-of-net-endpoints/index.md).
This is important because an endpoint that's using the minimal API syntax allows us to use an endpoint as an application layer.
The biggest game-changer is that we can easily inject dependencies into an endpoint.
Previously we had the controller's constructor to pass dependencies, or we had to resort to a library like [ApiEndpoints](https://github.com/ardalis/ApiEndpoints). But now, it's just a part of the framework.

This means we can simply inject our services into the endpoint.
In the example below, the `api/activities` endpoint receives a new activity, and has the `FitDbContext` injected within the endpoint's handler.

```csharp{3-7}:RegisterActivity.cs
app.MapPost(
    "/api/activities",
    async (
        Activity activity,
        FitDbContext dbContext,
        CancellationToken cancellationToken
    ) => {
        await dbContext.AddAsync(activity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok();
    });
```

Of course, this is only a very simple example.
Let's see what happens when we add more logic to it.

### Input validation

Because we can't trust the user input, the first step is to validate the incoming request.
This is achieved by creating a new object `RegisterActivity` that acts as a Data Transfer Object (DTO).
This DTO is then translated to a domain entity `Activity`, during this translation the activity is validated.
From there on, the activity can be trusted by the application and is thus persisted.

To keep this short, we focus on the logic within the endpoint and we don't go into details on how the domain entities are implemented.

```csharp{4, 8-12}:RegisterActivity.cs
app.MapPost(
    "/api/activities",
    async (
        RegisterActivity registerActivity,
        FitDbContext dbContext,
        CancellationToken cancellationToken
    ) => {
        var activity = new Activity(
            new UserId(registerActivity.userId),
            registerActivity.Type,
            new TimePeriod(registerActivity.StartTime, registerActivity.EndTime)
        );

        await dbContext.AddAsync(activity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok();
    });
```

While we weren't aware of it, we've already implemented some business logic rules in the previous example.
We made sure that a single activity is compliant with its business rules.
For example, the activity's end time cannot end before the start time.

This is still OK, but let's see what happens when more rules are added that also rely on other entities.

### Domain validation

To disallow cheating, let's make sure that the user can't register an activity that overlaps with another activity.
To implement this case, we need to fetch all activities for the user, and verify that the new activity doesn't overlap with any of the existing activities.

```csharp{14-16, 18-21}:RegisterActivity.cs
app.MapPost(
    "/api/activities",
    async (
        RegisterActivity registerActivity,
        FitDbContext dbContext,
        CancellationToken cancellationToken
    ) => {
        var activity = new Activity(
            new UserId(registerActivity.userId),
            registerActivity.Type,
            new TimePeriod(registerActivity.StartTime, registerActivity.EndTime)
        );

        var userActivities = await dbContext.Set<Activity>()
            .Where(a => a.UserId == activity.UserId)
            .ToListAsync(cancellationToken);

        if(activity.HasOverlap(userActivities))
        {
            return TypedResults.BadRequest("Activity overlaps with another activity");
        }

        await dbContext.AddAsync(activity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok();
    });
```

But, by doing this we're starting to introduce business logic within the endpoint (which acts as the application layer).

This is certainly not ideal as we've discussed before.
It becomes harder to test, and this can become the start of duplicating important business rules in other parts of the application.

So, we need to refactor this so it doesn't become a problem.
As mentioned before, we have several options to do this.

For this example, we'll do this in a DDD fashion (see the example shared in the conclusion for a CQRS-based approach).
The solution below makes of the `User` entity as the root of the aggregate, which contains all of its activities.

```csharp{14-16}:RegisterActivity.cs
app.MapPost(
    "/api/activities",
    async (
        RegisterActivity registerActivity,
        FitDbContext dbContext,
        CancellationToken cancellationToken
    ) => {
        var activity = new Activity(
            new UserId(registerActivity.userId),
            registerActivity.Type,
            new TimePeriod(registerActivity.StartTime, registerActivity.EndTime)
        );

        var user = await dbContext.Set<User>()
            .SingleAsync(u => u.Id == activity.UserId, cancellationToken);
        user.RegisterActivity(activity);

        dbContext.Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok();
    });
```

While it doesn't look like we've changed much in this refactored version, we've moved the logic to the `User` entity, which acts as the root.
What you can't see in the snippet is that the `user.RegisterActivity(activity)` method is responsible to validate the new activity against the existing activities.

### A little note about testing

This is a much better place to put business logic because it now becomes possible to reuse it. The rules are also centralized and we don't need to search for rules across the codebase of the project.

With this approach, we can also easily test the business logic in isolation without having to worry about the database.
In more complex scenarios, this also means that we don't have to worry about other systems.

But what about testing the application layer?
As I've briefly touched on this before, writing unit tests on the other parts is still possible, but it's not something I would recommend of doing. Instead, I would recommend to write integration tests.

### Summary

And that's it, the snippet is now refactored.
We can go further with it and introduce some helpers to retrieve and persist the data, but that's out of scope for this post.

To summarize what we've done in this example.
We've created a `RegisterActivity` class, which's sole purpose is to handle its specific request. First off, it translates (including the validation part) the request to a domain entity, and it then invokes the core business logic.
Then, it persists the can persist the changes to the database.
Lastly, the endpoint returns the result to the user.

In other words, the endpoint is in charge to orchestrate the application flow, which is the task of the application layer.

## Conclusion

In this post, I've shown that a minimal API endpoint can be used as an application layer, and how to implement this.

The benefit of this way of structuring the codebase is the removal of an extra layer within the application.
This allows most of the code to fit in my head, and thus becomes easier to maintain. Because an endpoint is a single file, it also becomes easier to look for specific code.

After seeing both ends of the spectrum, projects that were using an overbload of layers, and projects that put all of the logic within a controller, I've come to the conclusion that both sides have their drawbacks but also their benefits.
Neither of these approaches are ideal, and it's all about finding the right balance, as it's always the case.
For me, I find using an endpoint as the application layer a good balance between the two sides that works well for me.

Instead of having controllers with multiple endpoint methods, where the endpoint is purposely held very tin (it just translates the request and sends it to the application layer). An endpoint is now extracted within its own file.

The endpoint is responsible to orchestrate the flow and invoke the multiple parts of the application in the correct order. To make the best use of it, its structure and flow should be consistent and predictable.
Simply put, this means that an endpoint receives a command or a query, that the request DTO is translated into a model that the core/domain understands, and that the business logic is invoked. For commands, the result can possibly be persisted, and for queries, the result is returned back to the user.

Not to forget! The business logic needs to be extracted and isolated in another location (layer, file, method).
How you extract this is up to your own preference, for example, you can rely on a CQRS-based approach or resort to a more DDD-based approach.

Extracting your business outside of the endpoint has the benefit that it can be reused, and that it can be tested in isolation. The application layer doesn't contain business/functional logic, and that's why I don't see a need to unit test its behavior. Instead, I prefer to write integration tests that cover the whole flow and also the dependencies, e.g. the database.

As an addition you can also take a look at the [FastEndpoints](https://fast-endpoints.com/) library, which plays nicely with the ideas from this post.
The library aims to create performant endpoints with ease, and includes some useful utilities methods to create your endpoints.

To end this post, I also encourage you to take a look at [Oskar Dudycz](https://www.linkedin.com/in/oskardudycz/)'s recorded talk [CQRS is Simpler than you think with C#11 & NET7](https://www.youtube.com/watch?v=iY7LO289qnQ). The talk resonated with me and inspired me to write this post.
You can also find the code in Oskar's example on [GitHub](https://github.com/oskardudycz/cqrs-is-simpler-with-net-and-csharp), which takes a CQRS-based approach.
