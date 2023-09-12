---
title: How to globally register Injection Tokens within the Angular TestBed
slug: how-to-globally-register-injection-tokens-within-the-angular-testbed
description: Provide global Injection Tokens within the Angular TestBed once to keep your test setups simple and DRY.
date: 2023-08-07
tags: Angular, Jest, Testing
---

It's a useful practice To keep your test setups simple (and DRY).
However, this can become a problem with Injection Tokens that are provided at a global level (the application level, or a feature level), and are used in many layers of the application.
In this blog post, you will see how to configure the Angular TestBed at a global level in order to prevent this problem.

Think of a typical injection token that you want to register once at the global level.
This is usually a token that contains information that doesn't affect the behavior of an application but contains useful information for the application to work correctly.
Examples of such tokens are tokens that contain environment variables, the theme of the application, ...
Most of these tokens don't have any value for the test cases themselves but need to be registered so Angular can create instances of components and services that depend on these tokens.

Tokens that are registered at the component level are automatically taken care of (with Angular Standalone Components), so we don't have to worry about them anymore.

## The problem

When a token is not registered within the TestBed, but is injected in a component or service, the `NullInjectorError` error is thrown:

```bash
NullInjectorError: R3InjectorError(Standalone[MyComponent])[InjectionToken MY_INJECTION_TOKEN -> InjectionToken MY_INJECTION_TOKEN -> InjectionToken MY_INJECTION_TOKEN]:
      NullInjectorError: No provider for InjectionToken MY_INJECTION_TOKEN!
```

To resolve this error, the injection token `MY_INJECTION_TOKEN` needs to be registered within the TestBed.
With the [Angular Testing Library](https://github.com/testing-library/angular-testing-library) this is done by providing the token in the `providers` array of the `render` method:

```ts:my.component.spec.ts
await render(MyComponent, {
    providers: [
        {
            provide: MY_INJECTION_TOKEN,
            useValue: {}
        },
    ]
});
```

While this works fine, we don't want to repeat this for every test setup.
Instead, we want to register the token once at the global level of the TestBed.

It also makes sense to register these tokens globally within the test suite, because they're provided at the global level of the application.
Injection tokens that are provided at the component level are automatically taken care of when using Angular Standalone Components.

## The `beforeEach` solution

Registering a token globally is done by adding the token to the global test setup file:

- if you're using Karma, you're looking for the `test.ts` file.
- if you're using Jest, more specifically `jest-angular-preset`, this is usually the `setup-test.ts` file. (If you don't know which file this is for your project, you can find this in the `setupFilesAfterEnv` property of the jest config file)

Using `TestBed.overrideProvider` it's possible to set a value for the injection token.
Because we want to set the value once for all tests, we need to wrap this in a `beforeEach` hook:

```ts
beforeEach(() => {
	TestBed.overrideProvider(MY_INJECTION_TOKEN, { useValue: {} });
});
```

A drawback of this approach is that the value of the token is set for all tests, and it's less intuitive to override this value for a specific test.
For those one-off cases, we need to use the `TestBed.overrideProvider` method again.
This isn't ideal, because we need to know which token is registered globally, and the `TestBed.overrideABC()` methods are not so common knowledge.
The ideal solution is to set the injection token for those one-off cases the same way as we did before, with the `providers` array when we're busy configuring the TestBed.o

To overcome this, we need to tackle this problem from another angle.

## The `initTestEnvironment` solution

Instead of overriding the injection token, we need to provide the injection token in the initial setup of the test environment.
For this, we use the `platformBrowserDynamicTesting()` method, which accepts an array of providers.

For Karma users, this is simple and we can make a small change to the `test.ts` file:

```ts{16-21}:test.ts
// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import '@testing-library/jasmine-dom';
import { MY_INJECTION_TOKEN } from './app/app.config';

beforeAll(() => {
    (jasmine.getEnv() as any).addMatchers(require('@testing-library/jasmine-dom').default);
});

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting([
        {
            provide: MY_INJECTION_TOKEN,
            useValue: {},
        },
    ])
);

// Then we find all the tests.
const context = (require as any).context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);
```

For Jest users, this is a bit more complicated because the `jest-preset-angular` preset already initializes the test environment.
Sadly, we can't alter this configuration, nor can we invoke the initialization of the test environment again (this throws an error).
The workaround is to move the whole initialization to our end, within the `setup-test.ts` file:

In code, this translates that we don't import the pre-configured setup `jest-preset-angular/setup-jest` anymore.

```ts{1}:before:setup-test.ts
import 'jest-preset-angular/setup-jest';
import '@testing-library/jest-dom';
```

So instead of doing the above, we configure the test environment ourselves.
This looks a lot like the setup that's used with Karma.

Important here is to not forget to import the `zone-testing-bundle` file to make sure that zone.js is loaded.
Lastly, we can add the injection token to the `platformBrowserDynamicTesting()` method.

```ts{1, 8-13}:after:setup-test.ts
import 'zone.js/bundles/zone-testing-bundle.umd.js';
import '@testing-library/jest-dom';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { MY_INJECTION_TOKEN } from './src/app/app.config';

getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting([
        {
            provide: MY_INJECTION_TOKEN,
            useValue: {},
        },
    ])
);
```

## Conclusion

Using the `platformBrowserDynamicTesting()` method while initializing the test environment, it's possible to register injection tokens globally.
This solution is more intuitive than using the `TestBed.overrideProvider()` method, and it also allows us to override the value of the injection token for a specific test when we need to set an explicit value for the token.

For services that are provided at the root level, that you want to mock, you can resort to the `TestBed.overrideProvider()` method.
This can be useful for services that don't have any business logic but only consists of application logic.
These services don't change the behavior of the application, e.g. a logging service.

```ts
beforeEach(() => {
	TestBed.overrideProvider(LogService, { useValue: {} });
});
```
