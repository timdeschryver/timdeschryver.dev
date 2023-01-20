---
title: Assertion Scopes, the one FluentAssertions feature you didn't know you needed
slug: assertion-scopes-the-one-fluentassertions-feature-you-didnt-know-you-needed
description: A simple trick to increase your productivity and testing experience.
date: 2022-11-15
tags: .NET, testing
---

Hi, let me quickly tell you about a useful feature of [FluentAssertions](https://fluentassertions.com) that many of us don't know exists.
The feature is called Assertion Scopes, and it helps you to faster understand why a test fails.

If you have never heard of FluentAssertions, it's a library that, as the name entails, lets you write test assertions with a fluent API instead of using the methods that are available on `Assert`.
The library is test runner agnostic, meaning that it can be used with MSTest, XUnit, NUnit, and others.
I find that FluentAssertions improves the readability of the test assertions, and thus I can encourage you to take a look at it if you haven't already.

Now, let's get back to the point of this blog post, Assertion Scopes.

I've seen many tests that often don't test a single outcome.
Instead, a test case consists of multiple multiple assertions.
These assertions usually follow each other to test the expected outcome in its entirety.

To give a simple example, let's take a look at the following tests.
The test creates a new person and verifies if the first name and the last name have the correct value.

```cs{12-13}:Tests.ts
using FluentAssertions;

namespace DemoTests;

public class Tests
{
    [Test]
    public void Test1()
    {
        var person = new Person { FirstName = "Elaine" , LastName = "Benes"};

        person.FirstName.Should().Be("elaine");
        person.LastName.Should().Be("benes");
    }

    class Person
    {
        public required string FirstName { get; init; }
        public required string LastName { get; init; }
    }
}
```

Of course, this test fails because the expected names are not correct.
Resulting in the next error message.

```txt{2}
Error Message:
    Expected person.FirstName to be "elaine", but "Elaine" differs near "Elaine" (index 0).
Stack Trace:
    ...
```

As we can see, the output only shows the first error message.
In a real scenario, the next step is to fix the first assertion and then to run the test again.

This results that the test is failing for a second time, but instead of the first error message, we now get the second message.

```txt{2}
Error Message:
    Expected person.Name to be "benes", but "Benes" differs near "Bennes" (index 0).
Stack Trace:
    ...
```

If you ask me, this isn't very productive.

We have to rerun the failing test(s) multiple times to get the full picture.
To get to a green test, we have to work our way through the invalid messages.

This isn't a problem for this simple test case.
But when tests are taken a little bit longer to run, e.g. integration tests (and I'm a big fan of [integration tests](/blog/why-writing-integration-tests-on-a-csharp-api-is-a-productivity-booster)), it can become unpleasant to work with.

Luckily there's a solution for this.

When I asked others' opinions on how they read the above snippet, most of the answers I received were among the lines that the test verifies if the first name is correct and if the last name is correct.
This mindset is where I think the problem lies.
Instead of thinking in single independent assertions (tests) cases within a test case, the better way to look at it would be to say "The test case verifies if the person is created correctly".

We could rewrite the assertion to use another method from FluentAssertions (for example [BeEquivalentTo](https://fluentassertions.com/objectgraphs/)).
But, while it does seem good for this simple test case, it might not be that readable for more complex class structures.
Also, other examples might not have an API to assert multiple conditions that belong together, e.g. to verify if all side effects are triggered.

That's where an Assertion Scope is beneficial.
With it, it's possible to create a group of assertions that are tested together.

All assertions within that group are executed regardless of their outcome.
If one (or more) assertion(s) fail, the rest of the assertions are still executed.
Afterward, we get a nice compact overview containing the assertion(s) that have failed.

The refactored test case that uses an Assertion Scope looks like this:

```cs{13-17}:Tests.ts
using FluentAssertions;
using FluentAssertions.Execution;

namespace DemoTests;

public class Tests
{
    [Test]
    public void Test1()
    {
        var person = new Person { FirstName = "Elaine" , LastName = "Benes"};

        using (new AssertionScope())
        {
            person.FirstName.Should().Be("elaine");
            person.LastName.Should().Be("benes");
        }
    }

    class Person
    {
        public required string FirstName { get; init; }
        public required string LastName { get; init; }
    }
}
```

Resulting in the following output.
As before, we get the same messages.
The big difference is that we now get them all at once instead of one by one.

```txt{2-3}
Error Message:
    Expected person.FirstName to be "elaine", but "Elaine" differs near "Elaine" (index 0).
    Expected person.Name to be "benes", but "Benes" differs near "Bennes" (index 0).
Stack Trace:
    ...
```

> The same result can be achieved with the [Shouldly](https://github.com/shouldly/shouldly) library by using [SatisfyAllConditions](https://docs.shouldly.org/documentation/satisfyallconditions)

I also encourage you to give a description to the scope by passing in a description as an argument.
This makes it very explicit that assertions belong to each other, and also gives a clear view of why the test fails.

```cs{13-17}:Tests.ts
using FluentAssertions;
using FluentAssertions.Execution;

namespace DemoTests;

public class Tests
{
    [Test]
    public void Test1()
    {
        var person = new Person { FirstName = "Elaine" , LastName = "Benes"};

        using (new AssertionScope("The person is created with the correct names"))
        {
            person.FirstName.Should().Be("elaine");
            person.LastName.Should().Be("benes");
        }
    }

    class Person
    {
        public required string FirstName { get; init; }
        public required string LastName { get; init; }
    }
}
```

To see the differences, you can compare the next error messages with the previous ones.

```txt{2-6}
Error Message:
    Expected The person is created with the correct names to be "elaine",
    but "Elaine" differs near "Elaine" (index 0).

    Expected The person is created with the correct names to be "benes",
    but "Benes" differs near "Bennes" (index 0).
Stack Trace:
    ...
```

## Conclusion

With [Assertion Scopes](https://fluentassertions.com/introduction#assertion-scopes) provided by the [FluentAssertions](https://fluentassertions.com/) library, we can group multiple assertions into a single "transaction".
This has the benefit that when a test fails, you are immediately presented with the bigger picture.
In contrast to not using them, where you have to re-execute the same test over and over again until all assertions are fixed.
Not only does this increase the developer experience, it also increases the productivity of you and your team.
