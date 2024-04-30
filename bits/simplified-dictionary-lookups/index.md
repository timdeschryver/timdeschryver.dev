---
title: Simplified Dictionary Lookups
slug: simplified-dictionary-lookups
date: 2024-04-30
tags: dotnet
---

# Simplified Dictionary Lookups

When accessing values from a dictionary, it is common to check if the key exists before accessing the value to avoid exceptions when the key does not exist in the dictionary.
This can be done using the `ContainsKey` method followed by an index identifier.

At first glance, this seems like a good practice.
However, by turning on the code analysis rule [CA1854](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/CA1854) on our codebase, we learned that this isn't the case.

To fix this violation, the rule suggests using the `TryGetValue` method instead.
This method avoids redundant lookups while accessing values from a dictionary.
And, I also find that using `TryGetValue` makes the code easier to read.

After this change, which can be auto-fixed, the JetBrains tooling went a step further to simplify this code.
The [CanSimplifyDictionaryTryGetValueWithGetValueOrDefault](https://www.jetbrains.com/help/resharper/CanSimplifyDictionaryTryGetValueWithGetValueOrDefault.html) code inspection, refactors this code block into a one-liner using the `GetValueOrDefault` method (also with an auto-fix).
This is only applicable when a default value is used for values that do not exist in the dictionary.

As a result, we can make our codebases more efficient and concise.

:::code-group

```cs [title=ContainsKey]
var value = "fallback";
if (dictionary.ContainsKey("key"))
{
  value = dictionary["key"];
}
```

```cs [title=TryGetValue]
if (!dictionary.TryGetValue("key", out var value))
{
  value = "fallback";
}
```

```cs [title=Contains Key]
var value = dictionary.GetValueOrDefault("key", "fallback");
```

:::
