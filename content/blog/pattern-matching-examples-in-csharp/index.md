---
title: Pattern Matching Examples in C#
slug: pattern-matching-examples-in-csharp
description: Some basic and more advanced examples of pattern matching in C#.
author: Tim Deschryver
date: 2021-09-13
tags: dotnet, csharp, pattern-matching
banner: ./images/banner.jpg
published: true
---

My first experience with pattern matching was a few years ago when I was fiddling with some functional programming languages like Elixir and F#. The ability to pattern match a value or object was one thing that I was missing when I was writing code in C# (and also in JavaScript).

I was happy to see that C# 7 introduced [the first version of pattern matching](https://devblogs.microsoft.com/dotnet/new-features-in-c-7-0/#pattern-matching), which was supporting the bare minimum. Because of my previous encounters with pattern matching, this was a bit of a let-down because it didn't have all the possibilities I was used to. Luckily, the release of C# 8 extended the pattern match syntax by supporting more features, which were further enhanced in C# 9, and it also seems like this trend is continuing in the upcoming versions of C#.

### Why pattern matching

So why am I excited about this?

Everything that you can do with pattern matching is also possible without using it, but it won't look as good.
Pattern matching can turn a complex if-else or switch statement into a compact block of code.

Because of this, my developer experience has improved with the addition of pattern matching.
Its strength is that it's expressive, making it easier to read and harder to write bugs.

A bonus is that the compiler acts as a safety net (more on this later), it warns for unhandled cases and prevents cases to conflict with each other.
This isn't something you get with a normal if-else statement, which sadly, has bitten me in the past.
It's good to know that compiler has your back by reporting silly mistakes.

For the rest of this post, let's take a look at some examples of how pattern matching with switch expressions is used.

### A simple example

The simplest example is a check for a simple true/false value.
Pattern matching compares an input value (`false` in the example below) to a set of defined patterns, think of them as a set of conditions. The patterns inside the switch expression are evaluated from top to bottom, and the first case that causes a match is executed.

```cs{4}
var output = false switch
{
    true => "true",
    false => "false",
};
// output: false
```

### Constant Patterns

We can use pattern matching to check if a variable has a constant value.
The types that are matchable are strings, chars, numbers, and enums.

```cs{6}
var output = 4 switch
{
    1 => "one",
    2 => "two",
    3 => "three",
    4 => "four",
    5 => "five",
};
// output: four
```

### Discard Patterns

Because not every number is included in the switch expression of the previous example, the C# compiler warns that there are uncovered cases.

```bash
warning CS8509: The switch expression does not handle all possible values
of its input type (it is not exhaustive).
For example, the pattern '0' is not covered.
```

To address this warning, we can add a fallback case.
Think of it as a default case from a switch statement, a wildcard that is **invoked when no other of the previous patterns are matched**. In the example below, the **discard operator** (represented as an underscore `_`) is used to match all other possible values.

```cs{8}
var output = 9 switch
{
    1 => "one",
    2 => "two",
    3 => "three",
    4 => "four",
    5 => "five",
    _ => "other"
};
// output: other
```

### Variable Patterns

