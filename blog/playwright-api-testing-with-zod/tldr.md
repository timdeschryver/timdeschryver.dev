## Define a custom Playwright matcher

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

## Add the matcher to the Playwright namespace

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

## Use the matcher in a test case

```ts{16}:todo.test.ts
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
