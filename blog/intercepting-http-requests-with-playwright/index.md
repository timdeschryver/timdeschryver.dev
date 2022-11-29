---
title: Intercepting HTTP Requests with Playwright
slug: intercepting-http-requests-with-playwright
description: Intercepting HTTP requests is a useful feature, let's take a look at how you can intercept an HTTP request with Playwright and discuss some of the possibilities.
date: 2022-11-29
tags: Playwright, Testing
---

In this post, we take a look at the benefits and possibilities while intercepting HTTP requests in your [Playwright](https://playwright.dev/) tests.

Before we dive into the Playwright examples, let's first take a look at the Angular component.
The component below makes a single HTTP request to fetch a collection of posts and renders the result in a list.
If the request should fail, the component displays an error message instead.

```ts{11-20, 24-26}:app.component.ts
import { NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LetModule } from '@ngrx/component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [HttpClientModule, NgIf, NgFor, LetModule],
    template: `
        <h1>Posts</h1>
        <ul *ngrxLet="posts$ as posts; let e = error; suspenseTpl: loading">
            <p *ngIf="e">Oops, it seems like something went wrong</p>
            <li *ngFor="let post of posts">
                {{ post.title }}
            </li>
        </ul>
        <ng-template #loading>
            <div>Loading...</div>
        </ng-template>
    `,
})
export class AppComponent {
    posts$ = inject(HttpClient).get<Post[]>(
        'https://my-json-server.typicode.com/typicode/demo/posts?_delay=2000',
    );
}

interface Post {
    id: number;
    title: string;
}
```

## Default behavior, real HTTP requests

The default behavior of a test written with Playwright is to make real HTTP requests.
This is great for testing the end-to-end behavior of the application, and it gives you the biggest confidence that the application is working correctly.

To write a simple test case for the application, we simply navigate to the home page and expect that a post is rendered.

This is exactly what the following test case does.

Notice that we don't need to put a wait statement in the test. This is because Playwright automatically waits until the assert passes.
When it takes too long, this throws an error and the test fails.

```ts:app.component.spec.ts
import { test, expect } from '@playwright/test';

test('renders posts when the page is opened', async ({ page }) => {
    await page.goto('http://localhost:4200/');

    const listItem = page.getByText('Post 1');
    await expect(listItem).toBeVisible();
});
```

## Intercept a request to return mocked response

While letting the requests hit the real server is great for testing the actual behavior of the application, it is not ideal for testing specific edge cases.
Here, you want to have full control over the request and the response.

Yes, you could also accomplish this by putting the API in the desired state, but this is often more time-consuming than intercepting the request with Playwright.

An intercepted HTTP request allows you to return a mocked response while preventing the request is sent to the server.

In Playwright, this is done by using the [`page.route` method](https://playwright.dev/docs/api/class-page#page-route). The first argument is the route that needs to be intercepted, and the second argument is a callback method that returns a response.

In the example below, the posts endpoint is intercepted and with the usage of `route.fulfill` it creates a mocked response.
To represent a real response, a posts array (which contains a single post) is assigned to the response body.

Note that the `**` wildcard syntax is used to ignore the delay query parameter, which was added to the end of the endpoint.

```ts{4-8}:app.component.spec.ts
import { test, expect } from '@playwright/test';

test('mock response with playwright', async ({ page }) => {
    await page.route('https://my-json-server.typicode.com/typicode/demo/posts**', (route) => {
        route.fulfill({
            body: JSON.stringify([{ title: 'Mocked Post' }]),
        });
    });

    await page.goto('http://localhost:4200/');

    const listItem = page.getByText('Mocked Post');
    await expect(listItem).toBeVisible();
});
```

## What about mocking an HTTP error?

Intercepting HTTP requests is powerful because it allows you to fully build the response of a request with the needed customizations for your needs.

In the previous example, we've seen how to create a mocked response in which we set the body.
Instead of returning a successful response, it's also possible to return an error response.
Doing this is a quick and useful way to test the error handling of the application.

To create a response that resulted in an error, we make use of the `route.abort` method.

The result of the test below is that the application displays an error message because there went something wrong during the request.

```ts{4-6}:app.component.spec.ts
import { test, expect } from '@playwright/test';

test('mock response with playwright that throws an error', async ({ page }) => {
    await page.route('https://my-json-server.typicode.com/typicode/demo/posts**', (route) => {
        route.abort();
    });

    await page.goto('http://localhost:4200/');

    const listItem = page.getByText('Oops, it seems like something went wrong');
    await expect(listItem).toBeVisible();
});
```

## Using the original response to build a mocked response

Last, but not least, we can also make the original request and modify the response. I like to use this method because it's the best of both worlds. We still test the interaction between the application and the server, but we still have to possibility to create edge cases without a lot of overhead.

```ts{4-19}:app.component.spec.ts
import { test, expect } from '@playwright/test';

test('tweak the original response', async ({ page, browser }) => {
    await page.route(
        'https://my-json-server.typicode.com/typicode/demo/posts**',
        async (route) => {
            // Make the original request
            const response = await page.request.fetch(route.request());
            let result = await response.json();

            // "copy" original response and overwrite body
            route.fulfill({
                response,
                body: JSON.stringify(
                    result.map((post) => ({ ...post, title: `${post.title} (Modified)` }))
                ),
            });
        }
    );
    await page.goto('http://localhost:4200/');

    const listItem = page.getByText('Post 1 (Modified)');
    await expect(listItem).toBeVisible();
});
```

## Conclusion

The [`page.route` method](https://playwright.dev/docs/api/class-page#page-route) of Playwright allows you to intercept HTTP requests and return a mocked response.
Because you are fully in control of the response, this enables you to create edge cases to cover all the possible scenarios in a quick way without introducing a lot of overhead.

The Playwright API is flexible enough to be used in different ways.
You can just create a mocked response, return an error, or you can make the original request and modify the response.

As an extra tip, you could do more than just mocking HTTP API requests.
In certain cases, aborting image requests may result in a significant speed boost, this is exactly what the next snippet accomplishes.

```ts
await page.route('**/*', (route) => {
	return route.request().resourceType() === 'image' ? route.abort() : route.continue();
});
```
