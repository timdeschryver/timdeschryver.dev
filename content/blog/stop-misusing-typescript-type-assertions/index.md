---
title: Stop misusing TypeScript type assertions
slug: stop-misusing-typescript-type-assertions
description: Don't create a false sense of security by overusing type assertions, instead use type annotations and return types.
author: Tim Deschryver
date: 2021-10-18
tags: TypeScript
banner: ./images/banner.jpg
published: true
---

I'm writing this so you don't make the same mistake as our team.
Without knowing how much impact type assertions would have, our team started to use them everywhere.

This started out great.
We had type-safety in our code, and we felt safe to future changes.
At least, we thought so.

In retrospect, we now know that we had created a false sense of security.
We had created a safety net with a lot of holes, which defeats the purpose of having a safety net.

To give a simple example, a lot of our code to create a new instance of a type looked like this.

```ts
// inline
const customer = { customerId: newid(), name: 'Sarah' } as Customer;
// or a variant with angle brackets
const customer = <Customer>{ customerId: newid(), name: 'Sarah' };

// even better, via a factary method
function createCustomer(name: string) {
	return { customerId: newid(), names } as Customer;
}
```

The code has two problems concerning the correctness of these objects when the respective type is changed:

- new properties that are required aren't caught;
- existing properties that are removed aren't flagged;

The simple fix is to ditch the type assertions and to replace them with type annotations and return types.

```ts
// inline
const customer: Customer = { customerId: newid(), name: 'Sarah' };

// even better, via a factary method
function createCustomer(name: string): Customer {
	return { customerId: newid(), names };
}
```

With the updated snippet, we now get correct and helpful compile errors when the type is modified.

To enforce this practice, you can enable the ESLint rule [Enforces consistent usage of type assertions (consistent-type-assertions)](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/consistent-type-assertions.md).

Fiddle with this example in the following [TypeScript playground](https://www.typescriptlang.org/play?jsx=0#code/KYDwDg9gTgLgBASwHY2FAZgQwMbDgYQFcBnGCAWzTgG8AoOObEsyqASQBMAuOUqZAOYBuenAD0YxhUoo4MABYJiciL2B4FeBOTA4YopJko8+gkQwlxCSbNOCyFSlWo3ytOvaMtJgAdwAKUBBgPEiE5ABGaCIAvrS0tkikjMwUaAByEDAA8gDWAIxwALw0KaRp7NxwAORM5ayc1QA0cIbGNW3AzbxpjkgCAKIANsTAPNXVcDFwmMpE9dEJEEnwdSwZWXkATMVwADzz61AAfNRlR5zjaxWNLZ3jnd3EvYr9w6PjkzEiicnXrJkcrkACy7M7-NCXGoQyrde4dIxdKYzOapVg-ZZ-NEbIEAVl2B2xJ3BRKhtVJHDhiIeiK+GJW5wqgLyADYwT1KH1BiMxjUviirEhckgIL4kALDhUREsGTC8vkeJLWOyYWTVZS7tSEZQ6TKsQsoNtFUSVRSrhSqe1qo8Ws9Oa9uR8+VNpb8IENgAA6IYQAQAChJBrVFs1VseyNmBCJAEoRD6BEq0PKA9NI4moLHaPH08nAxcqtV8vy0zHpehrNgYAhlnB0Eh08yCn7ozRRFBgDBCFBxXmbgX1ZbedbabaXoJ3kPi6iDbF4uWbFWa3WG5tcltm62GO3O939unToyGv2Q60tcOdaP7eOeZ8XbQ4rR55Xq+Ll0Tk9HjQbN3Bt12e4ekLHkGGqnmGtJ3g+T6Lq+9bvmuzZfkcP5-ruvZHuaIGDjSF4ch2DoTre3z3nOFYwXA2ZEo2+R+jCPCYEgACeLZ0Awboet6vp+rRJolga0aep0mZQWRL4Ub6OZNnRUb8T+7FevGPEGoJiLCaRC5iZRBrbEpRz0UxLGiAg6BwH6SjprpFTRoZDBsZi7oKVxMIqZQmYMHEIkaTWWlHHkADMlmsPpzE-rMoywGwxAWTCblSEkDmcf6zlCbOj6iTW5lEoFaDBZ+gFQIg07Iaxv4dv+0IWog4owql0FiWFaAwJF0VErl9HEOFMDKDChUycVRkmX6ACEmUGtlGY2bZChBL4rR+HAAxQEEUB+gABgAglAAjhPY8AACTUDC0xOCK8CYPlQ2rbFHm0EAA).