A **matched value can be assigned to a variable**.
In the following example, the variable acts as a wildcard that matches any value.
A variable can also be defined when the input value of a [Type Pattern](#type-patterns) matches a Type, the created variable is typed in this case. The variable can then be used in the execution expression (after the `=>`) to create a return value.

Furthermore, a **`when` statement can be added to the pattern to add an extra guard to the pattern**.
The `when` statement can be used to match a non-constant value against a condition, for example, to invoke a method on the matched variable. Besides matching the object that is being matched, it's also possible to include other objects in the `when` statement.

```cs{6}
var greetWithName = false;
var output = "Mrs. Kim" switch
{
    _ when greetWithName == false => $"Hi",
    "Tim" => "Hi Tim!",
    var str when str.StartsWith("Mrs.") || str.StartsWith("Mr.") => $"Greetings {str}",
    var str => $"Hello ${str}",
};
// output: Mrs. Kim
```

### Relational Patterns

We use **relation operators** (`=`, `>`, `<`, `>=`, `<=`) to test if the input is equal, greater, or less than another value.

```cs
var output = 4 switch
{
    < 3 => "less than 3",
    <= 7 => "less than or equal to 7",
    < 1 => "less than 10",
    _ => "greater than or equal to 10"
};
// output: ?
```

Did you spot the mistake in the example?
If that isn't the case, you don't have to worry, because this time the compiler throws an error to address my mistake.

```bash
error CS8510: The pattern is unreachable. It has already been handled by
a previous arm of the switch expression or it is impossible to match.
```

Let's fix this mistake by correcting the pattern.

```cs{4}
var output = 4 switch
{
    < 3 => "less than 3",
    <= 7 => "less than or equal to 7",
    < 10 => "less than 10",
    _ => "greater than or equal to 10"
};
// output: less than or equal to 7
```

### Multiple Patterns

To combine patterns or to negate values, we use the **logical operators** (`and`, `or`, `not`).

```cs{4}
var output = 4 switch
{
    1 or 2 or 3 => "1, 2, or 3",
    > 3 and <= 6 => "between 3 and 6",
    not 7 => "not 7",
    _ => "7"
};
// output: between 3 and 6
```

### Tuple Patterns

Matching single values is nice but not very useful in many cases.
To match multiple values, we can **pattern match multiple input values by using tuples**.

```cs{6}
var output = (5, false) switch
{
    (< 4, true) => "lower than 4 and true",
    (< 4, false) => "lower than 4 and false",
    (4, true) => "4 and true",
    (5, _) => "five and something",
    (_, false) => "something and false",
    _ => "something else",
};
// output: five and something
```

### Property Patterns

When the input is an object, we can add a pattern to **the properties of an object**.

```cs{5}
var output = new User("Tim Deschryver", "Developer") switch
{
    { Role: "Admin" } => "the user is an admin",
    { Role: "Administrator" } => "the user is an admin",
    { Name: "Tim", Role: "Developer" } => "the user is Tim and he is a developer",
    { Name: "Tim" } => "the user is Tim and he isn't a developer",
    _ => "the user is unknown",
};
// output: the user is Tim and he is a developer

record User(string Name, string Role);
```

### Nested Properties Patterns

It's even possible to **match nested properties**.

```cs{5}
var output = new Member("Tim Deschryver", new MemberDetails(8, false)) switch
{
    { Details: { Blocked: true } } => Array.Empty<string>(),
    { Details: { MonthsSubscribed: < 3 } } => new[] { "comments" },
    { Details: { MonthsSubscribed: < 9 } } => new[] { "comments", "mention" },
    _ => new[] { "comments", "mention", "ping" },
};
// output: comments, mention

record Member(string Name, MemberDetails Details);
record MemberDetails(int MonthsSubscribed, bool Blocked);
```

The above example can be hard to read (especially if you need to drill down into multiple objects).
As a remedy, C# 10 provides a new syntax called **extended property patterns** to make this easier on the eyes.
The refactored example looks as follows. Much better, right?

```cs{5}
var output = new Member("Tim Deschryver", new MemberDetails(8, false)) switch
{
    { Details.Blocked: true } => Array.Empty<string>(),
    { Details.MonthsSubscribed: < 3 } => new[] { "comments" },
    { Details.MonthsSubscribed: < 9 } => new[] { "comments", "mention" },
    _ => new[] { "comments", "mention", "ping" },
};
// output: comments, mention

record Member(string Name, MemberDetails Details);
record MemberDetails(int MonthsSubscribed, bool Blocked);
```

### Type Patterns

Pattern matching can also be used to **match a type of an object**.
Type patterns are useful when you have a generic handler that acts as a pass-through.

```cs{6}
var output = new InventoryItemRemoved(3) as object switch
{
    // the variable `added` is of type `InventoryItemAdded`
    InventoryItemAdded added => $"Added {added.Amount}",
    // the variable `removed` is of type `InventoryItemRemoved`
    InventoryItemRemoved removed => $"Removed {removed.Amount}",
    InventoryItemDeactivated => "Deactivated",
    null => throw new ArgumentNullException()
    // the variable `o` is of type `object`
    var o => throw new InvalidOperationException($"Unknown {o.GetType().Name}")
};
// output: Removed 3
```

### Examples

The examples we've seen so far are simple and are here to show the different syntaxes to build a pattern.
To unlock the true power of pattern matching, multiple pattern matching strategies can be combined.

```cs{9}
// retrieve the rate of an appointment
var holidays = new DateTime[] {...};
var output = new Appointment(DayOfWeek.Friday, new DateTime(2021, 09, 10, 22, 15, 0), false) switch
{
    { SocialRate: true } => 5,
    { Day: DayOfWeek.Sunday } => 25,
    Appointment a when holidays.Contains(a.Time) => 25,
    { Day: DayOfWeek.Saturday } => 20,
    { Day: DayOfWeek.Friday, Time.Hour: > 12 } => 20,
    { Time.Hour: < 8 or >= 18 } => 15,
    _ => 10,
};
// output: 20

record Appointment(DayOfWeek Day, DateTime Time, bool SocialRate);
```

```cs{5}
// a combination of the variable pattern and the tuple pattern
var output = ("", "Tim") switch
{
    var (title, name) when title.Equals("Mrs.") || title.Equals("Mr.") => $"Greetings {title} {name}",
    var (_, name) and (_, "Tim") => $"Hi {name}!",
    var (_, name) => $"Hello {name}",
};
// output: Hi Tim!
```

```cs{5}
// format a string
var contactInfo = new ContactInfo("Sarah", "Peeters", "0123456789");
var output = contactInfo switch
{
    { TelephoneNumber: not null } or { TelephoneNumber: not "" } => $"{contactInfo.FirstName} {contactInfo.LastName} ({contactInfo.TelephoneNumber})",
    _ => $"${contactInfo.FirstName} ${contactInfo.LastName}"
};
// output: Sarah Peeters (0123456789)
```

```cs{6}
// C# Language Highlights: Tuple Pattern Matching https://www.youtube.com/watch?v=v_xKLwTv3AI
IEnumerable<string> sequence = new[] { "foo" };
var output = sequence switch
{
    string[] { Length: 0 } => "array with no items",
    string[] { Length: 1 } => "array with a single item",
    string[] { Length: 2 } => "array with 2 items",
    string[] => $"array with more than 2items",
    IEnumerable<string> source when !source.Any() => "empty enumerable",
    IEnumerable<string> source when source.Count() < 3 => "a small enumerable",
    IList<string> list => $"a list with {list.Count} items",
    null => "null",
    _ => "something else"
};
// output: array with a single item
```

### Official documentation

We've only seen examples of pattern matching expressions in this post.
For more details, please take a look at the official documentation:

- [Pattern matching overview](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching)
- [Use pattern matching to build your class behavior for better code](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/tutorials/patterns-objects)
- [Tutorial: Use pattern-matching to build type-driven and data-driven algorithms](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/pattern-matching)
