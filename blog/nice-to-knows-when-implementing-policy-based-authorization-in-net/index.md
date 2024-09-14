---
title: Nice to knows when implementing policy-based authorization in .NET
slug: nice-to-knows-when-implementing-policy-based-authorization-in-net
description: I assumed to know how policy-based authorization works in .NET, but I was wrong. Let's cover the basics to get a better understanding of how to implement a policy, and what to look out for. I also share some tips and tricks that improve your authorization layer.
date: 2024-08-29
tags: .NET, security, authorization
---

I am writing this post to share my experience after I encountered a couple of unforeseen behaviors while implementing a policy-based authorization layer in .NET.
I hope this post helps you avoid the same "pitfalls", or at least raise some awareness about this topic.

Reflecting back, this was due to my lack of understanding of how policy-based authorization works in .NET.
Instead of getting a deep understanding of the topic, I made some assumptions, which were wrong (don't just assume, but test and verify!).
The [Policy Authorization documentation](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-8.0) does a good job explaining the concepts, and covers most of the scenarios you might encounter. I recommend you read it before writing your own policies so you don't make the same mistakes I did.

Getting this right is critical, as it's the first line of defense against unauthorized access to your application.
What's why it's ranked first on the OWASP TOP 10 list, [A01:2021 – Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
[A01 Broken Access Control](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html#a01-broken-access-control).

## Recap: Policies in ASP.NET

In ASP.NET, policies are used to define requirements that must be met in order to give a user the authorization to access an endpoint.

Within Web API projects you can use policies to guard and protect endpoints from unauthorized users that don't meet the criteria.
Instead of writing the authorization logic in the endpoint itself, you can refactor this into a policy that is reusable across multiple endpoints.
By extracting the authorization logic from the endpoint, you can make your code more clear and keep your endpoints concise.

To register a policy:

1. Add the `AddAuthorization()` middleware;
2. Use the `AddPolicy()` method to define a policy with its requirements;
3. Register the authorization handler(s) to the DI container;
4. Enable the authorization middleware in the application by invoking `UseAuthorization()`;
5. Guard your endpoint with the policy by using `RequireAuthorization()` for Minimal APIs, for controllers use the `[Authorize]` attribute;

```cs{6-17, 19-20, 27-28, 34-35}:Program.cs
var builder = WebApplication.CreateBuilder(args);

// Note: the authentication middleware is needed, but not covered in this post
builder.Services.AddAuthentication(...);

// 1. Add and configure the authorization middleware
builder.Services.AddAuthorization(options =>
{
     // 2. Register one or more policies
    options.AddPolicy("PolicyName", policy => policy.AddRequirements(new PolicyRequirement()));

     // 2. A policy can also be configured using a parameter
    options.AddPolicy("PolicyName", policy => policy.AddRequirements(new PolicyRequirement("value")));

     // 2. A policy can also be configured inline using a lambda expression (for more complex scenarios use policy.RequireAssertion)
    options.AddPolicy("PolicyName", policy => policy.RequireClaim("PersonNumber"));
});

// 3. Register the requirement handler(s) to the DI container
builder.Services.AddSingleton<IAuthorizationHandler, PolicyAuthorizationHandler>();

var app = builder.Build();

// Note: the authentication middleware is needed, but not covered in this post
app.UseAuthentication();

// 4. Enable the authorization middleware
app.UseAuthorization();

app.MapGet("/hello", () =>
{
    return "Hello World!";
})
// 5. Apply the policy to the endpoint
.RequireAuthorization("PolicyName");

app.Run();
```

Create a new class that inherits from  `AuthorizationHandler<TRequirement>`, you will have to implement the `HandleRequirementAsync` method, which's responsibility is evaluating the request against the requirement.

In the `HandleRequirementAsync` method, you can implement the authorization logic and use the passed in `AuthorizationHandlerContext` object to flag the requirement as (un)met.

- Use the `context.Succeed(requirement)` method to indicate that the requirement is met;
- Use the `context.Fail()` method to indicate that the requirement is not met;
- Don't invoke the `context.Fail()` method when the requirement to let another handler evaluate the requirement (more on this later);

```cs:PolicyAuthorizationHandler.cs
public class PolicyAuthorizationHandler : AuthorizationHandler<PolicyRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PolicyRequirement requirement)
     {
        // ... authorization logic comes here

        // To succeed the requirement
        context.Succeed(requirement);

        // To let the authorization flow fail
        context.Fail();

        // Fail the authorization with a given reason
        context.Fail(new AuthorizationFailureReason(this, "You are not authorized to access this resource."));

        return Task.CompletedTask;
    }
}
```

The requirement in this case is a simple class that implements the `IAuthorizationRequirement` interface.
For more complex requirements you can add properties to the requirement class, which can be used to configure the requirement.

```cs:PolicyRequirement.cs
public class PolicyRequirement() : IAuthorizationRequirement { }
```

## Nice to knows

### All policies (handlers) are always evaluated

This was the biggest surprise to me.

I expected that when a requirement is not fulfilled that it would short-circuit the process and stop the evaluation of the other policy handlers.
But, this is not the case.

When multiple policies are applied to an endpoint, all of them are evaluated regardless of the outcome of the previous policies.
The same scenario applies when a requirement is validated by multiple handlers (yes, you can have a requirement that is validated by more than one handler - more on this later).

I was interested in this decision, and it turns out that this is by design as it allows policy handlers to execute side-effects, such as logging. This can be crucial information for auditing purposes.

If your use case is different you can opt out of this behavior and stop the evaluation of the other policies on a first failure. To do so, set the `InvokeHandlersAfterFailure` property to `false` in the `AuthorizationOptions` configuration. This will stop the evaluation of the remaining policies after the first failure.

```cs:Program.cs
builder.Services.AddAuthorization(options =>
{
    options.InvokeHandlersAfterFailure = false;
});
```

Be aware that this only takes place when a policy handler explicitly invokes the `context.Fail()` method.
A handler that does not invoke `context.Succeed()`, and simply returns, is not sufficient to stop the evaluation of the other policies.

See the implementation of [DefaultAuthorizationService](https://github.com/dotnet/aspnetcore/blob/63c492e22b06d4903cb4e7aee037295c71e1ec37/src/Security/Authorization/Core/src/DefaultAuthorizationService.cs#L62) to understand how policies are evaluated.

#### Example

In the following example, the two policies `PolicyName` and `OtherPolicyName` require a different policy requirement, and is implemented by two different handlers.
These handlers are always evaluated regardless of the outcome of the other policy.

:::code-group

```cs [title=Endpoint Authorization]
app.MapGet("/hello", () =>
{
    return "Hello World!";
})
.RequireAuthorization("PolicyName")
.RequireAuthorization("OtherPolicyName");
```

```cs [title=Policy Handler]
public class PolicyAuthorizationHandler : AuthorizationHandler<PolicyRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PolicyRequirement requirement)
    {
        if(condition)
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
```

```cs [title=Other Policy Handler]
public class OtherPolicyAuthorizationHandler : AuthorizationHandler<OtherPolicyRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, OtherPolicyRequirement requirement)
    {
        if(condition)
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
```

:::

### The order of execution is not guaranteed

The order in which the policies are evaluated cannot be guaranteed.
You cannot safely rely on the order of the policies when implementing your authorization logic.

A handler should be implemented as stand alone and should be written in a way that does not depend on the order of the policies.

If for some reason you want to know which policies are still in the pipeline, you can use the `PendingRequirements` property of the `AuthorizationHandlerContext` object.

### Unauthenticated requests are also evaluated by policies

But what happens if the user is not authenticated?

To understand this behavior we first need to know how ASP.NET deals with (un)authenticated requests.
Using the `RequireAuthorization()` method (in Minimal APIs) or the  `Authorize` attribute (in controllers), adds the `DenyAnonymousAuthorizationRequirement` requirement to the authorization pipeline.

With the knowledge that all policies are always evaluated and the insights cannot safely rely on the order of the policies, we can conclude that our policy handlers are also called even when the user is not authenticated.

As a solution, always check if the user is authenticated within your policy handlers.
For some inspiration, take a look at how  `DenyAnonymousAuthorizationRequirement` is [implemented](https://github.com/dotnet/aspnetcore/blob/63c492e22b06d4903cb4e7aee037295c71e1ec37/src/Security/Authorization/Core/src/DenyAnonymousAuthorizationRequirement.cs#L22).

#### Example

In the following example, the endpoint is protected with the default `RequireAuthorization()`, which means that the user must be authenticated.
Additionally, the endpoint is also protected by the policy `PolicyName`, using `RequireAuthorization("PolicyName")`.
The policy handler of `PolicyName` is evaluated regardless if the user is authenticated.

:::code-group

```cs [title=Endpoint Authorization]
app.MapGet("/hello", () =>
{
    return "Hello World!";
})
.RequireAuthorization()
.RequireAuthorization("PolicyName");
```

```cs [title=Policy Handler]
public class PolicyAuthorizationHandler : AuthorizationHandler<PolicyRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PolicyRequirement requirement)
    {
        if(condition)
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
```

:::

### Difference between `FallbackPolicy` and `DefaultPolicy`

While configuring the authorization options, you might have noticed the `FallbackPolicy` and `DefaultPolicy` properties.
While they might sound similar, they have different purposes.

- The `FallbackPolicy` is used when an endpoint does not have any policies applied to it.
- The `DefaultPolicy` sets the default policy for an endpoint that uses the `Authorize` attribute or the `RequireAuthorization()` method, but does not specify any policies.

:::info
For more information about the differences between the two, see the blog post [Globally Require Authenticated Users By Default Using Fallback Policies in ASP.NET Core](https://scottsauber.com/2020/01/20/globally-require-authenticated-users-by-default-using-fallback-policies-in-asp-net-core/) by [Scott Sauber](https://x.com/scottsauber).
:::

### Multiple handlers for the same requirement

We touched on this topic earlier, but it's worth going into more detail.
When multiple handlers that check an identical requirement are registered, these handlers are all executed.

For the requirement to be met, it's sufficient that one of the handlers succeeds.
The same applies when a handler fails, the requirement is not met.

This makes it important to how handlers handle unsuccessful authorization attempts.
I suggest using the `context.Fail()` method in exceptional cases only. Use it only to enforce a strict rule that must be met. In other all other cases simply do not invoke the `context.Succeed()`. This makes it flexible for other handlers to evaluate the requirement.

The example in the [documentation](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-8.0#why-would-i-want-multiple-handlers-for-a-requirement) shows a good example of how to handle multiple handlers for the same requirement.
It uses a building entry system as an example, where the requirement is to have a valid badge to enter the building.
If an employee forgets the badge, she can still enter the building by making use of a temporary badge.

Because the primary handler (verify the badge) does not call the `context.Fail()` method, the secondary handler (temporary badge) can still evaluate the requirement and give the user access to the building.

#### Example

In the example below, the endpoint is protected by a single policy.
However, that policy is implemented by two authorization handlers (handling an identical requirement).
The endpoint is only accessible when one of the policies invokes `context.Succeed()` and the other does not invoke `context.Fail()`.
The endpoint is not accessible in the following scenarios:

- One of the policies invokes `context.Fail()`;
- None of the policies do not invoke `context.Succeed()`;

:::code-group

```cs [title=Endpoint Authorization]
app.MapGet("/hello", () =>
{
    return "Hello World!";
})
.RequireAuthorization("PolicyName");
```

```cs [title=Policy Handler]
public class PolicyAuthorizationHandler : AuthorizationHandler<PolicyRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PolicyRequirement requirement)
    {
        if(condition)
        {
            context.Succeed(requirement);
        }
        else (specialCondition)
        {
            context.Fail();
        }
        return Task.CompletedTask;
    }
}
```

```cs [title=Second Policy Handler]
public class SecondPolicyAuthorizationHandler : AuthorizationHandler<PolicyRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PolicyRequirement requirement)
    {
        if(condition)
        {
            context.Succeed(requirement);
        }
        return Task.CompletedTask;
    }
}
```

:::

### Authorization handler that checks multiple requirements

So far we've only seen authorization handlers that check a single requirement.
For use cases where a handler needs to check multiple requirements, you can create a handler that implements the `IAuthorizationHandler` interface.
Using the context have access to all the pending requirements using `PendingRequirements`, and can evaluate them accordingly.

This can be useful when you want to have some more control over the authorization flow, for example, "OR" logic can easier be implemented.

```cs:AuthorizationPermissionHandler.cs
public class AuthorizationPermissionHandler : IAuthorizationHandler
{
    public Task HandleAsync(AuthorizationHandlerContext context)
    {
        // Use PendingRequirements to access the list of requirements
        foreach (var requirement in context.PendingRequirements)
        {
            switch (requirement)
            {
                case PolicyRequirement:
                case DifferentPolicyRequirement:
                    {
                        if (verifyAccess())
                        {
                            context.Succeed(requirement);
                        }
                        break;
                    }
                case OtherPolicyRequirement:
                    {
                        if (verifyAccessOther())
                        {
                            context.Succeed(requirement);
                        }
                        break;
                    }
            }

            // You can also check the context for the overall status
            // using context.HasFailed and context.HasSucceeded
        }
        return Task.CompletedTask;
    }
}
```

### Resource-based authorization

For the cases when you want to check if the user has access to a specific resource there's the `IAuthorizationService` service.
Instead of marking an endpoint using `RequireAuthorization()` (or the `[Authorize]` attribute), you can manually invoke the authorization flow.

In fact, you can also replace the `RequireAuthorization()` with the `IAuthorizationService` service for the previous examples.
The reworked example injects the `IAuthorizationService` service and invokes the `AuthorizeAsync()` method to check if the user has enough permissions to access the endpoint.

The `AuthorizeAsync` method accepts the user and the policy name as arguments and returns an `AuthorizationResult` object.

```diff
app.MapGet("/hello", async (ClaimsPrincipal user, IAuthorizationService authorizationService) =>
{
+   var authorizationResult = await authorizationService.AuthorizeAsync(user, "DocumentAccess");
+   if(!authorizationResult.Succeeded)
+   {
+       return Results.Forbid();
+   }
 
    return Results.Ok("Hello World!");
});
-.RequireAuthorization("DocumentAccess")
```

This approach doesn't bring much value in this case, but it can be useful when you want to check the authorization of a specific resource.
`AuthorizeAsync` additionally accepts a resource object. This resource object can be used to check if the user has access to that resource.

Why is this useful? This technique can be leveraged to avoid multiple roundtrips to the database.
Instead of retrieving a resource in the policy handler and in the endpoint, you can retrieve the resource in the endpoint and pass it to the policy handler.

```diff
app.MapGet("/hello", async (ClaimsPrincipal user, IAuthorizationService authorizationService, DbContext) =>
{
+   var document = /* retrieve the document */;
+   var authorizationResult = await authorizationService.AuthorizeAsync(user, document, "DocumentAccess");
    if(!authorizationResult.Succeeded)
    {
        return Results.Forbid();
    }
 
    return Results.Ok("Hello World!");
});
```

The authorization handler that is configured to handle the policy can also accept a second parameter, which is the resource object.
In this case, the retrieved document is passed to the handler.

```cs
public class DocumentAuthorizationHandler : AuthorizationHandler<DocumentRequirement, Document>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, DocumentRequirement requirement, Document document)
    {
        if (condition(document))
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
```

Register the handler with the DI container and configure the policy is done the same way as before.

```cs
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DocumentAccess", policy => policy.AddRequirements(new DocumentRequirement()));
});
```

## Conclusion

In this blog post, we went through the basics of policy-based authorization in .NET.
Why it's useful, and how to implement a policy-based authorization layer in your application using requirements (`IAuthorizationRequirement`) and authorization handlers (`AuthorizationHandler`).

The key takeaways when building your own policies are:

- If a policy requirement is not satisfied, the other policies are still evaluated (this also applies when the user is not authenticated)
- Policies are evaluated in an unpredictable order, do not rely on the order of the policies or authorization handlers
- It's possible to write multiple authorization handlers for the same requirement. Here it's sufficient that one of the handlers succeeds for the requirement to be met. Invoke `context.Fail()` in one of the handlers only when you want to enforce a strict rule, in other cases simply do nothing when the requirement is not met (in this scenario a different handler can verify the requirement).
- A single authorization handler (using `IAuthorizationHandler`) can check multiple requirements (can be used to implement an `AND` or `OR` logic) at once.
- For [resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased?view=aspnetcore-8.0) leverage the `IAuthorizationService` service to manually invoke the authorization flow to avoid multiple roundtrips to the database (performance matters!).
