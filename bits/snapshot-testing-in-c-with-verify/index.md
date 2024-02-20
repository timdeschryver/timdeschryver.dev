---
title: Snapshot testing in C# with Verify
slug: snapshot-testing-in-c-with-verify
date: 2024-02-20
tags: dotnet, libraries
---

# Snapshot tests in C# with Verify

## Why snapshot testing

Snapshot testing is a powerful technique that allows you to compare the output of your code with a previously stored value, also known as a snapshot.
This way, you create a quick feedback loop to easily detect any changes or regressions in your code without having to write complex assertions.

I like to write snapshot tests to compare the output of a (large or complex) contract against a pre-defined data model.
This is often faster to write and easier to read (also by non-technical people) in comparison to writing a complex assertion with code.

## How does it work

Snapshot testing usually stores a previously generated output as a separate file.
When the test case is re-executed it compares the new output (local, not included in git) against the stored file (which is included in git).
If the new output matches the existing output the test will pass, otherwise the test will fail.
When the latter is the case, you can either update the snapshot if the change is desired or investigate the change(s) if the output is unexpected.

## Using Verify in C#

For snapshot testing in C# you can use the [Verify](https://github.com/VerifyTests/Verify) snapshot tool.

Verify is a simple library that you can use as a standalone tool, or you can use one of its opt-in integrations with popular testing frameworks, such as NUnit, xUnit, and MSTest.
A killer feature is that Verify also provides a rich diffing tool (think of a git compare) to help you understand the differences between snapshots, including helpful "accept" and "reject" features to update the snapshots.

To write a snapshot test with Verify use one of the `Verify` methods within a test to return the model under test.
By default it uses the fully qualified method name of the test case to create the existing output file (`*.verified.*`) and the newly generated file (`*.received.*`).
Every time the test case is executed, the received file is re-created and compared with the verified file.

To make the managing of snapshots easier, you can make use of IDE plugins ([ReSharper Plugin](https://plugins.jetbrains.com/plugin/17241-verify-support) or [Rider Plugin](https://plugins.jetbrains.com/plugin/17240-verify-support)) or the [dotnet cli tool](https://github.com/VerifyTests/Verify.Terminal).

As an example let's take a look at the following flow using Verify.

:::code-group

```csharp:Tests.cs [title=Writing a snapshot test]
public class Tests
{
    [Test]
    public Task Person_matches_with_contract()
    {
        var person = new Person(7, "Tim", "Running");
        return Verify(person);
    }
}
```

```diff:The initial file that is received [title=Snapshot 1]
+ {
+    id: 7,
+    name: Tim,
+    hobby: Running,
+ }
```

```diff:The compare between the received and existing files after a change [title=Snapshot 2]
{
     id: 7,
     name: Tim,
-    hobby: Running
}
```

```txt:Test outcome to accept or reject [title=Result]
Failed Person_matches_with_contract
Error Message:
   VerifyException
NotEqual:
  - Received: Tests.Person_matches_with_contract.received.txt
    Verified: Tests.Person_matches_with_contract.verified.txt

FileContent:
NotEqual:

Received: Tests.Person_matches_with_contract.received.txt
{
   Id: 7,
   Name: Tim
}
Verified: Tests.Person_matches_with_contract.verified.txt
{
  Id: 7,
  Name: Tim,
  Hobby: Running
}
```

:::
