---
title: How zod-fixture can help with your test setups
slug: how-zod-fixture-can-help-with-your-test-setups
description: Don't waste your energy and time by manually creating test fixtures, use zod-fixture to make this process a breeze.
date: 2022-09-05
tags: zod, testing, typescript
---

Previously we've seen how [zod](https://zod.dev) can [validate incoming HTTP requests and why that's helpful](../why-we-should-verify-http-response-bodies-and-why-we-should-use-zod-for-this/index.md).
In this blog post, we explore another use case for zod, in combination with [zod-fixture](https://github.com/timdeschryver/zod-fixture).

`zod-fixture` is a library that leverages a zod schema to generate new object instances that satisfy the configured schema.  
We'll discover why this is useful later, but before we dive into the test cases, let's first define a `zod` schema for a `Customer`. The `Customer` has a few properties and also has child objects for `address` and `pets`.

```ts:customer.model.ts
import { z } from 'zod';

export const CustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  birthday: z.date(),
  address: z.object({
   street: z.string(),
   city: z.string(),
   state: z.string(),
  }),
  pets: z.array(z.object({ name: z.string(), breed: z.string() })),
  totalVisits: z.number(),
});

export type Customer = z.infer<typeof CustomerSchema>;
```

Now, imagine having a test case that checks if a collection of customers is rendered on the page.

Traditionally, most test cases look like a variant of the next test case.
The important part here is at the top of the test, where you create the test fixtures that are used within the test.

```ts{9-26}
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { Customer } from './customer.model';

describe(AppComponent.name, () => {
   it('renders the result of customers', async () => {
     const customers: Customers[] = [
       {
         id: 1,
         name: 'Customer 1',
         birthday: '2001-01-01',
         totalVisits: 10,
         address: {...},
         pets: [...]
       },
       {
         id: 2,
         name: 'Customer 2',
         birthday: '2002-01-01',
         totalVisits: 20,
         address: {...},
         pets: [...]
       }
     ];

     await render(AppComponent, {
       providers: [
         {
           provide: AppService,
           useValue: {
             getCustomers: () => of(customers),
           },
         },
       ],
     });
     
     expect(await screen.findByText(customers[0].name, { exact: false })).toBeTruthy();
     expect(await screen.findByText(customers[1].name, { exact: false })).toBeTruthy();
   });
});
```

I see this a lot in codebases because it's just the simplest way of creating instances, but it also has a couple of drawbacks.

The biggest chunk of the test consists of creating test fixtures, in this case, customer instances.
I didn't even take the time to model the child object `address` and `pets` because of this.
This makes the test cases look bigger than one would expect.
Because of this, the essence of the test gets lost and it might take a while to understand the test case.

But that isn't the only problem.
What happens when the `Customer` model is updated? For example, when a property is added or removed?
With test setups like these, we need to update all the models.
This isn't very pleasant work, and it can also take some time to update.

As a counter measurement, we can introduce model factory methods to create the instances easier.
The refactored test looks as follows.
Instead of manually creating the customer instances, we invoke the `createCustomer` method to create a new customer instance.

```ts{9-12, 30-39}
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { Customer } from './customer.model';

describe(AppComponent.name, () => {
   it('renders the result of customers', async () => {
     const customers: Customers[] = [
       createCustomer(1),
       createCustomer(2)
     ];

     await render(AppComponent, {
       providers: [
         {
           provide: AppService,
           useValue: {
             getCustomers: () => of(customers),
           },
         },
       ],
     });

     expect(await screen.findByText(customers[0].name, { exact: false })).toBeTruthy();
     expect(await screen.findByText(customers[1].name, { exact: false })).toBeTruthy();
   });
});

function createCustomer(id: number): Customer {
   return {
     id: id,
     name: `Customer ${id}`,
     birthday: `200${id}-01-01`,
     totalVisits: 10*id,
     address: {...},
     pets: [...]
   }
}
```

This is already better, and it solves the mentioned problems, but in my experience, it still isn't ideal.

As developers we tend to over-engineer the boring stuff, so there's a chance that these factories get complicated.
More complicated than they need to be.

This beats the entire purpose of readable tests.
We don't want to spend minutes figuring out how the setup is done.

For example, we could end up with factories that expect a lot of arguments just to tweak the properties of the model.
Or worse, the factory contains complex conditions or structures to create an instance.
When this happens, we end up in a similar situation as before, where many test cases need to be updated when we just change the model contract, or the way a model behaves.

Now that we understand the problem, let's see how `zod`, specifically `zod-fixture`, can give us a hand to create test fixtures to keep the test setup as simple as possible.

Because `zod` holds the contracts of your models, we can make use of this data to generate the fixtures for your tests.
The easiest way to use `zod-fixture` is by invoking the `createFixture` method and passing the `zod` schema as the argument.
Before we put this in a test, let's first take a look at the output just to give us an idea of what `createFixture` does.

```ts
import { createFixture } from 'zod-fixture';
import { CustomerSchema } from './customer.model';

const customer = createFixture(CustomerSchema);

/*
   {
     "id": 106,
     "name": "name-b1d5c46c-ec89-4fd5-abdf-b263ae808b84",
     "birthday": "2021-01-11T23:58:00.091Z",
     "address": {
       "street": "street-a088e991-896e-458c-bbbd-7045cd880879",
       "city": "city-0a3d2843-5b32-48f0-99e4-bdda3c6ed531",
       "state": "state-b5f857d4-ccad-46ad-94da-4524ecc672ae"
     },
     "pets": [
       {
         "name": "name-27bdfe2e-2408-4fbe-b984-c5043211ec70",
         "breed": "breed-addd4dcb-0fa3-4682-af78-af7a32e03890"
       },
       {
         "name": "name-bf785f1c-e989-4ea7-97ac-9e9a9d629b1f",
         "breed": "breed-2c177585-7a22-4bef-a50f-a00182bdfdce"
       },
       {
         "name": "name-7ac981b0-4cc8-4236-9d76-642121b9bac3",
         "breed": "breed-0e156d71-5d81-4ffd-ad51-87a2c6baeea0"
       }
     ],
     "totalVisits": 372
   }
*/
```

The first thing you can see is that `createFixture` uses the schema to create an instance that complements the zod schema.

What isn't visible from this snippet is that you can't see that it does this randomly.
`zod-fixture` assigns a random value to all properties, but the shape always looks identical.

For example, a string always has the property name as a prefix, and collections always contain 3 items.
This makes it very convenient (and quick way) to new up instances at the start of a test case.

As you can see in the test below, it just takes 1 line of code to generate the `customers` test fixture.

```ts{11}
import { render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { z } from 'zod';
import { createFixture } from 'zod-fixture';
import { AppComponent } from './app.component';
import { AppService } from './app.service';
import { CustomerSchema } from './customer.model';

describe(AppComponent.name, () => {
   it('renders a collection of customers', async () => {
     const customers = createFixture(z.array(CustomerSchema));
     await render(AppComponent, {
       providers: [
         {
           provide: AppService,
           useValue: {
             getCustomers: () => of(customers),
           },
         },
       ],
     });

     expect(await screen.findByText(customers[0].name, { exact: false })).toBeTruthy();
     expect(await screen.findByText(customers[1].name, { exact: false })).toBeTruthy();
   });
});
```

## Conclusion

We've seen how `zod-fixture` helps us to keep the test setup to a bare minimum.

Instead of writing fixtures manually or writing code that does this for us, we can make use of the `createFixture` method which does the heavy lifting for us.

By using `zod-fixture`, we're also sure that the fixtures that are used within tests are also kept up-to-date with the zod schema, and thus also with the model interfaces that are used within the application.

While this blog post just shows the default behavior of `zod-fixture`, it's also possible to change the way how values get generated. If you're interested and what to know more, please take a look at the [docs](https://github.com/timdeschryver/zod-fixture).
