---
title: Parameterized selectors
slug: parameterized-selectors
description: How can I select an entity from the store by its id?
author: Tim Deschryver
date: 2018-05-07T13:58:02.917Z
tags: NgRx, Redux, Angular
banner: ./images/banner.jpg
bannerCredit: Photo by [Ryan Grewell](https://unsplash.com/@ryangrewell) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
---

> How can I select an entity from the store by its id?

This question popped up several times lately and in this post I’ll provide some suggestions to create a selector that works with parameters, so let’s not waste any time and let’s get started!

## EDIT 2018–08–17: [NgRx 6.1](https://github.com/ngrx/platform/blob/master/CHANGELOG.md#610-2018-08-01)

> The following will be more or less a copy of the [NgRx docs](https://github.com/ngrx/platform/blob/master/docs/store/selectors.md#createselector-with-props).

As of [NgRx 6.1](https://github.com/ngrx/platform/blob/master/CHANGELOG.md#610-2018-08-01) selectors also accepts an extra `props` argument. Which means you can now define a selector as the following:

```ts
export const getCount = createSelector(
  getCounterValue,
  (counter, props) => counter * props.multiply,
)
```

Inside your component you can use the selector as usual but you can define the `props` value:

```ts
this.counter = this.store.pipe(select(fromRoot.getCount, { multiply: 2 }))
```

Keep in mind that a selector is memoized, meaning it will cache the result from the last parameters. If you would re-use the above selector but with other another `props` value, it would clear the previous cache. If both selectors would be used at the same time, as in the example below, the selector would be invoked with every `props` value, thus the memoization would be more or less useless.

```ts
this.counter2 = this.store.pipe(
  select(fromRoot.getCount, { id: 'counter2', multiply: 2 }),
)
this.counter4 = this.store.pipe(
  select(fromRoot.getCount, { id: 'counter4', multiply: 4 }),
)
```

Every time the counter value changes in the above example, the selector would be invoked 2 times, one time for `counter2`, the other time for `counter4`. To allow memoization we can use a factory function to create the selector.

```ts
export const getCount = () =>
  createSelector(
    (state, props) => state.counter[props.id],
    (counter, props) => counter * props.multiply,
  )
```

And in our component we can invoke the factory function `fromRoot.getCount()` to create a new selector instance for each counter, allowing each instance to have its own cache.

```ts
this.counter2 = this.store.pipe(
  select(fromRoot.getCount(), { id: 'counter2', multiply: 2 }),
)
this.counter4 = this.store.pipe(
  select(fromRoot.getCount(), { id: 'counter4', multiply: 4 }),
)
```

## Static parameter

If the parameter doesn’t change over time we can use a [factory function](https://medium.com/javascript-scene/javascript-factory-functions-with-es6-4d224591a8b1) `selectCustomer` which has a parameter `id` and returns a selector. Making it possible to use the `id` parameter in our selector to retrieve the customer, resulting in the following:

```ts
export const selectCustomer = (id: string) =>
  createSelector(selectCustomers, customers => customers[id])
```

We can then call `selectCustomer` in the component and pass it an `id`:

```ts
this.customer = store.pipe(select(customers.selectCustomer('47')))
```

## Dynamic parameter

If the `id` parameter is dynamic we can create a selector that instead of returning customers, returns a function which expects a parameter `id`. The selector becomes:

```ts
export const selectCustomer = createSelector(
  selectCustomers,
  customers => (id: string) => customers[id],
)

// tip: it’s also possible to memoize the function if needed
export const selectCustomer = createSelector(selectCustomers, customers =>
  memoize((id: string) => customers[id]),
)
```

And in our component:

```ts
this.customers = this.store.pipe(select(customers.selectCustomer))
```

For this example I’m also going to show the html, because it’s maybe not that straight forward. Because the selector returns a function now, we can call it like a normal function in our html:

```html
{{ (customers | async)(id).name }}
```

To overcome this syntax inside the HTML we can also solve this with the RxJS `map` operator, as mentioned by [Juliano Pável](https://medium.com/u/727c16f25ce2).

```ts
this.customer = store.pipe(
  select(customers.selectCurrentCustomer),
  map(fun => fun(this.customerId)),
)
```

> Aaaand that’s it, ship it! Or maybe not that fast… While this example works, to me selecting a part from the store like this feels a bit dirty and I consider it a bad practice in most of the cases. In my opinion the `id` parameter should exist somewhere in the store.

## Dispatching a select action

This way works with a property `selectedCustomerId` in the store. To select a customer we first have to fire an action `SelectCustomer` with the customer’s `id` as payload to set the `selectedCustomerId` in the store.

this.store.dispatch(new SelectCustomer(customer.id))

We also have to create a selector `selectSelectedCustomerId` to select the `selectedCustomerId`. Because selectors are composable we can now use both selectors to get the selected customer in `getSelectedCustomer`. The selector now looks like this:

```ts
export const selectSelectedCustomerId = createSelector(
  selectCustomerEntities,
  fromCustomers.selectedCustomerId,
)

export const getSelectedCustomer = createSelector(
  selectCustomers,
  selectSelectedCustomerId,
  (customers, selectedId) => customers[selectedId],
)
```

And in the component we can use the selector the ‘usual way’:

```ts
this.customer = store.pipe(select(customers.getSelectedCustomer))
```

## NgRx/Router-Store

Another possibility would be to use [@ngrx/router-store](https://github.com/ngrx/platform/blob/master/docs/router-store/README.md), this module connects the route with the store. In other words, all the route information will be available in the store thus also in the selectors. After installing the `ngrx/router-store` module and having it imported in our `AppModule`, we’ll first have to create a selector `selectRouteParameters` to retrieve the route parameters _(_`_customerId_` _in our case)._ Thereafter we can use the created selector in `selectCurrentCustomer` to select the current customer. This means that when a user clicks on a link or navigates directly to `/customers/47`, he or she would see the customer’s details of customer 47. The selector looks roughly the same:

```ts
export const selectRouterState = createFeatureSelector<RouterReducerState>(
  'router',
)

export const selectRouteParameters = createSelector(
  selectRouterState,
  router => router.state.root.firstChild.params,
)

export const selectCurrentCustomer = createSelector(
  selectCustomers,
  selectRouteParameters,
  (customers, route) => customers[route.customerId],
)
```

And the component remains the same (except for the selector’s name):

```ts
this.customer = store.pipe(select(customers.selectCurrentCustomer))
```

## That’s a wrap

In my opinion the code we ended up with looks cleaner than the code we started of with. I hope this was useful if you were looking for a way to parameterize your selector.

## Some extra resources

- [NgRx Selectors How to stop worrying about your Store structure — David East & Todd Motto @ ng-conf 2018](https://www.youtube.com/watch?v=Y4McLi9scfc) - the last part will show you an example with `ngrx/router-store`, but the whole talk is 👍👍
- [The](https://github.com/reduxjs/reselect/#q-how-do-i-create-a-selector-that-takes-an-argument) [reduxjs](https://github.com/reduxjs)/[reselect](https://github.com/reduxjs/reselect) [docs about parameterization with](https://github.com/reduxjs/reselect/#q-how-do-i-create-a-selector-that-takes-an-argument) [`createSelector`](https://github.com/reduxjs/reselect/#q-how-do-i-create-a-selector-that-takes-an-argument)
