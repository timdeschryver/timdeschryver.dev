---
title: The Evolution of C# Constructors
slug: the-evolution-of-csharp-constructors
date: 2023-09-05
tags: dotnet
---

# The Evolution of C# Constructors

C# 12 introduces a new syntax to declare class constructors with [Primary Constructors](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/tutorials/primary-constructors).
That's why I thought that it's a good time to look back at the evolution of C# constructors.
Starting from the most basic constructor that most of us are familiar with, to the newer variations that were added in latest the C# versions.

:::code-group

```cs:Person.ts [title=Constructor]
public class Person
{
    public long Id { get; }
    public string Name { get; }

    public Person(int id, string name)
    {
        Id = id;
        Name = name;
    }
}
```

```cs:Person.ts [title=Tuples (C# 7)]
public class Person
{
    public long Id { get; }
    public string Name { get; }

    public Person(int id, string name)
        => (Id, Name) = (id, name);
}
```

```cs:Person.ts [title=Required Modifier (C# 11)]
public class Person
{
    public required long Id { get; init; }
    public required string Name { get; init; }
}
```

```cs:Person.ts [title=Primary Constructors (C# 12)]
public class Person(long id, string name)
{
    public long Id { get; } = id;
    public string Name { get; } = name;
}
```

:::
