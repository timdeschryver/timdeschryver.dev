---
title: Why we should verify HTTP response bodies, and why we should use zod for this
slug: why-we-should-verify-http-response-bodies-and-why-we-should-use-zod-for-this
description: Let's explore zod together and see it can be useful to create a safer enviroment by parsing HTTP response bodies.
author: Tim Deschryver
date: 2022-07-04
tags: Angular, Libraries, zod
banner: ./images/banner.jpg
published: true
---

Okay, it's time to take a look at [zod](https://github.com/colinhacks/zod).
The first time I encountered zod was because it was a recommendation on the GitHub dashboard, the second time was the nomination for the [OS awards](https://osawards.com/javascript/) for the "Productivity Booster" category.
Initially, I had neutral impressions about this library, but it clicked after having a conversation with a colleague.

The colleague raised the question of why we don't validate the response bodies of our HTTP requests.
The main reason was that, if the backend does this for its input, then why shouldn't it be done in the frontend?
This was coming after having fixed a few issues because the types on the backend and the front end have become outdated.

After giving it some thought, I have to agree with him.
Though the reasons why are different.
On the backend, we want to validate the input (the source, and the content) because everyone can send a request.
In the front end, the source is already trusted, but we want to [parse](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/) the content. This is to be notified about any discrepancies we don't expect.

If you want to manually "parse" a response body, things can quickly become messy, involve a lot of code, and you still have to maintain and keep the interface and the validation logic in sync.

This is where I think zod is a game-changer.

> Zod is a TypeScript-first schema declaration and validation library. I'm using the term "schema" to broadly refer to any data type, from a simple string to a complex nested object.
>
> Zod is designed to be as developer-friendly as possible. The goal is to eliminate duplicative type declarations. With Zod, you declare a validator once and Zod will automatically infer the static TypeScript type. It's easy to compose simpler types into complex data structures.

Let's take a look at some code.

## The issue with the traditional approach

To start things off, let me first describe where things could go wrong.
As an example, the following snippets contain code to retrieve a user within an Angular application using the HTTP client.

Before diving into the service and the component, we first need to define the `User` interface.

```ts
export interface User {
	id: number;
	name: string;
	username: string;
	email: string;
	phone: string;
	website: string;
}
```

This interface is used in the application to add a type to the inputs and outputs of the methods.
In the snippet below, the Angular service is created to start an HTTP request to retrieve the user's information.
The `User` interface is used to add the type of the response, an `Observable<User>`.

```ts{11-13}:user.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {User} from "./user.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${id}`);
  }
}
```

Next, the service is invoked within the component.
Within the component, we don't need to explicitly add the `User` interface because `userService.getUser()` is statically typed and thus knows that the returned value is a `User`.

```ts{12-16}:app.component.ts
import {Component} from '@angular/core';
import {map} from "rxjs";
import {UserService} from "./user.service";

@Component({
  selector: 'app-root',
  template: `
    <pre>{{ user$ | async | json }}</pre>
  `
})
export class AppComponent {
  user$ = this.userService.getUser(1).pipe(map(user => {
    return {
      name: `${user.name.trim()} (${user.username.toLocaleLowerCase()})`,
    }
  }));

  constructor(private userService: UserService) {}
}
```

Most of the time, this code just works.
But did you spot situations where this could potentially fail?
If you have been in a similar situation, you have probably spotted the problem.

When the `name` or `username` property is `null` or `undefined` this code throws an error.

```ts
`${user.name.trim()} (${user.username.toLocaleLowerCase()})`;
```

Another reason why this code could fail is when the server returns another object, or when we've used the wrong type within the Angular service by accident. This can quickly happen but can take more time than expected to spot the root cause of the problem.

In a way, TypeScript offers us a false sense of security.
TypeScript is a statically typed language, but its runtime objects could be anything.
This is a common mistake, and we've all bumped against it.

Now that we know the potential issues, let's explore how zod can offer a solution.

## The solution by introducing zod into the codebase

### Creating a zod schema

Just like before, let's start to define the `User` interface, this time by using `zod`.

Instead of directly defining the interface, we're obligated to create a schema first.
Just like the interface, the schema holds the contract of the `User`.
The difference between the two is that we're now using the zod utilities (`zod.string()`, `zod.number()`) instead of the types that TypeScript provides.

Also, the schema is not an interface nor a type, but it's a variable.
To use it as a type, we'll have to convert it into a type.
Luckily, zod also has a helper method (`zod.infer()`) to do this.

There's still one more difference between the two.
The interface becomes a type and is inferred based on the schema.

```ts:user.model.ts
import { z } from "zod";

