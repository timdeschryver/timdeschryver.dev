---
title: A cheat sheet to migrate from Moq to NSubstitute
slug: a-cheat-sheet-to-migrate-from-moq-to-nsubstitute
description: A quick reference to help the migration from Moq to NSubstitute.
date: 2023-08-14
tags: dotNET, NSubstitute, Moq, Testing
---

## Initialization: `new Mock<T>()` => `Substitute.For<T>()`

```csharp{1}:Moq.cs
var mock = new Mock<IService>();

// or, if you don't need to customize and verify the mock
var mock = Mock.Of<IService>();
// when using the above, you can still get the mock instance using Mock.Get
var mockInstance = Mock.Get(mock);
```

```csharp{1}:NSubstitute.cs
var mock = Substitute.For<IService>();
```

## Argument matchers

### Matches any value: `It.IsAny<T>()` => `Arg.Any<T>()`

```csharp:Moq.cs
It.IsAny<string>()
```

```csharp:NSubstitute.cs
Arg.Any<string>()

// shorthand: use `default` im combination with `WithAnyArgs` methods
// instead of the `Arg` syntax in (examples follow later)
```

### Matches a specific value: `It.Is<T>()` => `Arg.Is<T>()`

```csharp:Moq.cs
It.Is<string>(matcher => matcher == "foo")
It.Is<int>(matcher => matcher >= 10 && matcher <= 20)
```

```csharp:NSubstitute.cs
Arg.Is<string>(matcher => matcher == "foo")
Arg.Is<string>("foo")
Arg.Is<int>(matcher => matcher >= 10 && matcher <= 20)

// shorthand: use `value` directly instead of the `Arg` syntax (examples follow later)
```

### Matches a generic type: `It.IsAnyType()` => `TBD`

