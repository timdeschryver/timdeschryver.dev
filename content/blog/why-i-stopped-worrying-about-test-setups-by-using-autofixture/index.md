---
title: Why I stopped worrying about test setups by using AutoFixture
slug: why-i-stopped-worrying-about-test-setups-by-using-autofixture
description: A model is always changing, but that shouldn't be the concern of your tests
author: Tim Deschryver
date: 2021-06-21
tags: .NET, testing, architecture
banner: ./images/banner.jpg
published: true
---

The next project I'm setting up will use AutoFixture from the start to set up the "arrange" part of a test and here is why.

When a new project is in the start-up phase all models are relatively small, simple, and do not have a lot of relations.
This makes the tests easy to arrange and also easy to read. Because the team is mostly spending their time implementing new features, there's a lot of focus on writing new tests for these new features. For every feature, there are one or more tests that go with that feature.

Throughout the lifetime of the project, these models keep on growing, making it harder to write new tests, sadly
the existing tests are starting to feel like a chore to maintain.

Once the basic functionality is developed, the team is also maintaining the existing codebase and thus new features (from scratch) are less developed. Instead, the behavior of the application is extended step by step.
These smaller changes feel to have a lower impact, resulting that fewer tests are written.
The existing tests also receive less attention.

Because of the current state of the project, a failing test only receives attention when it's failing. With every addition, things are getting worse.

At some point, arranging a test might even be the trickiest part of the test.
Worse, when the requirements change, we might lose the confidence the tests were giving us previously because they're not kept up to date.  
The team is forced to change the application's code and the test code in one single go. When this point is reached, it's usually too late and the team wonders when things were starting to go downhill.

From my experience, a good test setup is a crucial factor that makes a test easy and fast to write (and to maintain), otherwise, a bad test setup makes the tests feel like an unpleasant chore to maintain which is a loss of time. This is caused because the tests are too much coupled to the application's codebase.
Another point that makes unit tests hard to maintain are those tests that are testing implementation details, which is why I prefer to write [integration tests](/blog/how-to-test-your-csharp-web-api) but that's not what this blog post is about.

Since a model is always changing, ideally want our test setups (fixtures) to be up-to-date at all times, but that shouldn't be the concern of the tests. As a remedy, we can use the [AutoFixture library](https://github.com/AutoFixture/AutoFixture).

> Write maintainable unit tests, faster.
> AutoFixture makes it easier for developers to do Test-Driven Development by automating non-relevant Test Fixture Setup, allowing the Test Developer to focus on the essentials of each test case.

## The Problem with Test Setups

Let's take a look at an example.
In the example, a team starts with a simple customer object that we keep enhancing to answer the requirement changes.

After the first iteration, the customer has an id and a name. Nice and simple.

```cs:Customer.cs
record Customer(Guid CustomerId, string FirstName, string LastName);
```

Since this is just the beginning, creating a fixture is easy and thus is the customer manually created in the test.

```cs{4}:CustomerTests.cs
[Fact]
public void Creates_a_customer_when_valid()
{
    var customer = new Customer(Guid.NewGuid(), "Sarah", "Dubois");

    // act: create customer
    // assert: verify customer has been created
}
```

Of course, the customers' system can also update and delete customers so this test setup is copy-pasted across multiple tests.

We're a couple days further and the customer needs to be extended with an address.

```cs:Customer.cs
record Customer(Guid CustomerId, string FirstName, string LastName, Address Address);
record Address(Guid AddressId, string Street, string PostalCode);
```

To accommodate this change, the team has to go back to all of the created tests and provide an address to every customer.
Yikes.

```cs{4-5}:CustomerTests.cs
[Fact]
public void Creates_a_customer_when_valid()
{
    var address = new Address(Guid.NewGuid(), "Place Georges-Pompidou 3", "75004 Paris");
    var customer = new Customer(Guid.NewGuid(), "Sarah", "Dubois", address);

    // act: create customer
    // assert: verify customer has been created
}
```

