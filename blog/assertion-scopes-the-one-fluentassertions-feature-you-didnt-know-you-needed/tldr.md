With [Assertion Scopes](https://fluentassertions.com/introduction#assertion-scopes) provided by the [FluentAssertions](https://fluentassertions.com) library, we can group multiple assertions into a single "transaction".
This has the benefit that when a test fails, you are immediately presented with the bigger picture.
In contrast to not using them, where you have to re-execute the same test over and over again until all assertions are fixed.
Not only does this increase the developer experience, it also increases the productivity of you and your team.

## Example

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

## Output

```txt{2-6}
Error Message:
    Expected The person is created with the correct names to be "elaine",
    but "Elaine" differs near "Elaine" (index 0).

    Expected The person is created with the correct names to be "benes",
    but "Benes" differs near "Bennes" (index 0).
Stack Trace:
    ...
```
