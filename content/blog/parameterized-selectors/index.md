---
title: Parameterized selectors
slug: parameterized-selectors
description: How can I select an entity from the store by its id?
author: Tim Deschryver
date: 2018-05-07T13:58:02.917Z
tags: NgRx, Redux, Angular, State
banner: ./images/banner.jpg
bannerCredit: Photo by [Ryan Grewell](https://unsplash.com/@ryangrewell) on [Unsplash](https://unsplash.com)
published: true
---

"How can I select an entity from the store by its id?"

This question popped up several times lately and in this post, I’ll provide some suggestions to create a selector that works with parameters, so let’s not waste any time, and let’s get started!

## EDIT 2018–08–17: [NgRx 6.1](https://github.com/ngrx/platform/blob/master/CHANGELOG.md#610-2018-08-01)

> The following will be more or less a copy of the [NgRx docs](https://ngrx.io/guide/store/selectors#using-selectors-with-props).

As of [NgRx 6.1](https://github.com/ngrx/platform/blob/master/CHANGELOG.md#610-2018-08-01) selectors also accepts an extra `props` argument. Which means you can now define a selector as the following:

```ts:selector.ts
export const getCount = createSelector(
  getCounterValue,
  (counter, props) => counter * props.multiply,
)
```

Inside your component you can use the selector as usual but you can define the `props` value:

```ts:component.ts
counter$ = this.store.select(fromRoot.getCount, { multiply: 2 })
```

Keep in mind that a selector is memoized, meaning it will cache the result from the last parameters. If you would re-use the above selector but with another `props` value, it would clear the previous cache. If both selectors would be used at the same time, as in the example below, the selector would be invoked with every `props` value, thus the memoization would be more or less useless.

```ts:component.ts
counter2$ = this.store.select(fromRoot.getCount, {
  id: 'counter2',
  multiply: 2,
})
counter4$ = this.store.select(fromRoot.getCount, {
  id: 'counter4',
  multiply: 4,
})
```

Every time the counter value changes in the above example, the selector would be invoked 2 times, one time for `counter2`, the other time for `counter4`. To allow memoization we can use a factory function to create the selector.

```ts:selector.ts
export const getCount = () =>
  createSelector(
    (state, props) => state.counter[props.id],
    (counter, props) => counter * props.multiply,
  )
```

And in our component we can invoke the factory function `fromRoot.getCount()` to create a new selector instance for each counter, allowing each instance to have its own cache.

```ts:selector.ts
counter2$ = this.store.select(fromRoot.getCount(), {
  id: 'counter2',
  multiply: 2,
})
counter4$ = this.store.select(fromRoot.getCount(), {
  id: 'counter4',
  multiply: 4,
})
```

## Static parameter

If the parameter doesn’t change over time we can use a [factory function](https://medium.com/javascript-scene/javascript-factory-functions-with-es6-4d224591a8b1) `selectCustomer` which has a parameter `id` and returns a selector. Making it possible to use the `id` parameter in our selector to retrieve the customer, resulting in the following:

```ts:customers.selectors.ts
export const selectCustomer = (id: string) =>
  createSelector(selectCustomers, (customers) => customers[id])
```

We can then call `selectCustomer` in the component and pass it an `id`:

```ts:customer.component.ts
class CustomersComponent {
  customer$ = store.select(customers.selectCustomer('47'))
}
```

## Dynamic parameter

If the `id` parameter is dynamic we can create a selector that instead of returning customers, returns a function which expects a parameter `id`. The selector becomes:

```ts:customers.selectors.ts
export const selectCustomer = createSelector(
  selectCustomers,
  (customers) => (id: string) => customers[id],
)

// tip: it’s also possible to memoize the function if needed
export const selectCustomer = createSelector(selectCustomers, (customers) =>
  memoize((id: string) => customers[id]),
)
```

And in our component:

```ts:customer.component.ts
class CustomersComponent {
  customers$ = this.store.select(customers.selectCustomer)
}
```

For this example, I’m also going to show the HTML, because it’s maybe not that straight forward. Because the selector returns a function now, we can call it like a normal function in our HTML:

```html:customer.component.html
{{ (customers$ | async)(id).name }}
```

To overcome this syntax inside the HTML we can also solve this with the RxJS `map` operator, as mentioned by [Juliano Pável](https://medium.com/u/727c16f25ce2).

```ts:customer.component.ts
class CustomersComponent {
  customer$ = store
    .select(customers.selectCurrentCustomer)
    .pipe(map((fun) => fun(this.customerId)))
}
```

## Filtering data in the component (within the RxJS stream)

We can also hook into the RxJS stream and map/filter our selector result by using one or more RxJS operators.
In the snippet below, we select all the customers from the store and retrieve the current customer from it.

```ts:customer.component.ts
class CustomersComponent {
  customer$ = store
    .select(customers.selectCurrentCustomer)
    .pipe(map((customers) => customers[this.customerId]))
}
```

This approach does have a few drawbacks:

- it's different than other selectors, the projection logic is spread in the selector and in the component
- it's harder to test
- it's not that performant but in most cases, you won't notice the difference

## Using Global Store State

While the above examples work, for me retrieving data from the store like this feels a bit dirty and I consider it a bad practice in most cases. In my opinion, it's better to persist this "filter" state in the store, in our example it would mean that the `id` parameter would exist somewhere in the store.

This has the benefit that we're going to be fully reactive.
When the filter's state changes, the selectors will be re-invoked (with the updated state), and our component will receive the new filtered state.

To implement this we must define actions that we can dispatch whenever a filter (the customer's id) changes. For example when the user clicks on a customer or when the user navigates to a customer's page, we dispatch an action. These actions are updating the `selectedCustomerId` property in the store state.

```ts{3-6}:customers.reducer.ts
const reducer = createReducer(
  initialState,
  on(customerClicked, customPageLoaded, (state, action) => ({
    ...state,
    selectedCustomerId: action.customerId,
  })),
)
```

We also have to create a selector `selectSelectedCustomerId` to select the `selectedCustomerId` from the state. Because selectors are composable we can use both selectors to get the selected customer in the `selectSelectedCustomer` selector.
The selectors looks like this:

```ts:customers.selectors.ts
export const selectSelectedCustomerId = createSelector(
  selectCustomerEntities,
  fromCustomers.selectedCustomerId,
)

export const selectSelectedCustomer = createSelector(
  selectCustomers,
  selectSelectedCustomerId,
  (customers, selectedId) => customers[selectedId],
)
```

In the component, we can consume the selector the ‘usual way’ without having to worry about the customer's id.

```ts:customer.component.ts
class CustomersComponent {
  customer$ = store.select(customers.selectSelectedCustomer)
}
```

In the future when we have another filter, or when we add an action that changes the filter we don't have to worry about displaying the correct data in the component. It will just work because this selector is entirely driven my the Store's state.

## NgRx Router Store

Another possibility would be to use [@ngrx/router-store](https://ngrx.io/guide/router-store), this module connects the route with the store. In other words, all the route information will be available in the store thus also in the selectors. After installing the `ngrx/router-store` module and having it imported in our `AppModule`, we’ll first have to create a selector `selectRouteParameters` to retrieve the route parameters (`customerId` in our case). Thereafter we can use the created selector in `selectCurrentCustomer` to select the current customer. This means that when a user clicks on a link or navigates directly to `/customers/47`, she or he would see the customer’s details of customer 47. The selector looks roughly the same:

```ts:customers.selectors.ts
export const selectRouterState = createFeatureSelector<RouterReducerState>(
  'router',
)

export const selectRouteParameters = createSelector(
  selectRouterState,
  (router) => router.state.root.firstChild.params,
)

export const selectCurrentCustomer = createSelector(
  selectCustomers,
  selectRouteParameters,
  (customers, route) => customers[route.customerId],
)
```

And the component remains the same (except for the selector’s name):

```ts:customer.component.ts
class CustomersComponent {
  customer$ = store.select(customers.selectCurrentCustomer)
}
```

## That’s a wrap

In my opinion the code we ended up with looks cleaner than the code we started with. I hope this was useful if you were looking for a way to parameterize your selector.

## Some extra resources

- [NgRx Selectors How to stop worrying about your Store structure — David East & Todd Motto @ ng-conf 2018](https://www.youtube.com/watch?v=Y4McLi9scfc) - the last part will show you an example with `ngrx/router-store`
- [The](https://github.com/reduxjs/reselect/#q-how-do-i-create-a-selector-that-takes-an-argument) [reduxjs](https://github.com/reduxjs)/[reselect](https://github.com/reduxjs/reselect) [docs about parameterization with](https://github.com/reduxjs/reselect/#q-how-do-i-create-a-selector-that-takes-an-argument) [`createSelector`](https://github.com/reduxjs/reselect/#q-how-do-i-create-a-selector-that-takes-an-argument)
