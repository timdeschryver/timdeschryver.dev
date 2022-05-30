---
title: 'Creating a new C# API: Validate incoming requests'
slug: creating-a-new-csharp-api-validate-incoming-requests
description: Clean validation with MediatR, FluentValidation and the Problem Detail specification
author: Tim Deschryver
date: 2021-01-22
tags: .NET, csharp, architecture, api
banner: ./images/banner.jpg
bannerCredit: Photo by [Davies Designs Studio](https://unsplash.com/@davies_designs) on [Unsplash](https://unsplash.com)
published: true
---

The key to successful long-term software is a good architectural design.
A good design doesn't only allow developers to come in and write new features with ease, but it's also is adaptive to changes without resistance.

This is what [Eric Evans](https://twitter.com/ericevans0) calls a supple design in his book [Domain Driven Design](https://www.domainlanguage.com/):

> To have a project accelerate as development proceeds—rather than get weighed down by its own legacy—demands a design that is a pleasure to work with, inviting to change. A supple design.

A good design focuses on the core of the application, the domain.

Sadly, it's easy to clutter the domain with responsibilities (meaning more code) that don't belong in this layer.
With each addition, it becomes harder to read and understand the core domain.
Equally bad is that each addition makes it harder to move things around in the future.

Therefore, it's important to guard the domain layer against application logic.
One of the culprits is the validation of incoming requests.
To prevent that this logic percolates into the domain level, we want to validate the request before it reaches the domain level.

In this blog post, we'll learn how to extract the validation out of the domain layer.
Before we start, this blog post assumes that the API uses the [command pattern](https://martinfowler.com/bliki/DecoratedCommand.html) to translate incoming requests to commands or queries. All the snippets throughout this blog post are all using the [MediatR](https://github.com/jbogard/MediatR/wiki) package, another popular alternative is [Brighter](https://www.goparamore.io/new-page-1).

The [command pattern](https://martinfowler.com/bliki/DecoratedCommand.html) has the benefit to decouple the core domain logic from the API layer (we don't want thick controllers).
Most of the libraries that implement the [command pattern](https://martinfowler.com/bliki/DecoratedCommand.html), also expose a middleware pipeline that can be hooked into. This is useful because it offers a solution and a centralized location to add application logic that needs to be executed with each dispatched command.

### A MediatR Request

With the new `record` type, [introduced in C# 9](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9#record-types), defining a request becomes a one-liner.

The additional benefit is that an instance is immutable and side-effect free, this makes the command predictable and reliable.

```cs:CustomersCartCommand.cs
record AddProductToCartCommand(Guid CartId, string Sku, int Amount) : MediatR.IRequest;
```

To dispatch the above command, an incoming request is mapped to a command in the controller.

```cs{10-15}:CustomersCartController.cs
[ApiController]
[Route("[controller]")]
public class CustomerCartsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomerCartsController(IMediator mediator)
        => _mediator = mediator;

    [HttpPost("{cartId}")]
    public async Task<IActionResult> AddProductToCart(Guid cartId, [FromBody] CartProduct cartProduct)
    {
        await _mediator.Send(new AddProductToCartCommand(cartId, cartProduct.Sku, cartProduct.Amount));
        return Ok();
    }
}
```

### MediatR Validator Behavior

Instead of validating the `AddProductToCartCommand` command in the controller or worse in the domain that processes this command, we'll make use of the MediatR pipeline.

By using a pipeline behavior, it's possible to execute some logic before or after the command is handled by its handler.
In this case, provides a centralized location where the command is validated before it reaches the handler (the domain).
When the command reaches its handler, we don't have to worry anymore if the command is valid.
It also enforces a standardized resolution on how invalid commands are dealt with.

While this seems like a trivial change, it declutters every handler in the domain layer.

Ideally, we only want to deal with business logic when we're working on the domain.
Removing the validation logic frees up the mind so we can only focus on the business logic without having to read and write the orchestration code.
Because the validation logic is centralized it makes sure that all commands are validated and not a single command slips through the cracks.

In the snippet below, we create a new pipeline behavior `ValidatorPipelineBehavior` to validate the commands.
When a command is sent, the `ValidatorPipelineBehavior` handler receives the command before it reaches the command handler. The `ValidatorPipelineBehavior` validates if that command is valid by invoking the validators corresponding to that type.
Only if the request is valid, the request is allowed to pass to the next handler.
If not, an `InputValidationException` exception is thrown.

We'll look at how we create our validators in [Validation with FluentValidation](#validation-with-fluentvalidation).
For now, it's important to know that when a request is invalid, the validation messages are returned (with a reference to the invalid property). The validation details are added to the exception and will be used later to create the response.

```cs:ValidatorPipelineBehavior.cs
public class ValidatorPipelineBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidatorPipelineBehavior(IEnumerable<IValidator<TRequest>> validators)
      => _validators = validators;

    public Task<TResponse> Handle(TRequest request, CancellationToken cancellationToken, RequestHandlerDelegate<TResponse> next)
    {
        // Invoke the validators
        var failures = _validators
            .Select(validator => validator.Validate(request))
            .SelectMany(result => result.Errors)
            .ToArray();

        if (failures.Length > 0)
        {
            // Map the validation failures and throw an error,
            // this stops the execution of the request
            var errors = failures
                .GroupBy(x => x.PropertyName)
                .ToDictionary(k => k.Key, v => v.Select(x => x.ErrorMessage).ToArray());
            throw new InputValidationException(errors);
        }

        // Invoke the next handler
        // (can be another pipeline behavior or the request handler)
        return next();
    }
}
```

### Validation with FluentValidation

To validate the request, I like to use the [FluentValidation](https://fluentvalidation.net/) library.
With FluentValidation, "rules" are defined per "`IRequest`" record by implementing the `AbstractValidator` abstract class.

The reasons why I like to use FluentValidation are:

- there's a separation between the validation rules from the models
- easy to write and read
- besides the many built-in validators, you can create your own (reusable) custom rules
- it's extensible

```cs:AddProductToCartCommandValidator.cs
public class AddProductToCartCommandValidator : FluentValidation.AbstractValidator<AddProductToCartCommandCommand>
{
    public AddProductToCartCommandValidator()
    {
        RuleFor(x => x.CartId)
            .NotEmpty();

        RuleFor(x => x.Sku)
            .NotEmpty();

        RuleFor(x => x.Amount)
            .GreaterThan(0);
    }
}
```

### Registering MediatR and FluentValidation

Now that we have our validation pipeline behavior and we've also created a validator, we can register them to the DI container.

```cs{5-14}:Program.cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers();

    // Register all Mediatr Handlers
    services.AddMediatR(typeof(Startup));

    // Register custom pipeline behaviors
    services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidatorPipelineBehavior<,>));

    // Register all Fluent Validators
    services
        .AddMvc()
        .AddFluentValidation(s => s.RegisterValidatorsFromAssemblyContaining<Startup>());
}
```

### Problem Details for HTTP APIs

Everything is now ready to make the first request.
When we try it out and send an invalid request, we receive an Internal Server Error (500) response.
This is good, but this doesn't reflect a good experience for the consumers. I'm sure we can do better.

To create a better experience for the consumers, either the user (interface), a colleague-developer (or yourself), or even a 3rd party, an enhanced result will make it clear why a request fails. This practice makes the integration with your API easier, better, and probably also faster.

I had to integrate with 3rd party services that didn't keep this in mind.
This lead to many frustrations on my end and I was happy when the integration was finally over.
I'm sure that the implementation would have been faster, and the end result could have been better when there was given more thought to the response of the failed request. Sadly, most of the integrations with services provide a subpar experience.

Because of this experience, I try my best to help my future-self and another developer by providing a better response. Even better, a standardized response, also known as [Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807).

The .NET framework already provides a class that implements the specifications of a problem detail, [ProblemDetails](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.problemdetails?view=aspnetcore-5.0).
In fact, a .NET API returns a problem detail response for some invalid requests.
For example, when an invalid parameter is used in a route (the word `one` instead of number 1), .NET returns the following response.

```json:result.json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "traceId": "00-6aac4e84d1d4054f92ac1d4334c48902-25e69ea91f518045-00",
  "errors": {
    "id": ["The value 'one' is not valid."]
  }
}
```

### Mapping responses (exceptions) to Problem Details

To implement our problem details, we can overwrite the response with either the [exceptions middleware](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/error-handling?view=aspnetcore-5.0#exception-handler-lambda), or with an [exception filter](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/error-handling?view=aspnetcore-5.0#exception-filters).

In the snippet below, we're using the middleware to retrieve the details of an exception when one is raised in the application.
Based on these exception details, the problem detail object is build up.

All thrown exceptions are caught by the middleware, so you can create specific problem details for each exception.
In the following example, only the `InputValidationException` exception is mapped, the rest of the exceptions are all treated the same.

```cs{3-46}:Program.cs
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var errorFeature = context.Features.Get<IExceptionHandlerFeature>();
            var exception = errorFeature.Error;

            // https://tools.ietf.org/html/rfc7807#section-3.1
            var problemDetails = new ProblemDetails
            {
                Type = $"https://example.com/problem-types/{exception.GetType().Name}",
                Title = "An unexpected error occurred!",
                Detail = "Something went wrong",
                Instance = errorFeature switch
                {
                    ExceptionHandlerFeature e => e.Path,
                    _ => "unknown"
                },
                Status = StatusCodes.Status400BadRequest,
                Extensions =
                {
                    ["trace"] = Activity.Current?.Id ?? context?.TraceIdentifier
                }
            };

            switch (exception)
            {
                case InputValidationException validationException:
                    problemDetails.Status = StatusCodes.Status403Forbidden;
                    problemDetails.Title = "One or more validation errors occurred";
                    problemDetails.Detail = "The request contains invalid parameters. More information can be found in the errors.";
                    problemDetails.Extensions["errors"] = validationException.Errors;
                    break;
            }

            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = problemDetails.Status.Value;
            context.Response.GetTypedHeaders().CacheControl = new CacheControlHeaderValue()
            {
                NoCache = true,
            };
            await JsonSerializer.SerializeAsync(context.Response.Body, problemDetails);
        });
    });

    app.UseHttpsRedirection();
    app.UseRouting();
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```

With the exception handler in place, the following response is returned when the pipeline behavior detects an invalid command.
For example, when the `AddProductToCartCommand` command (see the [MediatR Command](#a-mediatr-request)) is send with a negative amount.

```json:result.json
{
  "type": "https://example.com/problem-types/InputValidationException",
  "title": "One or more validation errors occurred",
  "status": 403,
  "detail": "The request contains invalid parameters. More information can be found in the errors.",
  "instance": "/customercarts",
  "trace": "00-22fde64da9b70a4691e8c536aafb2c49-f90b88a19f1dca47-00",
  "errors": {
    "Amount": ["'Amount' must be greater than '0'."]
  }
}
```

Instead of creating a custom exception handler and mapping the exception to problem details, it's also possible to use the [Hellang.Middleware.ProblemDetails](https://www.nuget.org/packages/Hellang.Middleware.ProblemDetails/) package. The `Hellang.Middleware.ProblemDetails` package makes it easy to map exceptions to problem details, with almost no code.

### Consistent Problem Details

There's one last problem.
The above snippets expect that a MediatR request is created by the application, in the controller's methods.
An API endpoint that contains the command in the body will automatically be validated by the [.NET Model Validator](https://docs.microsoft.com/en-us/aspnet/core/mvc/models/validation?view=aspnetcore-5.0). When the endpoint receives an invalid command, the request isn't handled by our pipeline and exception handling. This means that the default .NET response will be returned, and not our problem details.

For example, the `AddProductToCart` endpoint directly receives an `AddProductToCartCommand` command and just sends that command to the MediatR pipeline.

```cs{10-15}:CustomersCartController.cs
[ApiController]
[Route("[controller]")]
public class CustomerCartsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomerCartsController(IMediator mediator)
        => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> AddProductToCart(AddProductToCartCommand command)
    {
        await _mediator.Send(command);
        return Ok();
    }
}
```

I didn't expect this at first and it took me a while to figure out why this happens and how to make sure the response objects stay consistent. As a possible fix, we can suppress this default behavior so the invalid request will be handled by our pipeline.

```cs{16-18}:Program.cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers();

    // Register all Mediatr Handlers
    services.AddMediatR(typeof(Startup));

    // Register custom pipeline behaviors
    services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidatorPipelineBehavior<,>));

    // Register all Fluent Validators
    services
        .AddMvc()
        .AddFluentValidation(s => s.RegisterValidatorsFromAssemblyContaining<Startup>());

    services.Configure<ApiBehaviorOptions>(options => {
        options.SuppressModelStateInvalidFilter = true;
    });
}
```

But this has a drawback. By suppressing the invalid model filter, invalid primitive types aren't caught any more.
For an endpoint that expects a number but receives a string, the expected primitive type (in this case the number) is assigned to the default value (0 in this case). Turning off the invalid model filter may lead to unexpected bugs due to this. Previously, this action would lead to a bad request (400).

That's why I prefer to throw the `InputValidationException` exception when the endpoint receives a bad input.

```cs{16-21}:Program.cs
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers();

    // Register all Mediatr Handlers
    services.AddMediatR(typeof(Startup));

    // Register custom pipeline behaviors
    services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidatorPipelineBehavior<,>));

    // Register all Fluent Validators
    services
        .AddMvc()
        .AddFluentValidation(s => s.RegisterValidatorsFromAssemblyContaining<Startup>());

    services.Configure<ApiBehaviorOptions>(options => {
        options.InvalidModelStateResponseFactory = context => {
            var problemDetails = new ValidationProblemDetails(context.ModelState);
            throw new InputValidationException(problemDetails.Errors);
        };
    });
}
```

### Conclusion

In this post, we've seen how to centralize the validation logic before a command reaches the domain layer by using a MediatR pipeline behavior. This has the benefit that all of the commands are validated, and when a command reaches its handler (the domain) it will be valid. In other words, the domain will remain clean and simple.

Because there's a clear separation, the developer only has to focus on the task that's in plain sight.
During the development, you'll also notice that unit tests are more focused and easier to write.
In the future, it's also easier to replace the validation layer, if needed.

We've also learned that there's a standardized response to specify errors with [Problem Details](https://tools.ietf.org/html/rfc7807).
By following the specification we don't have to reinvent the wheel and we create a better experience for the APIs consumer.