// Create a schema that represents a "valid" user
export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    phone : z.string(),
    website: z.string(),
});

// Define a User type based on the schema
export type User = z.infer<typeof UserSchema>;
/*
    type User = {
        id?: number;
        name?: string;
        username?: string;
        email?: string;
        phone?: string;
        website?: string;
    }
*/
```

So far, nothing much has changed.
Simply said, the interface is replaced with a type, and the application continues to work as before.

### Working with the zod schema

Let's see what we can do with a zod schema, because this is what makes zod useful.
zod gives us utility methods to parse (and validate) an object instance at runtime based on a schema.

To verify if an instance matches with the schema definition, use the `parse` and `safeParse` methods that are available on the schema variable.
The difference between the two is that `parse` throws an error when it fails, and `safeParse` returns a `success` boolean.

A quick demo based on the `User` type that we created before:

```ts:valid.demo.ts
import { z } from "zod";

export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    phone : z.string(),
    website: z.string(),
});

const validUser = {
    id: 1,
    name: 'tim',
    username: '@tim',
    email: 'tim@mail.com',
    phone: '',
    website: 'https://timdeschryver.dev',
};

UserSchema.parse(validUser);

const result = UserSchema.safeParse(validUser);
// result.success == true
```

```ts:invalid.demo.ts
import { z } from "zod";

export const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
    phone : z.string(),
    website: z.string(),
});

// The `id` property is missing
const invalidUser = {
    name: 'tim',
    username: '@tim',
    email: 'tim@mail.com',
    phone: '',
    website: 'https://timdeschryver.dev',
};

// Throws because `id` is missing from the user object
UserSchema.parse(invalidUser);
/*
    [
        {
            "code": "invalid_type",
            "expected": "number",
            "received": "undefined",
            "path": [
                "id"
            ],
            "message": "Required"
        }
    ]
*/

// Returns a falsy result because `id` is missing from the user object
const result = UserSchema.safeParse(invalidUser);
/*
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "number",
        "received": "undefined",
        "path": [
          "id"
        ],
        "message": "Required"
      }
    ],
    "name": "ZodError"
  }
}
*/
```

As you can notice in the above snippets, when the instance doesn't match with the schema, zod prints out a handy error with useful information.
It's clear why the object is not valid, the message includes the property and the reason.

> zod has a lot of possibilities, and you can do much more than this. But, this post is about where to use zod in your application. If you want to know more about it, check out the detailed [zod documentation and examples](https://zod.dev/?id=basic-usage).

### Using the zod schema within the service

Now that we know how to parse an object with zod, let's see how, and more important where, we can use it in our application.
Like I said in the beginning, we want to verify the response bodies of HTTP requests.

To not pollute the application, this is best done in the HTTP service, right after we receive the response.
Take a look at the next snippet, which is utilising the RxJS `tap` operator to pass the response body of the request to the `parse` method.

```ts{16-18}:user.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {tap} from "rxjs";
import type {Observable} from "rxjs";
import {UserSchema} from "./user.model";
import type {User} from "./user.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${id}`).pipe(
      tap({
          next: (value) => UserSchema.parse(value)
      }),
    );
  }
}
```

While this works, it also makes the application very strict.
Every time that the response is not what's expected, the `parse` method throws an error.
This might impact the user experience of the application.

This might be good, but I would prefer to loosen the validation a little for the production build.

To keep the behavior consistent, and because we don't want to write the same code for all the HTTP requests, I abstracted the validation logic into a specialized RxJS operator called `parseResponse`.

The operator takes a schema as an argument, and uses the environment to run a different implementation:

- in development: the `parse` method is used, thus an error is thrown when the body is invalid. This makes the developer aware that something needs to be looked into.
- in production: the `safeParse` method is used, meaning that the body is let through as is when it's invalid. BUT, the invalid body is logged (together with the parsing issue(s)).

```ts:parse-response.operator.ts
import {tap} from "rxjs";
import type {MonoTypeOperatorFunction} from "rxjs";
import type {ZodType} from "zod";
import {environment} from "../environments/environment";

