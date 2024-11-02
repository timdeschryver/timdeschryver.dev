---
title: 'New LINQ methods in C# 13: Index, CountBy, AggregateBy'
slug: new-linq-methods-in-c-13-index-countby-aggregateby
description: Taking a look (including examples) at the new LINQ methods that will be introduced in C# 13, as part of the .NET 9 release.
date: 2024-10-23
tags: .NET, C#, LINQ
---

In this article, we will explore the new LINQ methods that (normally) will be introduced in C# 13, as part of the .NET 9 release during [.NET Conf 2024](https://www.dotnetconf.net/).
These new methods are `Index`, `CountBy`, and `AggregateBy`.

:::warning
These LINQ methods are part of the release candidate, the final release may include changes or removals.
:::

:::info
Upgrading to .NET 9 will give you a ton of [LINQ optimizations](https://devblogs.microsoft.com/dotnet/performance-improvements-in-net-9/#linq), which you automatically get for free!
:::

The examples throughout this article use the following data collection.
We have a collection of 5 students, each with a name and a score.

```csharp
Student[] students = [
    new("Alice", "A"),
    new("Bob", "B"),
    new("Charlie", "C"),
    new("David", "B"),
    new("Eve", "A")
];

record Student (string Name, string Score);
```

## Index

The `Index()` method ([Enumerable.Index<TSource>](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.index)) adds an index to each element in the collection. The index is a 0-based integer that represents the position of the element in the collection.

The example below simply adds an index to each student in the collection.

```csharp
IEnumerable<(int, Student)> studentsWithIndex = students.Index();

foreach (var (index, student) in studentsWithIndex)
{
    Console.WriteLine($"Student {index}: {student.Name}");
}
```

Output:

```txt
Student 0: Alice
Student 1: Bob
Student 2: Charlie
Student 3: David
Student 4: Eve
```

## CountBy

The `CountBy()` method ([Enumerable.CountBy<TSource, TKey>](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.countby)) groups the elements in the collection by a key and returns the count of elements in each group.

The example below groups the students by their score and counts the number of students in each group.

```csharp
IEnumerable<KeyValuePair<string, int>> studentsByScore = students
    .CountBy(keySelector: student => student.Score);

foreach (var (score, count) in studentsByScore)
{
    Console.WriteLine($"Students with a {score}-score: {count}");
}
```

Output:

```txt
Students with a A-score: 2
Students with a B-score: 2
Students with a C-score: 1
```

It's also possible to use add an expression to build the identifier for the group.
The example below groups the students by their score ("A" or "B" means the student has passed) and counts the number of students that passed or failed.

```csharp
IEnumerable<KeyValuePair<bool, int>> studentsCountPassedOrFailed = students
    .CountBy(keySelector: student => student.Score is "A" or "B");

foreach (var (passed, count) in studentsCountPassedOrFailed)
{
    Console.WriteLine($"Students that {(passed ? "passed" : "failed")}: {count}");
}
```

Output:

```txt
Students that passed: 4
Students that failed: 1
```

`CountBy()` can also accept a comparer (`IEqualityComparer<TKey>? keyComparer`) as the second argument.

## AggregateBy

The `AggregateBy()` method ([Enumerable.AggregateBy<TSource, TKey, TAccumulate>](https://learn.microsoft.com/en-us/dotnet/api/system.linq.enumerable.aggregateby)) groups the elements in the collection by a key and aggregates (similar to `Aggregate()`) the elements in each group.

The first argument is the key selector, creating the group.
The second argument is the initial value (seed) for each group.
The third argument is the function that aggregates the elements in the group, it receives the value of the group and the current element.

The example below groups students by their scores.

```csharp
IEnumerable<KeyValuePair<string, List<string>>> studentsByScore = students
    .AggregateBy(
        keySelector: student => student.Score,
        seed: new List<string>(),
        func: (group, student) => [..group, student.Name]
    );

foreach (var (score, studentGroup) in studentsByScore)
{
    Console.WriteLine($"Students with a {score}-score: {string.Join(", ", studentGroup)}");
}
```

Output:

```txt
Students with a A-score: Alice, Eve
Students with a B-score: Bob, David
Students with a C-score: Charlie
```

`AggregateBy()` can also accept a comparer (`IEqualityComparer<TKey>? keyComparer`) as the last argument.
