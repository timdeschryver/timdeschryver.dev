---
title: Using MSW (Mock Service Worker) in an Angular project
slug: using-msw-in-an-angular-project
description: Using MSW to mock your server in an Angular project
author: Tim Deschryver
date: 2020-06-15
tags: Angular, Testing, TypeScript
banner: ./images/banner.jpg
bannerCredit: Photo by [Gary Bendig](https://unsplash.com/@kris_ricepees) on [Unsplash](https://unsplash.com)
published: true
---

During the past weeks, I've seen posts around the library [MSW (MockServiceWorker)](https://redd.gitbook.io/msw/).

> Seamless REST/GraphQL API mocking library for browser and Node.

MSW seems to gain some popularity fast, and most of it is coming from the React community.
It even became the [recommended approach](https://testing-library.com/docs/react-testing-library/example-intro#mock) to mock HTTP requests with React Testing Library.
[Kent C. Dodds](https://twitter.com/kentcdodds) wrote a blog post "[Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch)" in which he explains what problems MSW can resolve. If you're not familiar with MSW, I would suggest skimming through the documentation or to read Kent's blog before continuing.

Because it receives a lot of positive feedback I wanted to give this a shot with Angular.
In this post, we'll create a proof of concept to search a GitHub user for a username.

![The real implementation of the GitHub service, we search on "timdeschryver" and receive the GitHub user "timdeschryver".](./images/real.gif)

The implementation of the Angular service, looks as this:

```ts:/src/app/github.service.ts
@Injectable({
  providedIn: 'root',
})
export class GitHubService {
  constructor(private http: HttpClient) {}

  getUser(username: string) {
    return this.http.get(`https://api.github.com/users/${username}`)
  }
}
```

If you want to test a component using the `GitHubService`, typically a mocked service instance is provided.

```ts:/src/app/app.component.spec.ts
it('should search on username', async () => {
  await render(AppComponent, {
    imports: [HttpClientModule, ReactiveFormsModule],
    providers: [
      {
        provide: GitHubService,
        useValue: {
          getUser: () => of({ user: 'provided-user' }),
        },
      },
    ],
  })

  await userEvent.type(screen.getByRole('searchbox'), 'timdeschryver')

  await screen.findByText(/provided-user/i)
})
```

## Setup

The first step is to install MSW with the following command.
This will create the `./src/mockServiceWorker.js` file which includes the Service Worker.

```bash
npx msw init src
```

To be able to serve the service worker, add it to the `assets` inside the `angular.json` file.
With this step, the `mockServiceWorker.js` file will be copied over to the build output.

```json{11}:angular.json
{
  "build": {
    "builder": "@angular-devkit/build-angular:browser",
    "options": {
      "outputPath": "dist/ng-msw",
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": "src/polyfills.ts",
      "tsConfig": "tsconfig.app.json",
      "aot": true,
      "assets": ["src/favicon.ico", "src/assets", "src/mockServiceWorker.js"],
      "styles": ["src/styles.css"],
      "scripts": []
    }
  }
}
```

That's all for the configuration, now it's time to create the mocked server.

```ts:/src/mocks/browser.ts
import { setupWorker, rest } from 'msw'

export const mocks = [
  rest.get('https://api.github.com/users/:user', (req, res, ctx) => {
    const { user } = req.params

    return res(
      ctx.status(200),
      ctx.json({
        name: `mocked-${user}`,
        bio: 'mocked-bio',
      }),
    )
  }),
]

const worker = setupWorker(...mocks)
worker.start()

export { worker, rest }
```

The last part is to import the mock.
Here, we use a dynamic import so it's only included in a non-production build.

```ts{10}:/src/app/main.ts
import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import { AppModule } from './app/app.module'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
} else {
  import('./mocks/browser')
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err))
```

This gives us the following result.

![The mock implementation of the GitHub service, we search on "timdeschryver" and receive the mocked user "mocked-timdeschryver".](./images/mock.gif)

## Karma/Jasmine Tests

Because Angular uses a different builder during tests, we also need to add the `mockServiceWorker` to the test builder.

```json{9}:angular.json
{
  "test": {
    "builder": "@angular-devkit/build-angular:karma",
    "options": {
      "main": "src/setupKarma.ts",
      "polyfills": "src/polyfills.ts",
      "tsConfig": "tsconfig.spec.json",
      "karmaConfig": "karma.conf.js",
      "assets": ["src/favicon.ico", "src/assets", "src/mockServiceWorker.js"],
      "styles": ["src/styles.css"],
      "scripts": []
    }
  }
}
```

Just like when the application is served, the mock server needs to be imported to register the service worker.
We import the mocks in the `./src/test.ts` file where the test environment is created, so it's available for all tests.

```ts{10}:/src/test.ts
// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/zone-testing'
import { getTestBed } from '@angular/core/testing'
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing'