After this abrupt change, the team decides that they won't be bitten by future changes to the model.
That's why they resort to battle-tested design patterns to create their test fixtures.
For example, by using a factory method or by using the builder pattern to create new instances of the customer.

```cs{4-7}:CustomerTests.cs
[Fact]
public void Creates_a_customer_when_valid()
{
    // With a factory method
    var customer = CustomerHelpers.CreateCustomer();
    // With the builder API
    var customer = new CustomerBuilder().Build();

    // act: create customer
    // assert: verify customer has been created
}
```

After the team refactored the tests, they are confident that their tests are robust against future model changes.
What they don't realize is that this code needs to be maintained and that it needs to reflect model changes.
Sadly, this isn't always as simple as it seems.

Let's make another change that affects the customer model.
This time, a collection of orders are added to the customer's model.

```cs:Customer.cs
record Customer(Guid CustomerId, string FirstName, string LastName, Address Address, IEnumerable<Order> Orders = default);
record Address(Guid AddressId, string Street, string PostalCode);
record Order(Guid OrderId, string ProductSku, int Amount);
```

Because the orders are optional, the developer forgets to update the test fixtures and thus these are out of sync.
Luckily, another team member notices this and asks if the fixtures can be updated.
The developer now has to make a choice, should all customers have orders by default, should there be two different implementations, ...?

While this example is kept simple, I hope you get the point I'm trying to make here. There's even a chance that you've already experienced this in a real project.
Maintaining test fixtures can be hard and time-consuming (having discussions with team members, having to write the code).
Besides that, the test setup alone could take up a whole lot of lines of code.

## AutoFixture

Now that we've seen the problem, let's see how AutoFixture provides a solution.

If you're not familiar with AutoFixture, the short version (as the name implies) is that the library automagically creates test fixture instances (known as specimens) for your objects with random test data. To be honest "random data" is not the correct term to use here, [Constrained Non-Deterministic](https://blog.ploeh.dk/2009/03/05/ConstrainedNon-Determinism/) data with [Explicit Expectations](https://blog.ploeh.dk/2009/03/11/ExplicitExpectations/) would be a much better term. For example, you will notice that string properties have the property name postfixed with a GUID as value, that numbers are always positive, and there are always 3 items in a collection.

> Values are carefully generated to stay far away from any boundary conditions that may cause the SUT to behave differently in each test run.

Let's refactor the customer tests by using some of AutoFixture's features.
To create the customer with AutoFixture, the first thing to do is to create a new `Fixture` instance.
Next, you can use the `Create` method to create an instance of a generic, in our example, a customer.

```cs{4-5}:CustomerTests.cs
[Fact]
public void Creates_a_customer_when_valid()
{
    var fixture = new Fixture();
    var customer = fixture.Create<Customer>();

    // act: create customer
    // assert: verify customer is created
}
```

This gives us the following customer's value, which does change every time the test is run.
As you can see below, all properties of the `Customer` object have a random value, even the nested `Address` and `Orders` objects.

```json
{
	"CustomerId": "3b135dee-02f7-4e9b-9f15-7d5a79be460e",
	"FirstName": "FirstName12320bc0-af71-4c81-bbf2-c468bdd9c0d9",
	"LastName": "LastNamee46a8443-dcb0-41db-bc0b-331d8d7ba3cf",
	"Address": {
		"AddressId": "d251d392-200f-4cd8-a6f9-f51d2bb0adf0",
		"Street": "Street81928752-4964-4816-b4cb-5624f54bae3c",
		"PostalCode": "PostalCode959b3d36-1712-4f84-8a03-eb57427bca09"
	},
	"Orders": [
		{
			"OrderId": "de76756f-6c00-4707-9d8d-f883b802c44f",
			"ProductSku": "ProductSkub905315a-a578-40c0-bf1a-023d5d2f6d02",
			"Amount": 60
		},
		{
			"OrderId": "b36a7f67-c980-45ec-955a-0a03beb78e79",
			"ProductSku": "ProductSkuacd3cdb4-1ab4-42e1-8a47-807131ae73ab",
			"Amount": 100
		},
		{
			"OrderId": "bbd78fa6-d318-486d-a924-4b529dcbae9f",
			"ProductSku": "ProductSku8348eca4-a98e-45c2-9c15-3d92202b9708",
			"Amount": 29
		}
	]
}
```

