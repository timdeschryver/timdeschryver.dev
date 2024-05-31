---
title: 'New in C# 12: Collection expressions'
slug: new-in-c-12-collection-expressions
date: 2023-10-10
tags: dotnet
---

# New in C# 12: Collection expressions

Creating collections becomes simpler in C# 12 using collection expressions.
We can also make use of the spread operator `..` to copy the values from a collection.

```diff
- Log(new[] { "one", "two", "three" });

+ Log(["one", "two", "three"]);

+ string[] values = ["one", "two", "three"];
+ Log([.. values, "four", .. (string[])["five", "six"]]);

void Log(string[] values) {}
```

More info can be found in the [documentation](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12#collection-expressions).
