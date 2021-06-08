---
title: How to patch an HTTP Response with Cypress
slug: how-to-patch-an-http-response-with-cypress
description: A brief post on how to patch a part of an incoming HTTP response
author: Tim Deschryver
date: 2021-06-08
tags: testing, cypress
banner: ./images/banner.jpg
published: true
---

For most of our Cypress tests, we have a [seed for each test](/blog/reseed-your-database-with-cypress).a
However, this might lead to a lot of different data seeds, which can become an unmaintainable spaghetti bowl. Especially for large data objects that have one or more child relations.

As a solution, we can patch the incoming HTTP response by using the [intercept](https://docs.cypress.io/api/commands/intercept) and [reply](https://docs.cypress.io/api/commands/intercept#Providing-a-stub-response-with-req-reply) methods of Cypress.

This quick and easy fix eliminates the problem that we're oversaturating the codebase with data seeds.
I find this ideal for one-off tests or when you're not in total control of the (seeded) data.

In the following snippet, we see how we can change the username of a GitHub user in the test.
The code intercepts the HTTP request to the GitHub API and uses the response in the reply method to overwrite the username.

```ts
it('should path the response', () => {
	cy.intercept('GET', `https://api.github.com/users/timdeschryver`, (request) => {
		request.reply((response) => {
			response.body['login'] = 'fake-username';
			return response;
		});
	});

	cy.findByRole('heading', { name: /hello fake-username/i });
});
```

While the above example is very trivial, this solution allows us to quickly re-use an existing seed to test a specific business requirement. For example, to create a customer with overdue payments.

```ts
it('should warn when the customer has an overdue payment and makes a new order', () => {
	cy.intercept('GET', `/api/customers/*`, (request) => {
		request.reply((response) => {
			// reuse the first payment and convert it to an overdue payment
			const [payment] = response.body['payments'];
			payment.paymentDate = null;

			response.body['payments'] = [payment];
			return response;
		});
	});

	cy.findByRole('alert', { name: /account has an overdue payment/i });
});
```

We choose this solution because until recently our team was in total control of the customers' data, which encapsulates multiple domains.
While it was a chore to create a new customer seed, it was just a one-time task.
But now, we also had the requirement to read from a legacy system.
Instead of deploying a faked legacy system with test data, we choose to reuse the existing system and to patch the incoming responses. We think this is an elegant solution that requires less work, and this way we're also not required to learn and interact with the internals of the legacy system.
