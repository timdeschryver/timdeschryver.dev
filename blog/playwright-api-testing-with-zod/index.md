---
title: Playwright API testing with zod
slug: playwright-api-testing-with-zod
description: In this post we'll create a custom Playwright matcher to validate the shape of the response body using the zod library. This way, we make sure that the contract between the front-end application and the API is valid.
date: 2023-06-26
tags: Playwright, zod, testing
---

As you probably are already aware of, I'm a big fan of [Playwright](https://playwright.dev/) and [zod](https://zod.dev/).
In this blog post, we'll see how we can combine the two to write API tests.

:::info
If you're new to Playwright API testing, I recommend taking a look at the [official documentation](https://playwright.dev/docs/api-testing) to follow along.
:::

## Starting point

When you're reading the documentation or looking at examples of how to write API tests with Playwright, you'll come across examples using the following structure. The examples use the `request` context to fire an HTTP request and validate the content of the response object.

```ts{7-13}:todo.test.ts
import { expect, test } from '@playwright/test';

test('get todo returns a todo item', async ({ request }) => {
    const todoResponse = await request.get('/todos/1');
    expect(todoResponse.ok()).toBeTruthy();

    const todo = await todoResponse.json();
    expect(todo).toEqual({
        userId: 1,
        id: 1,
        title: 'delectus aut autem',
        completed: false,
    });
});
```

This is fine, and it can be a valid requirement to verify the content.
But, in most cases, I'm more interested in the shape of the response, and not particularly the content.
These tests are more flexible, and less likely to break when the content changes (for example when you're running the same tests on multiple environments).

But do these tests provide enough value?
Yes of course because it's your assurance that the contract between the front-end application and the API is kept up-to-date and is valid.

## Enter zod

Luckily, we can use `zod` to validate the shape of the response.

To use `zod` to validate the shape of the response, we first need to define a schema.
In the example below, we define a schema `todoSchema` for a todo item.
When you're already using zod, for example to [verify HTTP response bodies](../why-we-should-verify-http-response-bodies-and-why-we-should-use-zod-for-this/index.md) at runtime, this becomes even easier because you can reuse the same schema in production code as in test code.

Then, we use the `parse` method to validate the response body against the zod schema.
Under the hood, `zod` will throw an error when the response body doesn't match the schema, so we can use the `.not.toThrow()` assertion from Playwright to test if the shape is correct.

```ts{5-10, 16-17}:todo.test.ts
import { expect, test } from '@playwright/test';
import { z } from 'zod';

// define a scheme or import the scheme from your production code
const todoSchema = z.object({
    userId: z.number(),
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
});

test('get todo returns a todo item', async ({ request }) => {
    const todoResponse = await request.get('/todos/1');
    expect(todoResponse.ok()).toBeTruthy();

    const todo = await todoResponse.json();
    expect(() => todoSchema.parse(todo)).not.toThrow();
});
```

When the response body doesn't match the schema, the test fails with the following error message.

```text
Error: expect(received).not.toThrow()

Error name:    "ZodError"
Error message: "[
  {
    \"code\": \"invalid_type\",
    \"expected\": \"string\",
    \"received\": \"boolean\",
    \"path\": [
      \"completed\"
    ],
    \"message\": \"Expected string, received boolean\"
  }
]"
```

## Refactor to a custom Playwright Matcher

The example above works, but it's not very readable and when we're using this technique in multiple tests we're also duplicating some code.
A better approach is to create a custom Playwright matcher.
This way, the intention of the test becomes clearer.
Another advantage is that the logic is centralized, and if the zod implementation changes, we only need to update it in one place.

Let's take a look at the implementation of the custom matcher, let's call our matcher `toMatchSchema`.
To create the `toMatchSchema` matcher, we need to extend the `expect` object from Playwright and add a new method.
We can do this by including the matcher in the `playwright.config.ts` file using the `expect.extend()` method.

This method name is going to be the name of the matcher, so we'll call it `toMatchSchema`.
The matcher receives the input argument (`expect(input)`), and in our case accepts the zod schema as the second argument, which we'll need to provide in our test case(s).

Instead of throwing an error when the schema doesn't match, we'll use the `safeParse` method from zod within this implementation.
This method returns a `SafeParseReturnType<any, any>` object, which contains a `success` property to indicate if the schema matches.
When the schema matches, this property is `true`, otherwise it's `false`.

If the schema doesn't match, we can also access the zod issues.
These issues contain more information about the error.
To improve the developer experience, we'll use the `issues` property to create a more descriptive error message.

```ts:playwright.config.ts
import { defineConfig, devices, expect } from '@playwright/test';
import { ZodTypeAny } from 'zod';

expect.extend({
  async toMatchSchema(received: APIResponse, schema: ZodTypeAny) {
    const response = await received.json();
    const result = await schema.safeParseAsync(response);
    if (result.success) {
      return {
        message: () => "schema matched",
        pass: true,
      };
    } else {
      return {
        message: () =>
          "Result does not match schema: " +
          result.error.issues.map((issue) => issue.message).join("\n") +
          "\n" +
          "Details: " +
          JSON.stringify(result.error, null, 2),
        pass: false,
      };
    }
  },
});

export default defineConfig({/* Playwright config here */});
```

To make TypeScript happy, we also need to define the `toMatchSchema` matcher within the Playwright schema.

```ts:global.d.ts
import { ZodTypeAny } from 'zod';

declare global {
    namespace PlaywrightTest {
        interface Matchers<R, T> {
            toMatchSchema(schema: ZodTypeAny): Promise<R>;
        }
    }
}
```

With these two changes in place, we can now use the `toMatchSchema` matcher in our test case(s).

```ts{15}:todo.test.ts
import { expect, test } from '@playwright/test';
import { z } from 'zod';

const todoSchema = z.object({
	userId: z.number(),
	id: z.number(),
	title: z.string(),
	completed: z.boolean(),
});

test('get todo returns a todo item', async ({ request }) => {
	const todoResponse = await request.get('/todos/1');
	expect(todoResponse.ok()).toBeTruthy();

	expect(todoResponse).toMatchSchema(todoSchema);
});
```

When the schema doesn't match, the test fails with the following error message.

```text
Error: Result does not match schema: Expected string, received boolean
Details: {
  "issues": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "boolean",
      "path": [
        "completed"
      ],
      "message": "Expected string, received boolean"
    }
  ],
  "name": "ZodError"
}
```

## Recap

In this blog post, we've seen how we can use zod within our Playwright tests to verify the shape of the response.
This technique is beneficial when we're interested in the shape of the response, and not the content.
Doing this makes sure that the contract between the front-end application and the API is aligned.

To implement this, we've created a custom Playwright matcher that uses the `safeParse` method from zod to verify the shape of the response.
When the response doesn't match the schema, the test fails with a descriptive error message.