export function parseResponse<T>(schema: ZodType): MonoTypeOperatorFunction<T> {
    return tap({
        next: (value: any) => {
            if (!environment.production) {
                // Throw in development so we're aware of the error
                schema.parse(value);
            } else {
                const parsed = schema.safeParse(value)
                if (!parsed.success) {
                    // Log to service to be informed
                    console.log(parsed.error)
                }
            }
        }
    })
}
```

The refactored service now uses the custom `parseResponse` operator instead of `tap` and looks like this:

```ts{16}:user.service.ts
import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import type {Observable} from "rxjs";
import {UserSchema} from "./user.model";
import type {User} from "./user.model";
import {parseResponse} from "./parse-response.operator";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`https://jsonplaceholder.typicode.com/users/${id}`).pipe(
      parseResponse(UserSchema),
    );
  }
}
```

And that's it!
We are now finished to validate the incoming user, and the component can safely consume the user object.

## Performance

If you wonder about the impact of this additional logic, I got you covered.
For small collections, the performance impact is negligible.

Here's a benchmark to parse a collection of a normal-sized model.

```ts:model.ts
const user = {
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
};
```

```txt:benchmark.txt
1 user: 1ms
10 users: 1ms
100 users: 4ms
1000 users: 8ms
10000 users: 52ms
100000 users: 488ms
1000000 users: 5109ms
10000000 users: 53593ms
```

## Result

In this post, we've written a solution to verify that response bodies have the desired contract.
We did this by introducing zod into the codebase, which provided us a way to easily parse objects.
In our case, the response bodies of HTTP requests.

Adding zod is a small effort, instead of directly creating a TypeScript interface (or type), we:

1. create a zod schema
2. infer the TypeScript type based on the zod schema

Using the zod schema also has a minor impact when done correctly.
Only the services are affected, the other parts of the application don't need to know anything about the zod API, and thus continue to work the same way as before.

To parse the object within the services we created a reusable RxJS operator `parseResponse`, which contains all the logic to parse the response bodies.
This way, it's just a one-liner that needs to be added after each HTTP request.

While it has a minimal cost, the benefits of using zod and parsing the response bodies are huge:

- the components can safely consume the objects returned by the services; the application isn't polluted with additional checks
- we get a descriptive message when the response body doesn't match with the expectations immediately when the data is received, compare this to an obscure error when the application would crash instead

There's one caveat though.
As far as I know, the refactoring method to quickly rename properties of an interface directly in the whole codebase is not possible anymore.

### Side note

You can choose to have a simple schema that simply checks the data types, or you can create a complex one that also verifies the content of the response body (e.g. numbers that must be greater than and/or lower than an expected value). I prefer to keep the schema simple. Creating a complex schema opens up the door to adding business logic to the schema. This can be useful for other use cases, but not for the one we've discussed in this post.

### Demo

Play with the demo on [GitHub](https://github.com/timdeschryver/ng-zod), or directly in [StackBlitz](https://stackblitz.com/github/timdeschryver/ng-zod).

<iframe src="https://stackblitz.com/github/timdeschryver/ng-zod?ctl=1&embed=1" title="ng-zod" loading="lazy"></iframe>
