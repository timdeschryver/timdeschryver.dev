---
title: How to test Svelte components
slug: how-to-test-svelte-components
description: Writing Svelte component tests with the Svelte Testing Library is simple. Let's take a look at the setup to get you started!
author: Tim Deschryver
date: 2020-01-26T08:01:47.322Z
tags: Svelte, Testing, Jest, Tutorial
banner: ./images/banner.jpg
bannerCredit: Photo by [Toimetaja tõlkebüroo](https://unsplash.com/@toimetaja) on [Unsplash](https://unsplash.com)
published: true
---

I've been looking into [Svelte](https://svelte.dev/), and while most of the info that I'm looking for can be found in the documentation, there's one piece missing. There's no section on how to test components, so I went to explore this area.

The first place where I was looking, was the [Svelte repository](https://github.com/sveltejs/svelte) itself. It contains tests that seem simple at first, like [this one](https://github.com/sveltejs/svelte/blob/master/test/custom-elements/samples/props/test.js). The only problem that I have, is that it requires me to [orchestrate the test setup](https://github.com/sveltejs/svelte/blob/master/test/custom-elements/index.js).

After taking a look at the Svelte repository, I quickly came across the [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro). I'm the creator of the [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro), and because of the Testing Library has a similar API across all frameworks, I was quickly used to it.

### Jest Setup

Writing tests with the Svelte Testing Library can be done with all test, in this article I'm using [Jest](https://jestjs.io/).

The first step is to install the dependencies:

```bash
npm install @babel/core @babel/preset-env jest babel-jest svelte-jester -D
```

The [Babel](https://babeljs.io/) compiler has to be installed to use the ES6 syntax while writing tests.
To compile Svelte components, it's also needed to install [svelte-jester](https://github.com/mihar-22/svelte-jester).

After the installation is complete, Jest and Babel have to be configured.

To configure Jest, create a `jest.config.js` file in the root of the project.

```js:jest.config.js
module.exports = {
  transform: {
    '^.+\\.svelte$': 'svelte-jester',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'svelte'],
}
```

For Babel, create a `babel.config.js` file in the root of the project.

```js:babel.config.js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
}
```

The last step of the setup is to add a script inside the `package.json` file:

```json{8}:package.json
{
  "name": "svelte-counter",
  "version": "1.0.0",
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "start": "sirv public",
    "test": "jest"
  },
  "devDependencies": {
    "@babel/core": "^7.8.3",
    "@babel/preset-env": "^7.8.3",
    "@rollup/plugin-commonjs": "^11.0.0",
    "@rollup/plugin-node-resolve": "^7.0.0",
    "@testing-library/svelte": "^1.11.0",
    "babel-jest": "^25.1.0",
    "jest": "^25.1.0",
    "rollup": "^1.20.0",
    "rollup-plugin-livereload": "^1.0.0",
    "rollup-plugin-svelte": "^5.0.3",
    "rollup-plugin-terser": "^5.1.2",
    "svelte": "^3.0.0",
    "svelte-jester": "^1.0.3"
  },
  "dependencies": {
    "sirv-cli": "^0.4.4"
  }
}
```

### Svelte Testing Library Setup

To use the Svelte Testing Library, the `@testing-library/svelte` package has to be installed.

```bash
npm install @testing-library/svelte --D
```

### Writing a test

After all the setup, we can start writing tests.

The test will look familiar to you if you've already used a Testing Library.

- to create the component, use the [`render`](https://testing-library.com/docs/svelte-testing-library/api#render) method
- to interact with the component, use the `get(All)By` and `query(All)By` methods, and the methods on `fireEvent`
- as a bonus, use the [jest-dom](https://testing-library.com/docs/ecosystem-jest-dom) matchers

```js:counter.spec.js
import Counter from './Counter.svelte'
import { render, fireEvent } from '@testing-library/svelte'

it('it works', async () => {
  const { getByText, getByTestId } = render(Counter)

  const increment = getByText('increment')
  const decrement = getByText('decrement')
  const counter = getByTestId('counter-value')

  await fireEvent.click(increment)
  await fireEvent.click(increment)
  await fireEvent.click(increment)
  await fireEvent.click(decrement)

  expect(counter.textContent).toBe('2')

  // with jest-dom
  expect(counter).toHaveTextContent('2')
})
```

To pass props to a component, make use of the [Component Options](https://testing-library.com/docs/svelte-testing-library/api#component-options)

```js:counter.spec.js
import Counter from './Counter.svelte'
import { render, fireEvent } from '@testing-library/svelte'

it('it works', async () => {
  const { getByText, getByTestId } = render(Counter, {
    value: 10,
  })

  const increment = getByText('increment')
  const decrement = getByText('decrement')
  const counter = getByTestId('counter-value')

  await fireEvent.click(increment)
  await fireEvent.click(increment)
  await fireEvent.click(increment)
  await fireEvent.click(decrement)

  expect(counter.textContent).toBe('12')

  // with jest-dom
  expect(counter).toHaveTextContent('12')
})
```

### Running tests

Everything is set, and now we can finally run the tests.
Run the following command:

```bash
npm run test
```