To completely remove the arrange part of the test, we can install the package [AutoFixture for XUnit](https://www.nuget.org/packages/AutoFixture.Xunit2/) or [AutoFixture for NUnit](https://www.nuget.org/packages/AutoFixture.NUnit3/). These packages provide an `AutoData` attribute that creates the fixtures for us. To use them, change the test from a `Fact` to a `Theory` and inject a customer as a parameter.

```cs{2-3}:CustomerTests.cs
[Theory]
[AutoData]
public void Creates_a_customer_when_valid(Customer customer)
{
    // act: create customer
    // assert: verify customer is created
}
```

We end up with a test that is clean and only contains the important parts.
With a single blink of an eye, we can read the test.

But Tim, how do you test specific requirements when everything is non-deterministic?

### Influence test generation

The answer to that question doesn't have to be complicated.
In fact, AutoFixture is designed so that 80% of created specimens don't need a manual touch from a developer.
For those cases where it's needed, you can simply overwrite the generated object in the test.

```cs{4}:CustomerTests.cs
[Theory, AutoData]
public void Creates_a_customer_when_valid(Customer customer)
{
    customer.Orders = new List<Order>();

    // act: create customer
    // assert: verify customer is created
}
```

This keeps things simple and it's a good way to become familiar with AutoFixture.
On the other hand, it doesn't provide a complete answer to the [problem](#the-problem).
While the current implementation keeps testing models in sync with the application code and is fast to set up, it still doesn't keep the tests DRY.

### Customize fixtures

Overwriting properties in a single test is perfect for one-off tests but for it to be a sustainable solution, we must take a deeper dive into the API of AutoFixture.

With Customizations, it becomes possible to hook into the generation process of an object.
We're going to continue to use the XUnit's parameterized tests, and create an `AutoDataAttribute` to provide the parameters to the test.
If you're not a fan of parameterized tests, you can also extend the fixture inline in a similar way.

To customize the customer from our example, we use the builder API from AutoFixture to give the important properties a specific value.
Use the `With` method for each property that has to be overwritten, and assign it a value.
In the example below, we create a `NoOrdersDataAttribute` that contains a customer that has 0 orders.

```cs:NoOrdersDataAttribute.cs
 public class NoOrdersDataAttribute : AutoDataAttribute
{
    public NoOrdersDataAttribute() : base(() => {
        var fixture =  new Fixture();
        fixture.Customize<Customer>(transform => transform
                    .With(cust => cust.Orders, new List<Order>())
                    .With(cust => cust.FirstName, "Tim"));
        return fixture;
    }) { }
}
```

A customization is composable, therefore we can refactor the above snippet into a reusable customization.
To accomplish this, we create a custom customization class that implements the `ICustomization` interface.

```cs{5-7}:NoOrdersCustomization.cs
public class NoOrdersCustomization : ICustomization
{
    public void Customize(IFixture fixture)
    {
        fixture.Customize<Customer>(transform => transform
            .With(cust => cust.Orders, new List<Order>())
            .With(cust => cust.FirstName, "Tim"));
    }
}
```

Next, we can use `NoOrdersCustomization` to customize the fixture by replacing the inline customization with the new `NoOrdersCustomization` class.

```cs{3}:NoOrdersDataAttribute.cs
public class NoOrdersDataAttribute : AutoDataAttribute
{
    public NoOrdersDataAttribute() : base(() => new Fixture().Customize(new NoOrdersCustomization())){ }
}
```

Finally, this attribute can be used in the tests to create new customers that have no orders.

```cs{2-3}:CustomerTests.cs
[Theory]
[NoOrdersData]
public void Creates_a_customer_when_valid(Customer customer)
{
    // customer.Orders is now an empty collection

    // act: create customer
    // assert: verify customer is created
}
```

Just with everything, it's important to give a proper name to your customizations and attributes.

### Specimens

Another powerful way to hook into AutoFixture's generation, are specimens.
A specimen allows for a more generic approach to impact the generated data.

For example, if we want to prefix all product SKU's, we can implement this as a specimen.

To do so, create a new class and implement the `ISpecimenBuilder` interface.
Every generated object passes through this builder.
Via reflection, we're looking for properties with the name `ProductSku`.
If we find that property, the desired value is returned, otherwise, a new `NoSpecimen` instance is returned.
By doing this, AutoFixtures knows if the property already has a user-defined value or if it needs to generate a value for that property.

```cs:ProductSkuSpecimenBuilder.cs
public class ProductSkuSpecimenBuilder : ISpecimenBuilder
{
    public object Create(object request, ISpecimenContext context)
    {
        return request switch {
            PropertyInfo { Name: "ProductSku" } p when p.PropertyType  == typeof(string) => $"Sku-{context.Create<string>()}",
            _ => new NoSpecimen()
        };
    }
}
```

The last thing to do is to add the `ProductSkuSpecimenBuilder` to the fixture created in the `NoOrdersDataAttribute`.

```cs{6}:NoOrdersDataAttribute.cs
public class NoOrdersDataAttribute : AutoDataAttribute
{
    public NoOrdersDataAttribute() : base(() => {
        var fixture = new Fixture();
        fixture.Customize(new NoOrdersCustomization());
        fixture.Customizations.Add(new ProductSkuSpecimenBuilder());
        return fixture;
    }) { }
}
```

## Extra Tips

### Generating multiple models

Some tests need multiple generated instances, therefore, a parametrized test can have multiple parameters.

```cs{3}:CustomerTests.cs
[Theory]
[AutoData]
public void Creates_a_customer_when_valid(Customer customer1, Customer customer2, SomethingElse something)
{
}
```

### Composite Customizations

Create a `CompositeCustomization` to combine multiple customizations into one.

```cs:CustomerWithNewOrdersAndOutstandingAcounts.cs
public class CustomerWithNewOrdersAndOutstandingAcounts : CompositeCustomization
{
    public CustomerWithNewOrdersAndOutstandingAcounts()
        : base(new CustomerWithOrdersCustomization(), new CustomerWithOutstandingAcounts()) { }
}
```

## Conclusion

Because AutoFixture does all of the heavy liftings for me, I stopped overthinking my test setups and I have more time to implement new features.

Most of the properties of an object don't affect the business logic, thus these can just be ignored during the test setup.
This drastically reduced the noise of my tests, and I was able to remove a lot of test setup code.
Because there's a low coupling between the application code and test code, it also means that I don't have to go back to my tests every time a model is refactored.

The default generated model is perfect for quick and simple test cases, while the model can still be overwritten in a clean way for specific test cases. The customizations are a great way to create default prerequisites of a model in complex domains.

Since there's only a little bit of documentation that can be found in the AutoFixture repository, I really liked and learned a lot from the [blog posts](https://blog.ploeh.dk/tags/#AutoFixture-ref) written by [Mark Seemann](https://twitter.com/ploeh), who is also the creator of AutoFixture. So definitely make sure to check those out!

Lastly, here are some highlights of why I think you should be using AutoFixture as a test fixture builder:

- tests remain clean and focused; the requirements are clearly visible
- low coupling between test code and application code; application code can change without having an impact on the existing tests
- test setup code doesn't need to be discussed, implemented, nor maintained; the defaults values of AutoFixture provide a good baseline that can be patched where needed, you also don't need to reflect on providing proper test data because constrained non-deterministic data is everything you need for your test data
- AutoFixture's API is extensible for manual overwrites; properties can be overwritten with Customizations and SpecimenBuilders. For specific one-off tests, the object under test can be overwritten in the test
- it can detect quirks in your application code that you haven't thought of; can your application handle unexpected user inputs?
- it's a quick and simple way to explore a new code base that has little to no tests; if you don't know the domain and the relations between the models, it's hard to provide test data. Luckily this is one of the strong points of AutoFixture, providing fixture