Moq's helpers `It.IsAnyType`, `It.IsValueType`, and `It.IsSubtype<T>` are currently not supported by NSubstitute.
Keep an eye on this [issue #634](https://github.com/nsubstitute/NSubstitute/issues/634) for updates.

## Testing method invocations: `Verify()` => `Received()`

### Method without arguments

```csharp{4}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Object.Method();

mock.Verify(x => x.Method());
```

```csharp{4}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.Method();

mock.Received().Method();
```

### Method invoked with any arguments

```csharp{4}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Object.MethodWithArgument("foo");

mock.Verify(x => x.MethodWithArgument(It.IsAny<string>()));
```

```csharp{4, 6-7}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithArgument("foo");

mock.Received().MethodWithArgument(Arg.Any<string>());

// or use `ReceivedWithAnyArgs` in combination with `default` instead of the `Arg` syntax
mock.ReceivedWithAnyArgs().MethodWithArgument(default);
```

### Method invoked with specific arguments

```csharp{4}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Object.MethodWithArgument("foo");

mock.Verify(x => x.MethodWithArgument(It.Is<string>(match => match == "foo")));
```

```csharp{4,6-7, 9-10}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithArgument("foo");

mock.Received().MethodWithArgument(Arg.Is<string>(match => match == "foo"));

// shorthand for the `Arg` syntax
mock.Received().MethodWithArgument(Arg.Is("foo"));

// or directly use the value instead of the `Arg` syntax
mock.Received().MethodWithArgument("foo");
```

### Number of invocations: `Times.Exactly(N)` => `Received(N)`

```csharp{6-7,9-10,12-13, 15-16}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.MethodWithArgument("foo");
mock.MethodWithArgument("bar");
mock.MethodWithArgument("bar");

// is invoked
mock.Verify(x => x.MethodWithArgument(It.IsAny<string>()));

// is invoked exactly once
mock.Verify(x => x.MethodWithArgument(It.Is<string>(match =>  match == "foo")), Times.Once());

// is invoked exactly x times
mock.Verify(x => x.MethodWithArgument(It.Is<string>(match => match == "bar")), Times.Exactly(2));

// there are also other options like `Times.Between(N, N)`, `Times.AtMost(N)`, `Times.AtLeast(N)`
// these do not have a direct equivalent in NSubstitute
```

```csharp{6-7,9-10,12-13}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithArgument("foo");
mock.MethodWithArgument("bar");
mock.MethodWithArgument("bar");

// is called
mock.ReceivedWithAnyArgs().MethodWithArgument(default);

// is called exactly once
mock.Received(1).MethodWithArgument(Arg.Is<string>(match => match == "foo"));

// is called x times
mock.Received(2).MethodWithArgument(Arg.Is<string>(match => match == "bar"));
```

### Is not invoked: `Times.Never()` => `DidNotReceive()`

```csharp{4-5}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Object.MethodWithArgument("foo");

mock.Verify(x => x.Method(), Times.Never());
mock.Verify(x => x.MethodWithArgument(It.Is<string>(match => match == "bar")), Times.Never());
```

```csharp{4,6-8, 10-11}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithArgument("foo");

mock.DidNotReceiveWithAnyArgs().Method();

// with argument check
mock.DidNotReceive().MethodWithArgument(Arg.Is<string>(match => match == "bar"));
mock.DidNotReceive().MethodWithArgument(Arg.Is<string>("bar"));

// shorthand for the `Arg` syntax
mock.DidNotReceive().MethodWithArgument("bar");
```

### Reset invocations: `Reset()` => `ClearReceivedCalls()`

```csharp{6}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Object.Method();

mock.Verify(x => x.Method());

mock.Reset();

mock.Verify(x => x.Method(), Times.Never());
```

```csharp{6}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.Method();

mock.Received().Method();

mock.ClearReceivedCalls();

mock.DidNotReceive().Method();
```

### Task invocation

```csharp{4}:Moq.cs
var mock = new Mock<IMyDependency>();
await mock.Object.MethodAsync();

mock.Verify(x => x.MethodAsync());
```

```csharp{4-5}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
await mock.MethodAsync();

// also works without `await` but results in a warning
await mock.Received().MethodAsync();
```

## Setting the return value

### Static return value: `Setup().Returns()` => `Returns()`

```csharp{2}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Setup(m => m.MethodWithReturnValue()).Returns("output");

var result = mock.Object.MethodWithReturnValue();
Assert.That(result, Is.EqualTo("output"));
```

```csharp{2}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithReturnValue().Returns("output");

var result = mock.MethodWithReturnValue();
Assert.That(result, Is.EqualTo("output"));
```

### Return value based on input: `method arguments` => `callInfo`

```csharp{2-3}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Setup(m => m.MethodWithReturnValue(It.IsAny<int>(), It.IsAny<string>()))
    .Returns((int input, string prefix) => $"{prefix}_{input}");

var result = mock.Object.MethodWithReturnValue(1, "prefix");
Assert.That(result, Is.EqualTo("prefix_1"));
```

```csharp{2-4, 6-8}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
// get the argument based on the type, and if needed include the index
mock.MethodWithReturnValue(Arg.Any<int>(), Arg.Any<string>())
    .Returns(callInfo => $"{callInfo.Arg<string>()}_{callInfo.ArgAt<int>(0)}");

// using `ReturnsForAnyArgs` in combination with `default` instead of the `Arg` syntax
mock.MethodWithReturnValue(default, default)
    .ReturnsForAnyArgs(callInfo => $"{callInfo.Arg<string>()}_{callInfo.ArgAt<int>(0)}");

var result = mock.MethodWithReturnValue(1, "prefix");
Assert.That(result, Is.EqualTo("prefix_1"));
```

### Fine grained control over return value based on input

```csharp{2-5}:Moq.cs
 var mock = new Mock<IMyDependency>();
mock.Setup(m => m.MethodWithReturnValue(It.IsAny<int>(), It.IsAny<string>()))
    .Returns((int input, string prefix) => $"{prefix}_{input}");
mock.Setup(m => m.MethodWithReturnValue(It.Is<int>(i => i == 1), It.IsAny<string>()))
    .Returns((int input, string prefix) => $"special_{prefix}_{input}");

var result1 = mock.Object.MethodWithReturnValue(1, "prefix");
// matches the second setup, its return value is used
Assert.That(result1, Is.EqualTo("special_prefix_1"));

var result2 = mock.Object.MethodWithReturnValue(2, "prefix");
// doesn't match the second setup so it uses the return value of the first setup
Assert.That(result2, Is.EqualTo("prefix_2"));
```

```csharp{2-5, 7-9, 11-12, 14-18}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithReturnValue(Arg.Any<int>(), "prefix")
    .Returns(callInfo => $"{callInfo.Arg<string>()}_{callInfo.ArgAt<int>(0)}");
mock.MethodWithReturnValue(1, "prefix")
    .Returns(callInfo => $"special_{callInfo.Arg<string>()}_{callInfo.ArgAt<int>(0)}");

// fallback: ReturnsForAll is used to set the return value for all calls
// that don't have a specific setup (if the return type matches the generic)
mock.ReturnsForAll<string>("fallback");

// fallback: using the callInfo to create the return value
mock.ReturnsForAll<string>(callInfo => $"{callInfo.Arg<string>()}_{callInfo.Arg<int>()}");

// NOTE: the callbacks are invoked in the order they are defined
// the last return value is used as the return value of the method
// this can become problematic when using callbacks that have side effects (more on this later)
// as a workaround, use `Configure` to ensure previous callbacks do not run
// e.g. this is useful when previous callbacks throw exceptions
mock.Configure().MethodWithReturnValue(10, "prefix").Returns("prefix_10");

var result1 = mock.MethodWithReturnValue(1, "prefix");
// matches the second setup, its return value is used
Assert.That(result1, Is.EqualTo("special_prefix_1"));

var result2 = mock.MethodWithReturnValue(2, "prefix");
// doesn't match the second setup so it uses the return value of the first setup
Assert.That(result2, Is.EqualTo("prefix_2"));

var result3 = mock.MethodWithReturnValue(1, "other");
// doesn't match any setup, thus the fallback is used
Assert.That(result3, Is.EqualTo("other_1"));
```

### Async (Task) return value: `ReturnsAsync()` => `Returns()`

```csharp{2-3}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Setup(m => m.MethodWithReturnValueAsync(It.IsAny<long>()))
    .ReturnsAsync("output");

var result = await mock.Object.MethodWithReturnValueAsync(1);

Assert.That(result, Is.EqualTo("output"));
mock.Verify(x => x.MethodWithReturnValueAsync(It.IsAny<long>()), Times.Once());
```

```csharp{2-3}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithReturnValueAsync(default)
    .ReturnsForAnyArgs("output");

var result = await mock.MethodWithReturnValueAsync(1);

Assert.That(result, Is.EqualTo("output"));
await mock.ReceivedWithAnyArgs(1).MethodWithReturnValueAsync(default);
```

### Multiple return values: `SetupSequence().Returns()` => `Returns()`

```csharp{2-4}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.SetupSequence(m => m.MethodWithReturnValue(It.IsAny<int>()))
    .Returns("one")
    .Returns("two");

var result1 = mock.Object.MethodWithReturnValue(1);
var result2 = mock.Object.MethodWithReturnValue(2);
var result3 = mock.Object.MethodWithReturnValue(3);

Assert.That(result1, Is.EqualTo("one"));
Assert.That(result2, Is.EqualTo("two"));
Assert.That(result3, Is.Null);
```

```csharp{2-3}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.MethodWithReturnValue(default)
    .ReturnsForAnyArgs("one", "two");

var result1 = mock.MethodWithReturnValue(1);
var result2 = mock.MethodWithReturnValue(2);
var result3 = mock.MethodWithReturnValue(3);

Assert.That(result1, Is.EqualTo("one"));
Assert.That(result2, Is.EqualTo("two"));
// 👇 different from Moq, NSubstitute will return the last value for all subsequent calls
Assert.That(result3, Is.EqualTo("two"));
```

```csharp{2-4}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
// also supports multiple return values based on the input
mock.MethodWithReturnValue(default)
    .ReturnsForAnyArgs(callInfo => callInfo.Arg<int>().ToString(), callInfo => callInfo.Arg<int>().ToString());

var result1 = mock.MethodWithReturnValue(1);
var result2 = mock.MethodWithReturnValue(2);
var result3 = mock.MethodWithReturnValue(3);

Assert.That(result1, Is.EqualTo("1"));
Assert.That(result2, Is.EqualTo("2"));
Assert.That(result3, Is.EqualTo("3"));
```

## Callbacks: `Callback()` => `AndDoes()`

```csharp{3-8}:Moq.cs
var mock = new Mock<IMyDependency>();
var result = "";
mock.Setup(m => m.MethodWithReturnValue(It.IsAny<int>()))
    .Returns("output")
    .Callback((int x) =>
    {
        result = $"callback {x}";
    });

mock.Object.MethodWithReturnValue(1);

Assert.That(result, Is.EqualTo("callback 1"));
```

```csharp{3-9}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
var result = "";
mock
    .MethodWithReturnValue(default)
    .ReturnsForAnyArgs("output")
    .AndDoes(callInfo =>
    {
        result = $"callback {callInfo.Arg<int>()}";
    });

mock.MethodWithReturnValue(1);

Assert.That(result, Is.EqualTo("callback 1"));
```

### Callback for void methods (or methods without a defined result): `Callback()` => `When().Do()`

```csharp{3-7}:Moq.cs
var mock = new Mock<IMyDependency>();
var result = "";
mock.Setup(m => m.MethodWithReturnValue(It.IsAny<int>()))
    .Callback((int x) =>
    {
        result = $"callback {x}";
    });

mock.Object.MethodWithReturnValue(1);

Assert.That(result, Is.EqualTo("callback 1"));
```

```csharp{3-8}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
var result = "";
mock
    .WhenForAnyArgs(m => m.MethodWithReturnValue(default))
    .Do(callInfo =>
    {
        result = $"callback {callInfo.Arg<int>()}";
    });

mock.MethodWithReturnValue(1);

Assert.That(result, Is.EqualTo("callback 1"));
```

## Throwing Exceptions: `Throws()` => `When().Do(() => throw)`

```csharp{2-3}:Moq.cs
var mock = new Mock<IMyDependency>();
mock.Setup(m => m.Method())
    .Throws(new InvalidOperationException());

Assert.Throws<InvalidOperationException>(() => mock.Object.Method());
```

```csharp{2-3}:NSubstitute.cs
var mock = Substitute.For<IMyDependency>();
mock.When(w => w.Method())
    .Do((callInfo) => throw new InvalidOperationException());

Assert.Throws<InvalidOperationException>(() => mock.Method());
```

## Automate Migration

Because both syntaxes resemble each other, it is possible to use a couple of smart find and (RegExp) replace commands to help with the migration.
These are not perfect, but they can be an enoourmous boost to get you started, and migrate 80% of your codebase in a matter of minutes.

Here are a few that I used.
Before using them, make sure that you're working on a clean branch.

| Find                                                                                                          | Replace                                                             |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `using Moq`                                                                                                   | `using NSubstitute`                                                 |
| `new Mock<(.*)>\(\)`                                                                                          | `Substitute.For<$1>()`                                              |
| `Mock<(.*?)>`                                                                                                 | `$1`                                                                |
| `\.Setup\([\w\s]*=>[\w\s]*(.*)\)`                                                                             | `$1`                                                                |
| `\.ReturnsAsync\(`                                                                                            | `.Returns(`                                                         |
| `It\.IsAny`                                                                                                   | `Arg.Any`                                                           |
| `It\.Is`                                                                                                      | `Arg.Is`                                                            |
| `\.Object`                                                                                                    | `(be careful here as it may also replace other non-moq properties)` |
| `((\w+)\|(\w+\s+))\.Verify\([\w\s]*=>[\w\s]*\.(.*)\)((.*?)), Times.Never\(\)\)`                               | `await $1.DidNotReceive().$4)`                                      |
| `\.Verify\([\w\s]*=>[\w\s]*\.(.*)\)((.*?)),`                                                                  | `.DidNotReceive().$1)`                                              |
| `((\w+)\|(\w+\s+))\.Verify\([\w\s]*=>[\w\s]*\.(.*)\)((.*?)), Times\.(Once(\(\))?\|Exactly\((?<times>.*)\))\)` | `await $1.Received(${times}).$4)`                                   |
| `\.Verify\([\w\s]*=>[\w\s]*\.(.*)\)((.*?)), Times\.(Once(\(\))?\|Exactly\((?<times>.*)\))\)`                  | `Received(${times}).$1)`                                            |
| `new AutoMoqCustomization`                                                                                    | `new AutoNSubstituteCustomization`                                  |
| `using AutoFixture\.AutoMoq`                                                                                  | `using AutoFixture.AutoNSubstitute`                                 |

I based mine implementation of these expression on the following resources:

- https://github.com/AlbertoMonteiro/moq-to-nsubstitute
- https://github.com/moq/moq/issues/1374#issuecomment-1671241122

## Conclusion

In this cheat sheet, we've seen the syntax differences between Moq and NSubstitute, more specifically how to convert Moq code to NSubstitute code.
We've also touched on how to automate the migration of your codebase.

What I like about NSubstitute is that it's a lot more lightweight than Moq, and it doesn't require a lot of wrapping to mock interfaces.
This makes the syntax more compact and easier to read.

For more information on NSubstitute, take a look at the [NSubstitute documentation](https://nsubstitute.github.io/help/getting-started/).
