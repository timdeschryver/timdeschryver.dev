---
title: Use Zod to parse Unknown Data
slug: use-zod-to-parse-unknown-data
date: 2024-01-16
tags: typescript, developer-experience, libraries
---

# Use Zod to parse unknown data

How many times was there an issue within your application because you trusted data that you don't control (e.g. incoming data), or worse, how many times did the application entirely crash because of it?
Thinking back, was this easy to detect and could it have been prevented?

Instead of trusting the data that you don't own, it's better to guard yourself against unexpected cases.
Using [zod](https://zod.dev) it becomes an easy task to detect unexpected data structures and act accordingly.

> Zod is a TypeScript-first schema declaration and validation library. I'm using the term "schema" to broadly refer to any data type, from a simple string to a complex nested object.  
> Zod is designed to be as developer-friendly as possible. The goal is to eliminate duplicative type declarations. With Zod, you declare a validator once and Zod will automatically infer the static TypeScript type. It's easy to compose simpler types into complex data structures.

Because an example says more than words, let's revise and refactor an example from my latest blog post [Multiple releases using the same, but configurable, Angular Standalone Application build](../../blog/multiple-releases-using-the-same-but-configurable-angular-standalone-application-build/index.md).
In the blog post, the environment configuration is defined as a JSON structure and is assigned to an instance at run-time.
This can go horribly wrong when the interface and the JSON model aren't in sync anymore, e.g. after updating the model but not the JSON file.

:::code-group

```ts environment-config.ts {3-5} [title=environment-config.ts]
import { z } from 'zod';

export const environmentConfigSchema = z.object({
	apiUrl: z.string().min(1),
});
export type EnvironmentConfig = z.infer<typeof environmentConfigSchema>;
```

```ts main.ts {9} [title=main.ts]
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { createAppConfig } from './app/app.config';
import { environmentConfigSchema } from './app/environment-config';

fetch('./assets/environment-config.json')
	.then((resp) => resp.json())
	.then((config) => {
		const environmentConfig = environmentConfigSchema.parse(config);
		//    ^? { apiUrl: string }
		bootstrapApplication(AppComponent, createAppConfig(environmentConfig));
	});
```

:::

Before the application is bootstrapped, the config is parsed and when the `apiUrl` isn't present in config file (or is empty), the following error is thrown in a clean and concise format that contains all the necessary information.

```txt
ZodError: [
  {
    "code": "too_small",
    "minimum": 1,
    "type": "string",
    "inclusive": true,
    "exact": false,
    "message": "String must contain at least 1 character(s)",
    "path": [
      "apiUrl"
    ]
  }
]
```

Using this example, we see the benefits that Zod brings to a team:

- Eliminates Duplicative Type Declarations: With Zod, you declare a schema once and Zod can infer the static TypeScript type.
- Ensures Data Consistency: Zod helps ensure that the data your team works with is consistent and adheres to the defined schema.
- Enhances Developer Experience: using Zod simplifies the process of validating and parsing data, instead of introducing a big blob of messy code to validate objects, Zod streamlines and unifies this process making development easier and more efficient.

Other scenarios where Zod is useful involve other parts in a codebase that interacts with the "outside world", such as HTTP responses, URL parameters, CLI input, and it can even be useful for form validation.

As you can see, it's usually data that the application receives, or in other words data that you don't control, that needs to be parsed before it can be safely accessed/used.

While Zod is small in size (8kb minified + zipped), the only caveat is that it cannot be threeshaken.
If that's a requirement there are a couple of alternatives inspired by Zod, e.g. [Valibot](https://valibot.dev/).

If you're interested, take a look at the [Zod articles](/blog?q=Zod) on my blog.
Here you will see more use cases, such as generating test data using [zod-fixture](https://zod-fixture.timdeschryver.dev/).
