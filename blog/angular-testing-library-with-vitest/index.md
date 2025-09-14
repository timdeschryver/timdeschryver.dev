---
title: Angular Testing Library with Vitest
slug: angular-testing-library-with-vitest
description: Because of the Vitest plugin provided by Analog it just takes a few steps and minutes to test your Angular components with Angular Testing Library.
date: 2024-07-30
tags: Angular, Angular Testing Library, Testing
---

Because I got asked about it a few times, I decided to write a short article about how to use Angular Testing Library with Vitest.
The short and simple answer is, that it just works.
**_You can use Angular Testing Library with Vitest without any issues._**

## What is Angular Testing Library

If you are not familiar with Angular Testing Library, here is a short introduction:
(Angular) Testing Library is a set of utilities that allows you to test (Angular) components in a way that is more similar to how the components are used by the end users. It provides a set of utilities that encourage you to write tests that focus on the behavior of your components, rather than the implementation details.

Testing Library is not a test runner and doesn't require any specific test runner to work.
It works with any test runner that has a DOM implementation.
This means that you can use the Angular Testing Library with any test runner that has a DOM implementation, including Jest, Jasmine, and Vitest as well.

## Why Vitest

[Vitest](https://vitest.dev/) is a new test runner designed to be fast and extensible.
It is built on top of [Vite](https://vitejs.dev/), which is/becoming the de-facto standard for development.
Vite is exciting because it is fast, extensible (through plugins), and has a great developer experience.

Because of these reasons, there's an increasing interest in the Vite ecosystem for building/serving code and Vitest for testing.

## How to use Vitest in Angular

:::info
Official (experimental) support for Vitest in Angular is [available](https://angular.dev/guide/testing/unit-tests) from version 20. This means you don't need to use AnalogJS as a bridge anymore.
:::

To use Vitest with Angular you can use [AnalogJS](https://analogjs.org/) as a bridge between Angular and Vitest.
[Brandon Roberts](https://twitter.com/brandontroberts) already wrote a great article "Faster testing with Angular and Vitest ⚡️" about how to use AnalogJS with Angular and Vitest, so I won't go into the details here.
You can find the article on [dev.to](https://dev.to/brandontroberts/faster-testing-with-angular-and-vitest-274n).
You can also take a look at the [AnalogJS documentation](https://analogjs.org/docs/features/testing/vitest) for more information.

First, you need to install AnalogJS package in your Angular project:

```bash
npm install @analogjs/platform --save-dev
```

Then you can run the schematic to set up the Vitest plugin for your Angular project:

```bash
ng generate @analogjs/platform:setup-vitest
```

This does all of the heavy lifting for you.
After that, you're good to go to run your tests with Vitest:

```bash
npm run test
```

## Bringing in Angular Testing Library

As I mentioned before, Angular Testing Library works with any test runner that has a DOM implementation.
This includes Vitest, so you can use Angular Testing Library with Vitest without any issues.

To use Angular Testing Library with Vitest, you need to install the Angular Testing Library package:

```bash
ng add @testing-library/angular
```

Optionally, but recommended, you can also install the `user-event` and `jest-dom` packages.
The former provides a set of utilities for simulating user events.
Though the latter has "jest" in its name, it also provides a set of custom testing matchers that are compatible with Vitest.

```bash
npm install @testing-library/user-event @testing-library/jest-dom --save-dev
```

Then you can use Angular Testing Library in your tests:

```ts:example.spec.ts
import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import HomeComponent from './index.page';

test('counter click increments the count', async () => {
  const user = userEvent.setup();
  await render(HomeComponent)
  const button = screen.getByRole('button', {name: /count 0/i});

  await user.click(button);

  expect(button).toHaveTextContent(/count 1/i);
});
```

That's it! You can now use Angular Testing Library with Vitest to test your Angular components.

### Add the jest-dom matchers

To use the `jest-dom` matchers, include an import to `@testing-library/jest-dom/vitest` to the test setup file.

```ts{2}:test-setup.ts
import '@analogjs/vitest-angular/setup-zone';
import '@testing-library/jest-dom/vitest';

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
```

## What about NX?

For now, you can apply the same steps to an Angular project that's using [NX](https://nx.dev/).

In the future, this will become easier because [Younes Jaaidi](https://x.com/yjaaidi) has cooked up a [Pull Request](https://github.com/nrwl/nx/pull/27311) to add support for Vitest. This will make the manual steps that we've covered unnecessary, as it will set up Vitest automatically for you using its schematics.

## Conclusion

In this article we've seen that it just takes a few steps to integrate Vitest in your Angular project.
After that, you can use Angular Testing Library to test your Angular components without any concerns or issues.

For an example repository including a small example, see the repository [with a default Angular application with Vitest](https://github.com/timdeschryver/vitest-angular-testing-library) or [with an Analog application](https://github.com/timdeschryver/AnalogAngularTestingLibrary).