import './mocks/browser'

declare const require: {
  context(
    path: string,
    deep?: boolean,
    filter?: RegExp,
  ): {
    keys(): string[]
    <T>(id: string): T
  }
}

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
)
// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/)
// And load the modules.
context.keys().map(context)
```

Now, we can simply write the test without having to provide a mocked instance of the service.

```ts:/src/app/app.component.spec.ts
import { HttpClientModule } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { AppComponent } from './app.component'

it('should search on username', async () => {
  await render(AppComponent, {
    imports: [HttpClientModule, ReactiveFormsModule],
  })

  await userEvent.type(
    screen.getByPlaceholderText(/Username/i),
    'timdeschryver',
  )

  await screen.findByText(/mocked-timdeschryver/i)
})
```

## Jest Tests

For Jest, we can't use the current setup.
Don't worry, the mocks are reused but because Jest runs in a Node environment, the worker can't be.

> ⚠ While I think the following should work, it seems like the request doesn't resolve correctly and Angular doesn't receive the response.

To reuse the mocks, move it to another file so it's possible to share the setup between a browser environment and a Node environment.

```ts:/src/mocks/mock-handlers.ts
export const createMockHandlers = rest => [
  rest.get('https://api.github.com/users/:user', (req, res, ctx) => {
    const { user } = req.params

    return res(
      ctx.status(200),
      ctx.json({
        name: `mocked-${user}`,
        bio: 'mocked-bio',
      }),
    )
  }),
]
```

Next, import the mock handlers while setting up the Node server.

```ts{5}:/src/mocks/node.ts
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { createMockHandlers } from './mock-handlers'

const server = setupServer(...createMockHandlers(rest))

export { server, rest }
```

Lastly, start the server before each test.
Because we don't want to start the server in every test, add it to the test setup.

```ts{4-9}:/src/setupJest.ts
import 'jest-preset-angular'
import { server } from './mocks/node'

beforeAll(() => server.listen())
// if you need to add a handler after calling setupServer for some specific test
// this will remove that handler for the rest of them
// (which is important for test isolation):
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

The test itself remains the same.

```ts:{/src/app/app.component.spec.ts}
import { HttpClientModule } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { render, screen } from '@testing-library/angular'
import userEvent from '@testing-library/user-event'
import { AppComponent } from './app.component'

it('should search on username', async () => {
  await render(AppComponent, {
    imports: [HttpClientModule, ReactiveFormsModule],
  })

  await userEvent.type(
    screen.getByPlaceholderText(/Username/i),
    'timdeschryver',
  )

  await screen.findByText(/mocked-timdeschryver/i)
})
```

## Cypress Tests

Because Cypress is running tests against the served application, no action is required here.
We just have to write the spec.

```js:/cypress/integration/integration.js
it('should search on username', () => {
  cy.visit('/')

  cy.findByRole('searchbox').type('timdeschryver')

  cy.findByText(/mocked-timdeschryver/i)
})
```

## Conclusion

While Angular already provides a way to mock our services via its dependency injection, I think we can still benefit from MSW in an Angular project.

It doesn't just help to mock services during tests, but as the example setup shows, it can also be used during the development cycle. Especially, when multiple teams (frontend and backend) are working on the same application or when the backend isn't ready yet.

MSW also provides a way to share a server across multiple layers of the testing pyramid. The server can be used during unit tests, integration tests, and end-to-end tests. This can help with the maintenance of your tests.

It's a real bummer that the Jest tests are failing currently, and that's a big showstopper for me.
I will definitely take a look at it later and I hope I can update this post with a working solution.

The code from this post can be found on [GitHub](https://github.com/timdeschryver/ng-msw).
