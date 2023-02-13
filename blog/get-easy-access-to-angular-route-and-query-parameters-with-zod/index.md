---
title: Get easy access to Angular route and query parameters with zod
slug: get-easy-access-to-angular-route-and-query-parameters-with-zod
description: Using zod's coerse method to easily access route and query parameters in Angular.
date: 2023-02-13
tags: Angular, zod
---

To get access to route and query parameters in Angular, you need to manually parse the `ActivatedRoute` instance.
While this is not hard, it can quickly bloat your codebase.
Until Angular provides a better and typesafe way to access route and query parameters, you can use [zod](https://zod.dev/) to make it easier.

First, let's see how we can access a route parameter without zod.
Let's use a route that contains an `id` parameter, which should be a number.
This looks as follows:

```ts{3}
provideRouter([
    {
        path: 'example/:id',
        loadComponent: () => import('./app/example.component').then((m) => m.ExampleComponent),
    },
]);
```

To access the `id` parameter, we need to inject the `ActivatedRoute` instance and then read the `id` property from the `params` property.

```ts{4}
@Component()
export class ExampleComponent {
    id$ = inject(ActivatedRoute).params.pipe(
        map((params) => params['id'])
    );
    // ^? Observable<any>
}
```

Doing this works but it's not typesafe, as you can see `id$` has the type `Observable<any>`.
To make it typesafe, we need to manually verify and parse the `id` parameter.
Let's see what that looks like:

```ts{4-10}
@Component()
export class ExampleComponent {
    id$ = inject(ActivatedRoute).params.pipe(
        map((params) => {
            const id = parseInt(params['id'], 10);
            if (isNaN(id)) {
                throw new Error('Invalid id');
            }
            return id;
        }),
    );
    // ^? Observable<number>
}
```

Now, `id$` has the type `Observable<number>`, which is what we want.
But contains some boilerplate code.

Instead of manually parsing the route parameters, we can use `zod` to do the heavy lifting for us.
So let's do that.

The first step is to define a zod schema for the route parameters.
Then, we can use the schema to parse the route parameters.

In the example below I've created the schema `route` which contains the `id` property.
To parse the route params, we can use the `parse` method of the schema.

```ts{3, 8-10}
export class ChildComponent {
    id$ = inject(ActivatedRoute).params.pipe(
        map((params) => route.parse(params).id)
    );
    // ^? Observable<number>
}

const route = z.object({
    id: z.number(),
});
```

Sadly, this does not work yet.
Because all route parameters and query parameters are strings, the above code results in a zod parsing error.

```txt
ZodError: [
  {
    "code": "invalid_type",
    "expected": "number",
    "received": "string",
    "path": [
      "id"
    ],
    "message": "Expected number, received string"
  }
]
```

And... we're back to square one because we don't want to manually parse the route parameters.
We could use the [`transform` method](https://zod.dev/?id=transform), but this doesn't validate if the `id` is a number.
For example, if the `id` in the route is a string, then the following code returns `NaN`.

```ts{2}
const route = z.object({
    id: z.string().transform((value) => parseInt(value, 10)),
});
```

Luckily, in zod v3.20, you can use the [`coerse` method](https://zod.dev/?id=coercion-for-primitives) to quickly transform the value of a primitive.

```ts{3, 9}
export class ChildComponent {
    id$ = inject(ActivatedRoute).params.pipe(
        map((params) => route.parse(params).id)
    );
    // ^? Observable<number>
}

const route = z.object({
    id: z.coerce.number(),
});
```

The end result is that we can now easily access route and query parameters from an Angular route.
We can do this in a typesafe way, without having to manually parse the route parameters.
Keep in mind that this throws an error if the route parameters are invalid, in our example, when we `id` parameter can't be parsed to a number.
In this case, we end up with the same error as before, which is a good thing because it means that we can't accidentally use an invalid route parameter.

```txt
ZodError: [
  {
    "code": "invalid_type",
    "expected": "number",
    "received": "nan",
    "path": [
      "id"
    ],
    "message": "Expected number, received nan"
  }
]
```
