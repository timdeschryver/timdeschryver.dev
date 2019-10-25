---
title: Reseed your database with Cypress
slug: reseed-your-database-with-cypress
description: By using a Cypress task it's possible to run code JavaScript code in Node.js. We can leverage this API to reseed a database with data we're in control of. Having control over the data allows us to write specific and isolated scenarios to run tests against.
author: Tim Deschryver
date: 2019-10-14T08:00:00.000Z
tags: Cypress, Testing, Reseed, Database
banner: ./images/banner.jpeg
bannerCredit: Photo by [Francesco Gallarotti](https://unsplash.com/@gallarotti) on [Unsplash](https://unsplash.com)
published: true
---

By using a [Cypress task](https://docs.cypress.io/api/commands/task.html) it's possible to run code JavaScript code in Node.js.
We can leverage this API to reseed a database with data we're in control of. Having control over the data allows us to write specific scenarios to run tests against.

There are other possibilities to test a specific scenario, but they all come at a cost:

- Run a previously tested scenario to set up a specific test case, this can be **time-consuming to run and to write**
- Expose create, update, and delete functions to be able to set up a specific test, with the consequence you end up with **"backdoor" functions in an API**. To be able to run specific test cases you will write more code (and have more maintenance) to be able to test your code. By exposing these functions there's a possibility they make it to production where they can become harmful if someone finds these backdoor functions
- Because it can be hard/time-consuming to test a specific scenario, **some tests will not be written**

### Why

But what do we gain by reseeding the database?

Well, we can write **isolated test cases**, this has the benefit that each test case:

- is scoped to a specific test case
- can run individually
- is fast and easy to use
- is reliable

### How

#### Creating the task

A Cypress task can be registered, the same way as a plugin.
We can listen to tasks when we bind the `task` event inside the `plugins/index.js` file.
To register multiple tasks, we pass an object of our tasks as parameter.
The property names are used to execute the task later on in our tests, and the value must be a `Promise` wherein the task logic lives.

```ts{3-10}:plugins/index.js
module.exports = on => {
  on('task', {
    'db:teardown': () => {
      const teardown = require('../../db/teardown.js')
      return teardown()
    },
    'db:seed': () => {
      const seed = require('../../db/seed.js')
      return seed()
    },
  })
}
```

We aren't covering the `teardown` and `seed` scripts because these will be different based on the chosen stack.

#### Running the task

To run the task we can use the `cy.task(taskName)` method.
In our case, we want to reseed the database before running each test.
Therefore, we use the `beforeEach` hook inside the `support/index.js` file.

```ts:support/index.js
beforeEach(() => {
  cy.task('db:teardown')
  cy.task('db:seed')
})
```

#### Modifying the timeout time

By default, a task will timeout after one minute.
For most of the cases this will be enough, but for the cases that are taking longer it's possible to change the timeout.

To change it at a global level, change the default timeout inside `cypress.json`.

```json:cypress.json
{
  "defaultCommandTimeout": 120000
}
```

Or modify the timeout value on a task level by changing the options.

```ts
cy.task('db:teardown', null, { timeout: 30000 })
cy.task('db:seed', null, { timeout: 30000 })
```
