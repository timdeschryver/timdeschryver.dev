---
title: How I test my NgRx selectors
slug: how-i-test-my-ngrx-selectors
description: Let us explore which methods I'm using to test my NgRx selectors.
author: Tim Deschryver
date: 2018-06-25T12:52:24.995Z
tags: NgRx, Redux, Angular
banner: ./images/banner.jpg
bannerCredit: Photo by [Geran de Klerk](https://unsplash.com/@geran) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
publish_url: https://blog.angularindepth.com/how-i-test-my-ngrx-selectors-c50b1dc556bc
---

In this post I’m going to show you how I test my selectors by putting the selectors from a previous post [Clean NgRx reducers using Immer](./posts/clean-ngrx-reducers-using-immer), where we created a small shopping cart application, under test. In the application there is a collection of products (the catalog) and the cart items, together they form the state of the application.

```json
{
  "catalog": {
    "products": {
      "PRODUCT-AAA": {
        "sku": "PRODUCT-AAA",
        "name": "name-PRODUCT-AAA",
        "price": 1,
        "image": "image-PRODUCT-AAA"
      },
      "PRODUCT-BBB": {
        "sku": "PRODUCT-BBB",
        "name": "name-PRODUCT-BBB",
        "price": 1,
        "image": "image-PRODUCT-BBB"
      },
      "PRODUCT-CCC": {
        "sku": "PRODUCT-CCC",
        "name": "name-PRODUCT-CCC",
        "price": 1,
        "image": "image-PRODUCT-CCC"
      }
    },
    "productSkus": ["PRODUCT-AAA", "PRODUCT-BBB", "PRODUCT-CCC"]
  },
  "cart": { "cartItems": { "PRODUCT-AAA": 3, "PRODUCT-CCC": 0 } }
}
```

### What exactly is a selector

A selector is a [pure function](https://medium.com/javascript-scene/master-the-javascript-interview-what-is-a-pure-function-d1c076bec976) that takes the state as an argument and returns a slice of the store state. You can see the selectors in an application as queries to retrieve slices of store state. Besides using selectors inside your components it is also possible to re-use selector functions inside other selectors.

> A function is pure when:  
> \- Given the same input, it always return the same output  
> \- Produces no side effects

Because selectors are pure functions, it can use an optimization technique called memoization. Meaning that the selector will store the outputs in a cache, if the selector gets called again with the same input it doesn’t have to re-execute the select function but it immediately can return the cached output.

These are the selectors which are used in the shopping cart application:

```ts
export const getCatalogState = createFeatureSelector<fromCatalog.State>('catalog')
export const getProducts = createSelector(
  getCatalogState,
  catalog => catalog.products,
)
export const getProductSkus = createSelector(
  getCatalogState,
  catalog => catalog.productSkus,
)
export const getCatalog = createSelector(
  getProductSkus,
  getProducts,
  (skus, products) => skus.map(sku => products[sku]),
)

export const getCartState = createFeatureSelector<fromCart.State>('cart')
export const getCartItems = createSelector(
  getCartState,
  cart => cart.cartItems,
)

export const getAllCartSummary = createSelector(
  getProducts,
  getCartItems,
  (products, cart): CartItem[] =>
    Object.keys(cart).map(sku => ({
      product: products[sku],
      amount: cart[sku],
    })),
)
export const getCartSummary = createSelector(
  getAllCartSummary,
  cart => cart.filter(item => item.amount > 0),
)
```

If you’re interested in the whole application you can take a look at the [GitHub repository](https://github.com/timdeschryver/ngrx-immer/tree/ngrx).

### Update

A couple of months after I’ve written this post, I had the pleasure to refactor some parts of the application I was working on. This application had a fairly amount of selector tests. During the refactor, a lot of the time was spent on keeping the selector tests green.

In these months I’ve learned some tips and tricks on how to write tests, but more important on **what** to test. A selector is an implementation detail and in most of the cases, you don’t what to test these. I’ve learned that if there are tests on the components, it’s often enough to cover mainly all of the selectors. This is because the component uses these selectors.

Doing this has the benefit that you won’t have to maintain these selector tests over time, and you still have the confidence that the component’s do their job.  
I do still test the more complicated selectors, e.g. selectors with calculations inside of them. To write these tests I still use the methods mentioned below.

### Setting up test state with factory functions

Before we’re going to create the tests, let’s create some factory functions to set up our state in each test.

```ts
const createProduct = ({ sku = '', name = '', image = '', price = 1 } = {}): Product => ({
  sku: sku,
  name: name || `name-${sku}`,
  price,
  image: image || `image-${sku}`,
})

const createCatalogState = ({
  products = {
    'PRODUCT-AAA': createProduct({ sku: 'PRODUCT-AAA' }),
    'PRODUCT-BBB': createProduct({ sku: 'PRODUCT-BBB' }),
    'PRODUCT-CCC': createProduct({ sku: 'PRODUCT-CCC' }),
  },
  productSkus = ['PRODUCT-AAA', 'PRODUCT-BBB', 'PRODUCT-CCC'],
} = {}) => ({
  catalog: {
    products,
    productSkus,
  },
})

const createCartState = ({
  cartItems = {
    'PRODUCT-AAA': 3,
    'PRODUCT-CCC': 0,
  },
} = {}) => ({
  cart: {
    cartItems,
  },
})

const createState = ({ catalog = createCatalogState(), cart = createCartState() } = {}): State => ({
  ...catalog,
  ...cart,
})
```

I use (and like) this approach to prevent fragile tests, because of the following reasons:

- Every test creates its own isolated state, there is no global state
- It’s possible to override specific properties if needed, but a default state is provided

### Testing approach #1: “Default”

This is probably the most familiar way of testing selectors, it boils down to calling the selectors with the created state. The assertions are written based on the output of the selector to ensure it is returning the right data. There is actually nothing special to say here, so I’ll just show the test cases.

```ts
test('getProducts', () => {
  const state = createCatalogState()
  expect(getProducts(state)).toBe(state.catalog.products)
})

test('getProductSkus', () => {
  const state = createCatalogState()
  expect(getProductSkus(state)).toBe(state.catalog.productSkus)
})

test('getCatalog', () => {
  const state = createCatalogState()
  expect(getCatalog(state).length).toBe(3)
})

test('getCartItems', () => {
  const state = createCartState()
  expect(getCartItems(state)).toBe(state.cart.cartItems)
})

test('getAllCartSummary', () => {
  const state = createState()
  expect(getAllCartSummary(state)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        product: expect.objectContaining({
          sku: 'PRODUCT-AAA',
        }),
      }),
      expect.objectContaining({
        product: expect.objectContaining({
          sku: 'PRODUCT-CCC',
        }),
      }),
    ]),
  )
})

test('getCartSummary', () => {
  const state = createState()
  expect(getCartSummary(state)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        product: expect.objectContaining({
          sku: 'PRODUCT-AAA',
        }),
      }),
    ]),
  )
})
```

> We can make use of a reference equality -`toBe` - because the selector simply returns a slice of the store state. These selectors are called getter selectors.

### Testing Approach #2: Snapshots

I tend to find the above way repeatable some times, especially for the simpler selectors which don’t contain any logic. Because there is no logic, we can assume that the selector always returns the same output for the same type of input.

In my opinion these selectors are perfect for a snapshot test. A snapshot test creates a snapshot from the selector output the first time the test is run, the second time the same test is run it will compare the current output to the snapshot’s version. The test passes if the versions are identical, if these are not, you can either fix the selector or update the snapshot if needed.

For these tests I’m using a different way to create the tests. The first step is to create a `testCases` array. Each test case has a name (this is the name of the test), the selector function to put under test and the state which is the input of the selector. With the test cases in place, I’m going to loop over each one of them and I’m going to invoke the selector with the state, the output is used to create the snapshot.

> NOTE: the tests below are written with Jest and not with Jasmine. In order to make use of snapshot testing with Jasmine, you’ll have to install a library.

```ts
const testCases = [
  {
    name: 'getProducts',
    selector: getProducts,
    state: createCatalogState(),
  },
  {
    name: 'getProductSkus',
    selector: getProductSkus,
    state: createCatalogState(),
  },
  {
    name: 'getCatalog',
    selector: getCatalog,
    state: createCatalogState(),
  },
  {
    name: 'getCartItems',
    selector: getCartItems,
    state: createCartState(),
  },
  {
    name: 'getAllCartSummary',
    selector: getAllCartSummary,
    state: createState(),
  },
  {
    name: 'getCartSummary',
    selector: getCartSummary,
    state: createState(),
  },
]

testCases.forEach(({ name, state, selector }) => {
  test(`${name} with input ${JSON.stringify(state)}`, () => {
    expect(selector(state)).toMatchSnapshot()
  })
})
```

The `getCartItems` snapshot looks like:

```ts
exports[`getCartItems with input {"cart":{"cartItems":{"PRODUCT-AAA":3,"PRODUCT-CCC":0}}} 1`] = `  
Object {  
  "PRODUCT-AAA": 3,  
  "PRODUCT-CCC": 0,  
}  
`
```

> TIP: It could be helpful to add the state in the test description by using `JSON.stringify`.

### Testing Approach #3: Projector

```ts
test('getCartSummary only shows products with an amount', () => {
  const cartItems: CartItem[] = [
    {
      amount: 1,
      product: createProduct({ sku: 'foo' }),
    },
    {
      amount: 0,
      product: createProduct({ sku: 'bar' }),
    },
    {
      amount: 2,
      product: createProduct({ sku: 'baz' }),
    },
  ]

  expect(getCartSummary.projector(cartItems)).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        product: expect.objectContaining({
          sku: 'foo',
        }),
      }),
      expect.objectContaining({
        product: expect.objectContaining({
          sku: 'baz',
        }),
      }),
    ]),
  )
})
```

I use this approach when I’m dealing with selectors that need a lot of state setup or if the selector contains some logic.

A reason why you would need to setup a whole state tree, would be when you’re testing a selector that uses the output from several other selectors and derives some state from these outputs. These kind of selectors are named derive selectors.

Luckily NgRx provides a way to skip these large setups with a `projector` function. Every selector has a `projector` function that you can use in order to skip the execution from the other selectors and directly pass their outputs to the selector.

If we take a look at the `getCartSummary` selector, it uses the `getAllCartSummary` selector, which in turn uses the `getProducts` and `getCartItems` selectors. If we wouldn’t take advantage of the `projector` function, we would have to setup the whole state. In this little application it’s doable but in larger application this can be time consuming and even worse, it can be the cause of fragile tests, this is what I (and you should too) want to avoid.

As shown in the example below, I’m setting up the output that otherwise would be returned from `getAllCartSummary`, this output is passed to the `getCartSummary` selector by using the `projector` function.

This approach is also useful if you have some logic inside your selector. For example if you need to filter out specific items based on different properties, you can create a different state _(which is easy because you’re using factory functions now)_ for each scenario.

### Conclusion

- A selector can be **unit** tested, you don’t need a (mocked) store in order to test your selectors.
- Use factory functions to setup state in order to prevent fragile tests.
- Each one of these approaches has its use case to test your selectors in a NgRx application.

### Not to miss

Come check out [ngx-testing-library](https://github.com/timdeschryver/ngx-testing-library), an Angular testing library to test Angular components I wrote last week. The library is based on the [dom-testing-library](https://github.com/kentcdodds/dom-testing-library) from [Kent C. Dodds](https://twitter.com/kentcdodds).

[🚨 Introducing ngx-testing-library 🚨](./posts/introducing-ngx-testing-library)
