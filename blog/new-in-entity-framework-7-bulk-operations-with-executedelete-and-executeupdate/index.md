---
title: 'New in Entity Framework 7: Bulk Operations with ExecuteDelete and ExecuteUpdate'
slug: new-in-entity-framework-7-bulk-operations-with-executedelete-and-executeupdate
description: Exploring the new `ExecuteDelete` and `ExecuteUpdate` methods that were introduced in Entity Framework.
date: 2022-08-16
tags: dotnet, entity framework, sql
---

Version 7 of Entity Framework includes some popular features that have been asked for, one of which is Bulk Operations.
This feature came to my attention from a [tweet](https://twitter.com/julielerman/status/1557743067691569156) by [Julie Lerman](https://twitter.com/julielerman), and I had to try it out for myself.

https://twitter.com/julielerman/status/1557743067691569156

## Why

So why is this feature needed if we already can update and delete entities?
The key word here is performance. This is a theme that has been on the top of the list when it comes to new EF versions, and this time it is no different.

The added methods improve the performance in multiple ways.
Instead of first retrieving the entities and having all the entities in memory before we can perform an action on them, and lastly committing them to SQL. We now can do this with just a single operation, which results in one SQL command.

Let's take a look at how this looks like in code.

## Setting the stage

Before we dive into the examples, let's first set up our SQL database and populate 3 tables:

- one to hold persons
- another one is for addresses (a person has an address)
- and the last one to store pets (a person has a collection of pets)

```cs
using Microsoft.EntityFrameworkCore;

using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);
}

static void SetupAndPopulate(NewInEFContext context)
{
    context.Database.EnsureDeleted();
    context.Database.EnsureCreated();
    context.Persons.AddRange(Enumerable.Range(1, 1_000).Select(i =>
    {
        return new Person
        {
            FirstName = $"{nameof(Person.FirstName)}-{i}",
            LastName = $"{nameof(Person.LastName)}-{i}",
            Address = new Address
            {
                Street = $"{nameof(Address.Street)}-{i}",
            },
            Pets = Enumerable.Range(1, 3).Select(i2 =>
            {
                return new Pet
                {
                    Breed = $"{nameof(Pet.Breed)}-{i}-{i2}",
                    Name = $"{nameof(Pet.Name)}-{i}-{i2}",
                };
            }).ToList()
        };
    }));

    context.SaveChanges();
}

public class NewInEFContext : DbContext
{
    public DbSet<Person> Persons { get; set; }
    public DbSet<Pet> Pets { get; set; }
    public DbSet<Address> Addresses { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options
            .UseSqlServer("Connectionstring");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Address>()
           .Property<long>("PersonId");

        modelBuilder.Entity<Pet>()
            .Property<long>("PersonId");
    }
}

public class Person
{
    public long PersonId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public Address? Address { get; set; }
    public List<Pet> Pets { get; set; } = new List<Pet>();
}

public class Address
{
    public long AddressId { get; set; }
    public string Street { get; set; } = "";
}

public class Pet
{
    public long PetId { get; set; }
    public string Breed { get; set; } = "";
    public string Name { get; set; } = "";
}
```

## `ExecuteDelete` and `ExecuteDeleteAsync`

Now that we got that out of our way, let's dive into `ExecuteDelete` and `ExecuteDeleteAsync`.

To delete a set of entities in bulk, filter out the entities that you want to delete by using the `Where` method (this is similar to before).
Then, invoke the `ExecuteDelete` method on the collection of entities to be deleted.

```cs{5-7}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    context.Pets
           .Where(p => p.Name.Contains("1"))
           .ExecuteDelete();
}
```

Let's also take a look at the SQL statement that this generates:

```sql
DELETE FROM [p]
FROM [Pets] AS [p]
WHERE [p].[Name] LIKE N'%1%'
```

As you can see, it simply generates one SQL statement to delete the entities that match the condition.
The entities also aren't kept in memory anymore.
Nice, simple, and efficient!

### Cascade delete

Let's take a look at another example, and let's remove some persons that hold references to addresses and pets.
By deleting the person, we also delete the address and pets because the delete statement cascades to the foreign tables.

```cs{5-7}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    context.Persons
           .Where(p => p.PersonId <= 500)
           .ExecuteDelete();
}
```

Similar to before, this results in the following SQL statement:

```sql
DELETE FROM [p]
FROM [Persons] AS [p]
WHERE [p].[PersonId] <= CAST(500 AS bigint)
```

### Number of rows affected

It's also possible to see how many rows were affected by the delete operation, `ExecuteDelete` returns the number of rows affected.

```cs{5-8}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    var personsDeleted =
        context.Persons
           .Where(p => p.PersonId <= 100)
           .ExecuteDelete();
}
```

In the expression above, the `personsDeleted` variable is equal to 100.

## `ExecuteUpdate` and `ExecuteUpdateAsync`

Now that we've seen how to delete entities, let's explore how to update them.
Just like `ExecuteDelete`, we first have to filter the entities that we want to update, and then invoke `ExecuteUpdate`.

To update entities we need to use the new `SetProperty` method.
The first argument of `SetProperty` selects the property that has to be updated via a lambda, and the second argument is the new value of that property also by using a lambda.

For example, let's set the last name of the persons to "Updated".

```cs{5-7}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    context.Persons
           .Where(p => p.PersonId <= 1_000)
           .ExecuteUpdate(p => p.SetProperty(x => x.LastName, x => "Updated"));
}
```

Which results in the corresponding SQL statement:

```sql
UPDATE [p]
    SET [p].[LastName] = N'Updated'
FROM [Persons] AS [p]
WHERE [p].[PersonId] <= CAST(1000 AS bigint)
```

We can also access the values of an entity and use that to create a new value.

```cs{5-7}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    context.Persons
           .Where(p => p.PersonId <= 1_000)
           .ExecuteUpdate(p => p.SetProperty(x => x.LastName, x => "Updated" + x.LastName));
}
```

Resulting in the following SQL statement:

```sql
UPDATE [p]
    SET [p].[LastName] = N'Updated' + [p].[LastName]
FROM [Persons] AS [p]
WHERE [p].[PersonId] <= CAST(1000 AS bigint)
```

### Updating multiple values at once

We can even update multiple properties at once by invoking `ExecuteUpdate` multiple times.

```cs{5-9}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    context.Persons
           .Where(p => p.PersonId <= 1_000)
           .ExecuteUpdate(p =>
                p.SetProperty(x => x.LastName, x => "Updated" + x.LastName)
                 .SetProperty(x => x.FirstName, x => "Updated" + x.FirstName));
}
```

And again, the corresponding SQL statement:

```sql
UPDATE [p]
    SET [p].[FirstName] = N'Updated' + [p].[FirstName],
    [p].[LastName] = N'Updated' + [p].[LastName]
FROM [Persons] AS [p]
WHERE [p].[PersonId] <= CAST(1000 AS bigint)
```

### Number of rows affected

Just like `ExecuteDelete`, `ExecuteUpdate` also returns the number of rows affected.

```cs{5-8}
using (var context = new NewInEFContext())
{
    SetupAndPopulate(context);

    var personsUpdated =
        context.Persons
           .Where(p => p.PersonId <= 1_000)
           .ExecuteUpdate(p => p.SetProperty(x => x.LastName, x => "Updated"));
}
```

Note that updating nested entities is not supported.

## More Updates in Entity Framework 7

For the complete list of new features, see the [EF 7 plan](https://docs.microsoft.com/en-us/ef/core/what-is-new/ef-core-7.0/plan).
