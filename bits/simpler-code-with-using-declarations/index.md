---
title: Simpler code with Using Declarations
slug: simpler-code-with-using-declarations
date: 2023-12-12
tags: dotnet
---

# Using declaration

The [using declaration](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-8.0/using#using-declaration) is a feature (introduced in C# 8.0) that allows you to declare a disposable object with the `using` keyword.

The lifetime of a using local will extend to the end of the scope in which it is declared.
The using locals will then be disposed in the reverse order in which they are declared.

I prefer this syntax compared to the "older" using statements because it's easier to read and follow.
You no longer have to create scope blocks with curly brackets (and the accompanying indentation(s)) to dispose objects.

:::code-group

```cs:UsingDeclarion [title=Using declarion syntax]
int CountOccurences(string fileName, string word)
{
    using var fileStream = new FileStream(fileName, FileMode.Open);
    using var reader = new StreamReader(fileStream);
    /* Logic here */
}
```

```cs:UsingStatement.cs [title=Using statement syntax]
int CountOccurences(string fileName, string word)
{
    using (var fileStream = new FileStream(fileName, FileMode.Open))
    {
        using (var reader = new StreamReader(fileStream))
        {
           /* Logic here */
        }
    }
}
```

:::
