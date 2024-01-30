---
title: Automatically verify that team rules are met using Architectural Tests
slug: automatically-verify-that-team-rules-are-met-using-architectural-tests
date: 2024-01-30
tags: libraries, developer-experience, productivity
---

# Automatically verify that team rules are met using Architectural Tests

Every team has rules and agreements on how to write and structure code.
In the best case, these are documented, _and yes we all know that developers don't like to read documentation_, also every team has its unwritten rules.
Some of these rules carry over across teams e.g. best practices, while others do not and are team-specific e.g. a personal preference or some historical reason.

So how do you make sure that everyone including new team members follow the team's style?
We already established that it's hard to stick to the rules using a wiki.
Pair programming and pull requests do help, but this doesn't scale well.
This also leaves room for inconsistencies.

Instead of a human verifying if the rules are followed, we need a way to automate this process.
While doing so, the agreed team rules are set in stone and cannot be ignored or misinterpreted.

Teams already rely on automated tests to test the functional requirements (and probably the non-functional requirements) of the application.
So why not include test cases to test if your team rules are met?

As a solution, we can resort to Architectural Tests.
Architectural Tests are comparable to unit tests and are focused on the architecture as a way to enforce team rules and agreements.

Automating this process gives the same benefits as other tests, it saves time and shortens the feedback loop.
And one needs to be the bad guy while (repeatedly) commenting on someone else's code.
As a result, this widens the pit of success.
The same rules apply to every team member, this greatly improves the consistency within your codebase.

Some good candidates that qualify to write Architectural Tests are:

- Naming rules
- Dependency rules (Namespace and Types)
- Folder/namespace structure rules
- Attribute-based rules

To write architecture tests we use the [ArchUnitNET](https://github.com/TNG/ArchUnitNET) package (a port from the popular ArchUnit package in the Java ecosystem).
Using its FluentAPI rules (tests) can be created to assert the structure of a system.
When a test fails, it provides a descriptive and clear error message, in which you can also include a reason.

Some practical examples:

:::code-group

```cs [title=Naming test]
public class ArchituralTests
{
    private static readonly Architecture Architecture =
        new ArchLoader().LoadAssemblies(
            typeof(Domain.AssemblyReference).Assembly
        ).Build();

    [Test]
    public void Only_AggregateRoots_end_with_root_in_the_name()
    {
        IArchRule classesToEndWithRoot = Classes()
            .That()
            .ResideInNamespace("Domain")
            .And()
            .ImplementInterface(typeof(IAggegrateRoot))
            .Should()
            .HaveNameEndingWith("Root");

        IArchRule classesDontEndWithRoot = Classes()
            .That()
            .ResideInNamespace("Domain")
            .And()
            .HaveNameEndingWith("Root")
            .Should()
            .ImplementInterface(typeof(IAggegrateRoot))
            .Because("To prevent confusion, only aggregate roots can end with 'Root'.")
            .AndShould()
            .BeSealed();

        IArchRule rootRules = classesToEndWithRoot
                .And(classesDontEndWithRoot);

        rootRules.Check(Architecture);
    }
}
```

```cs [title=Dependency test]
public class ArchituralTests
{
    private static readonly Architecture Architecture =
        new ArchLoader().LoadAssemblies(
            typeof(Domain.AssemblyReference).Assembly,
        ).Build();

    [Test]
    public void Core_doesnt_have_a_dependency_on_infrastructure()
    {
         IObjectProvider<IType> forbiddenLayer = Types()
             .That()
             .ResideInNamespace("Infrastructure")
             .As("Infrastructure Layer");

        TypesShouldConjunction violations = Types()
            .That()
            .ResideInAssembly(typeof(Domain.Domain).Assembly)
            .Should()
            .NotDependOnAny(forbiddenLayer);

        violations.Check(Architecture);
    }
}
```

```cs [title=Attribute Test]
public class ArchituralTests
{
    private static readonly Architecture Architecture =
        new ArchLoader().LoadAssemblies(
            typeof(Migrations.AssemblyReference).Assembly
        ).Build();

    [Test]
    public void Migrations_are_annotated_with_the_MigrationsAttribute_and_follow_the_agreed_upon_name_convention()
    {
        IArchRule migrationConventionRule = Classes()
            .That()
            .ResideInNamespace("Migrations.Migrations")
            .Should()
            .HaveAnyAttributes(typeof(FluentMigrator.MigrationAttribute))
            .Because("Otherwise the migration isn't run")
            .AndShould()
            .HaveFullName("^Migration_\\d{12}_[A-Za-z0-9_]+?$", true)
            .Because("The filename impacts the order of execution");

        migrationConventionRule.Check(Architecture);
    }
}
```

```cs [title=Using AST]
public class ArchituralTests
{
    private static readonly Architecture Architecture =
        new ArchLoader().LoadAssemblies(
            typeof(Domain.AssemblyReference).Assembly,
            typeof(WebApi.AssemblyReference).Assembly
        ).Build();

    [Test]
    public void Empty_classes_are_not_allowed()
    {
        var classesWithoutBody = Classes()
            .GetObjects(Architecture)
            .Where(clazz =>
            {
                return !clazz.GetFieldMembers().Any()
                       && !clazz.GetPropertyMembers().Any()
                       && clazz.GetMethodMembers().All(methodMember => methodMember.IsConstructor());
            });

        Assert.Multiple(() =>
        {
            foreach (var clazz in classesWithoutBody)
            {
                Assert.Fail($"The class '{clazz.Name}' doesn't have a body, did you forget to clean this up?");
            }
        });
    }

    [Test]
    public void Models_always_have_an_empty_internal_constructor()
    {
        var modelsWithoutCtor = Classes()
            .That()
            .ResideInNamespace("Models")
            .GetObjects(Architecture)
            .Where(clazz =>
            {
                var internalCtors = clazz.Constructors.Where(c => c.Visibility == Visibility.Internal);
                return !internalCtors.Any() || internalCtors.All(c => c.Parameters.Count() != 0);
            });

        Assert.Multiple(() =>
        {
            foreach (var model in modelsWithoutCtor)
            {
                Assert.Fail($"Make sure that '{model.Name}' has an empty constructor it's serializable.");
            }
        });
    }
}
```

:::

While I was writing this Bit I also noticed [Milan Jovanović](https://www.milanjovanovic.tech/) created two videos ([How To Create Better .NET Applications with Architecture Tests](https://www.youtube.com/watch?v=eWjNLYNS-og) and [How to Write Architecture Tests for the Clean Architecture](https://www.youtube.com/watch?v=_D6Kai4RdGY)) on Architectural Tests using a similar library [NetArchTest](https://github.com/BenMorris/NetArchTest).
Both libraries serve the same purpose, and have a similar Fluent API, but are different in some small details e.g. in the way they assert the rules.

A little side note, there isn't a lot of documentation about both of these libraries and this will require some trial and error while writing your first architectural tests, at least this was the case for myself.
