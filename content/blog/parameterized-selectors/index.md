---
title: Parameterized selectors
slug: parameterized-selectors
description: How can I select an entity from the store by its id?
author: Tim Deschryver
date: 2018-05-07
tags: NgRx, Redux, Angular, State
banner: ./images/banner.jpg
published: true
---

"How can I select an entity from the store by its id?"

This question popped up several times lately and in this post, I’ll provide some suggestions to create a selector that works with parameters, so let’s not waste any time, and let’s get started!

## Update 2021-05-09

Selectors with props [will be deprecated in NgRx v11](https://github.com/ngrx/platform/issues/2980).
Use a [factory selector](#factory-selector) to select state based on a parameter.

## Factory selector

If the parameter doesn’t change over time we can use a [factory function](https://medium.com/javascript-scene/javascript-factory-functions-with-es6-4d224591a8b1). In the next example, the factory selector `selectCustomer` has a parameter `id` and returns a selector. We can use the `id` parameter in the selector to retrieve the customer by its id.

```ts:customers.selectors.ts
export const selectCustomer = (id: string) =>
  createSelector(selectCustomers, (customers) => customers[id]);
```

We can then call `selectCustomer` in the component and pass it an `id`:

```ts:customer.component.ts
class CustomersComponent {
  customer$ = this.store.select(customers.selectCustomer('47'));
}
```

## A selector with a dynamic parameter

If the `id` parameter is dynamic, we can create a selector that returns a function which expects the `id` parameter. The selector now becomes:

```ts:customers.selectors.ts
export const selectCustomer = createSelector(selectCustomers, (customers) => (id: string) =>
  customers[id]
);

// Tip: it’s also possible to memoize the function if needed
export const selectCustomer = createSelector(selectCustomers, (customers) =>
  memoize((id: string) => customers[id])
);
```

And in our component:

```ts:customer.component.ts
class CustomersComponent {
  customers$ = this.store.select(customers.selectCustomer)
}
```

For this example, I’m also going to show the HTML, because it’s not that straightforward.
Because the selector returns a function now, we can invoke it like a normal function in our HTML template.s

```html:customer.component.html
{{ (customers$ | async)(id).name }}
```

A better approach to invoke the selector would be to use the [RxJS `map` operator](https://rxjs.dev/api/operators/map).
For this, we select the customer, which returns the function, and then we can invoke it by providing our customer id to the function.

```ts:customer.component.ts
class CustomersComponent {
  customer$ = store
    .select(customers.selectCustomer)
    .pipe(map((fun) => fun(this.customerId)));
}
```

## Filtering data in the component

The above can also be re-written by using one or more RxJS operators.
We can extend, map, and filter a selector's result within the component.
In the snippet below, we select all the customers from the store and retrieve the current customer from it.

```ts:customer.component.ts
class CustomersComponent {
	customer$ = store
		.select(customers.selectCustomers)
		.pipe(map((customers) => customers[this.customerId]));
}
```

## Drawbacks

These approaches do have a few drawbacks:

- it's different than other selectors, the projection logic is spread in the selector and in the component
- it's harder to test
- it's less performant, but in most cases, you won't notice the difference

> Because of these drawbacks, the [NgRx ESLint Plugin](https://github.com/timdeschryver/eslint-plugin-ngrx) has two rules ([avoid-mapping-selectors](https://github.com/timdeschryver/eslint-plugin-ngrx/blob/main/docs/rules/avoid-mapping-selectors.md) and [avoid-combining-selectors](https://github.com/timdeschryver/eslint-plugin-ngrx/blob/main/docs/rules/avoid-combining-selectors.md)) to warn and to prevent using selectors like this.

Therefore, I prefer to [keep that state in the global store](#using-global-store-state) when possible.

When that isn't possible, a good middle-ground might be to go fully reactive.
This eliminates most of the drawbacks and it requires less code.
Note, that doing this might be a sign that you need a [@ngrx/component-store](https://ngrx.io/guide/component-store) 😉.

```ts:customer.component.ts
class CustomersComponent {
	customerId$ = new Subject<long>();
	customer$ = this.customerId$.pipe(
		distinctUntilChanged(),
		concatLatestFrom((customerId) => this.store.select(customers.selectCustomers(customerId)))
	);
}
```

## Using Global Store State

While the above examples answer the question on how to select state based on a parameter, for me retrieving data from the store like this feels a bit dirty and I consider it a bad practice in most cases. In my opinion, it's better to persist this "filter" state in the global store, in our example it would mean that the `id` parameter would exist somewhere in the store.

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

We also have to create a selector `selectSelectedCustomerId` to select the `selectedCustomerId` from the state.
Because selectors are composable, we're able to use both selectors to get the selected customer in the `selectSelectedCustomer` selector.

```ts:customers.selectors.ts
export const selectSelectedCustomerId = createSelector(
  selectCustomerEntities,
  fromCustomers.selectedCustomerId
);

export const selectSelectedCustomer = createSelector(
  selectCustomers,
  selectSelectedCustomerId,
  (customers, selectedId) => customers[selectedId]
);
```

In the component, we can consume the selector in the "usual way" without having to worry about the customer's id.

```ts:customer.component.ts
class CustomersComponent {
  customer$ = this.store.select(customers.selectSelectedCustomer);
}
```

In the future when we have another filter, or when we add an action that changes the filter we don't have to worry about displaying the correct data in the component. It will just work because this selector is entirely driven by the Store's state.

## NgRx Router Store

Another possibility would be to use [@ngrx/router-store](https://ngrx.io/guide/router-store), this module connects the Angular router module with the NgRx global store. In other words, all the route information will be available in the store, and thus also in the selectors.

Starting from NgRx v8, the router module also exposes a [handful of useful selectors](https://ngrx.io/guide/router-store/selectors#router-selectors) to selector route state.

```ts:customers.selectors.ts
export const selectRouterState = createFeatureSelector<RouterReducerState>('router');

export const { selectRouteParams } = getSelectors(selectRouterState);

export const selectCurrentCustomer = createSelector(
  selectCustomers,
  selectRouteParams,
  (customers, { customerId }) => customers[customerId]
);
```

For older versions of NgRx, or if you want to write this manually you can do the following.

After installing the `@ngrx/router-store` module and registering the `RouterModule`, we’ll first have to create a selector `selectRouteParameters` to retrieve the route parameters (`customerId` in our case). Thereafter we can use the created selector in `selectCurrentCustomer` to select the current customer. This means that when a user clicks on a link or navigates directly to `/customers/47`, she or he would see the customer’s details of customer 47. The selector looks roughly the same.

```ts:customers.selectors.ts
export const selectRouterState = createFeatureSelector<RouterReducerState>('router');

export const selectRouteParameters = createSelector(
  selectRouterState,
  (router) => router.state.root.firstChild.params
);

export const selectCurrentCustomer = createSelector(
  selectCustomers,
  selectRouteParameters,
  (customers, route) => customers[route.customerId]
);
```

And the component remains the same (except for the selector's name):

```ts:customer.component.ts
class CustomersComponent {
  customer$ = this.store.select(customers.selectCurrentCustomer)
}
```

## That’s a wrap

In my opinion the code we ended up with looks cleaner than the code we started with. I hope this was useful if you were looking for a way to parameterize your selector.

## Some extra resources

- [NgRx Selectors How to stop worrying about your Store structure — David East & Todd Motto @ ng-conf 2018](https://www.youtube.com/watch?v=Y4McLi9scfc) - the last part will show you an example with `@ngrx/router-store`
