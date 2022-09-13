---
title: Using zod-fixture with MSW to generate mocked API responses
slug: using-zod-fixture-with-msw-to-generate-mocked-api-responses
description: Did you know that you could quickly set up a mocked API with the use of zod-fixture and MSW?
date: 2022-09-13
tags: zod, MSW, typescript, testing
---

In the last blog post we've already covered a use case for [zod-fixture](https://github.com/timdeschryver/zod-fixture) in [How zod-fixture can help with your test setups](../how-zod-fixture-can-help-with-your-test-setups/index.md). In this blog post, we're extending that idea by integrating zod-fixture with [Mock Service Worker (MSW)](https://mswjs.io/).

To give a small recap of what `zod-fixture` is, it's a library that makes use of a `zod` schema to generate instances that satisfy the shape of its schema.
Instead of thinking about the values an object must have and creating them manually, `zod-fixture` makes it easy to create new objects.

In most cases, as long as the object has the correct shape and the properties have the correct type, the actual value(s) don't matter that much.
For example, let's say the application fetches a collection of customers via an HTTP request and renders them on the page.
In this case it doesn't matter if the first name is an actual first name (e.g. "Sarah"), or if it's a generated one (e.g. "firstName-28a0c5ef-3bb9-4bb9-88b5-d7489058a570").
As long as it gets rendered we know that we have a working feature.

In this blog post, we see how to create a mocked API with MSW, in combination with zod-fixture to return randomly generated response models.

> Mock by intercepting requests on the network level. Seamlessly reuse the same mock definition for testing, development, and debugging. - [mswjs.io](https://mswjs.io/)

If this is the first time that you hear MSW, I encourage you to take a look at their docs just to get an idea of why it's useful.
Personally, I find MSW effective to create a new front-end feature without having a backend API up and running.
It can then also serve as a way to mock your services in test suites, as we've explored in [Using MSW (Mock Service Worker) in an Angular project](../using-msw-in-an-angular-project/index.md).

Let's have a look at a simple example, and render a collection of customers.

The first thing I start with is to define the interface of the needed models, in this case, a `Customer` model.
Because we're using `zod`, we do this by using the `z` utility methods.
The benefit of this, in contrast to defining a "normal" TypeScript interface, is that we also have a schema that holds the meta-data of these contracts at runtime.

```ts:models/customer.ts
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

Once the model is defined, we can use its schema within an MSW Rest handler to generate a response object.
In our example, we pass the a `CustomerSchema` to the `createFixture` method of zod-fixture to generate a collection of customers.

```ts{7-10}:mocks/customer.handler.ts
import { setupWorker, rest } from 'msw';
import { z } from 'zod';
import { createFixture } from 'zod-fixture';
import { CustomerSchema } from '../models/customer';

export const handlers = [
    rest.get('/api/customers', (req, res, ctx) => {
        const customers = createFixture(z.array(CustomerSchema));
        return res(ctx.json(customers));
    }),
];

export const worker = setupWorker(...handlers);
```

Now, every time the application hits the customer's endpoint (`/api/customers`), it gets intercepted by the handler, which returns a new mocked response.
As you can notice from an example response below, the customers are randomly generated but follow a few conventions, for example, the prefix of a string is always the property name, and a collection always has 3 items. It's possible to tweak the default behavior, but this falls out of the scope of this blog post.

```json
[
	{
		"id": 106,
		"name": "name-b7fb9fce-7f8d-454a-8a11-a19fed45205e",
		"birthday": "2022-10-02T00:08:39.500Z",
		"address": {
			"street": "street-6f0e0a92-bb4e-40e3-b0ab-4aaabfeb7064",
			"city": "city-ee8048f8-1710-4fce-ad59-1bfb6944c5fd",
			"state": "state-e5a67dc8-fc30-4514-bbf3-41ba33f43b7f"
		},
		"pets": [
			{
				"name": "name-f7bb7cb0-8253-4f50-9b60-547bdee952d0",
				"breed": "breed-f40e7bbb-f2d5-433e-8439-4048a51f55df"
			},
			{
				"name": "name-27f93c74-a942-4f43-837e-7bea9507a359",
				"breed": "breed-aff7f6ab-a270-4d94-9241-e9c7931843ec"
			},
			{
				"name": "name-87452301-7eb0-4db3-84de-71da51ae41fd",
				"breed": "breed-abd0c7b5-08c9-4504-acf4-fa63629619b7"
			}
		],
		"totalVisits": 290
	},
	{
		"id": 375,
		"name": "name-456f982b-cb1e-4e19-8f8a-28e14ec5dbbd",
		"birthday": "2022-09-14T11:52:39.869Z",
		"address": {
			"street": "street-ac2b41a7-5dd7-459e-8838-34cf1b65b070",
			"city": "city-1ddd9395-885f-47c3-8559-d4acb8069d58",
			"state": "state-ebc14ff3-2c44-4f31-8df6-d2af984eabec"
		},
		"pets": [
			{
				"name": "name-69e6c95f-5696-4402-bc97-37809861826c",
				"breed": "breed-7ec1d225-f790-4134-aba5-9afcea6b0da1"
			},
			{
				"name": "name-3622ca6c-4e08-432d-ae62-a21dc77725c6",
				"breed": "breed-ff23b885-dc7b-49dc-aede-f64be2d24b6c"
			},
			{
				"name": "name-5de7015d-6922-42df-b733-d6c6bafe2e54",
				"breed": "breed-9446ed34-01f7-4768-a4f5-b9df6328ade6"
			}
		],
		"totalVisits": 263
	},
	{
		"id": 6,
		"name": "name-10a3bfb3-dfa8-42e2-bcd7-b26c8be15d7b",
		"birthday": "2022-08-26T15:01:59.194Z",
		"address": {
			"street": "street-d9c0b615-49b6-4289-a74a-d82a5a460df5",
			"city": "city-17bcb8d8-a56e-408e-ac8e-0e720e2fae76",
			"state": "state-d86ced3d-83de-427c-938a-24fbf884a9b1"
		},
		"pets": [
			{
				"name": "name-740e81e6-41fb-4461-abcc-6072eff3bee1",
				"breed": "breed-0ddae151-26bc-4d73-b295-8781ec62cc11"
			},
			{
				"name": "name-78e11711-e67c-4ef2-bfb5-c55f47bb8195",
				"breed": "breed-20480c54-1b8c-400b-ab7e-c4693d8b0241"
			},
			{
				"name": "name-b71807a7-24c2-43c5-9925-d486c3872d2a",
				"breed": "breed-b77ffa84-0639-49c1-89ec-36420b151807"
			}
		],
		"totalVisits": 326
	}
]
```

And that's it, we've successfully created an MSW handler that uses zod and zod-fixture to create response models!

## Conclusion

I don't like to spend time creating response objects and thinking of the values I give to these objects.
Once I believed that all of the data must be real, and I would spend (a lot of) time creating and maintaining this data.
Over the years I learned that there's no such thing as perfect test data and that using the shape is crucial to create working applications.

That's why I like to use zod-fixture because it generates this data for me.
This way, I don't have to spend time thinking about what to return anymore and I can give more focus to the implementation of a feature.

zod-fixture in combination with MSW is a powerful combination because it allows me to have a mocked API, which can be consumed by the application when it's under development, and by the tests, we write to verify that the application is working as intended.

You'll also see that by using MSW, the rest of the application doesn't change.
If you're working with Angular, this means that there's probably a component that consumes a service that fires HTTP requests with the `HttpClient`.
Within the test cases, the HTTP client or the service doesn't need to be mocked as it does with "traditional" tests that don't use MSW.
Because the HTTP requests are intercepted the actual API isn't hit and you don't create a dependency on the actual API.
This practice means that your tests won't be slowed down and that you could create and test your frontend feature independently from the backend.

https://twitter.com/tim_deschryver/status/1569305324305121283
