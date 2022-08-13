---
title: Parameterized NgRx Selectors
slug: parameterized-selectors
description: NgRx Selectors with Props
author: Tim Deschryver
date: 2018-05-07
tags: NgRx, Redux, Angular, State
---

"How can I select an entity from the store by its id?"

This question popped up several times lately and in this post, I’ll provide some suggestions to create a selector that works with parameters, so let’s not waste any time, and let’s get started!

## Update 2021-05-09

Selectors with props [will be deprecated in NgRx v12](https://ngrx.io/guide/migration/v12), more information behind this decision can be found in the following [GitHub issue](https://github.com/ngrx/platform/issues/2980).

## Factory selectors

To pass a parameter to a selector we must wrap the selector in a factory method, this is what I call a factory selector.
Throughout this post we'll use a simple example, which is a selector that returns a customer from the global store state based on a passed id parameter.

The simplest implementation is a factory selector `selectCustomer` with a parameter `id` that returns the selector created by using the `createSelector` method. The selector uses the `id` parameter to retrieve the customer by the passed id in the projector.

```ts:customers.selectors.ts
export const selectCustomer = (id: string) =>
  createSelector(selectCustomers, (customers) => customers[id]);
```

In the component, the selector `selectCustomer` is used as a normal selector, but we must pass a parameter to the selector.
This results that the customer with id 47 is selector from the global store state.

```ts:customer.component.ts
class CustomerComponent {
  customer$ = this.store.select(customers.selectCustomer('47'));
}
```

### Child Selectors with Props

If you need to pass a selector to a child selector, how would you do that?
This is actually not that hard to implement.
Because a factory selector is simply a method, it can be invoked from a parent selector.

In the example below, `selectCustomerOrders` is a factory selector that receives a customer id, and the selector invokes the factory selectors `selectCustomer` and `selectCustomerOrders` with the given customer id as parameter.
With the results from both selectors, the selector creates a new object that consists of the customer and the customers' orders.

```ts:customers.selectors.ts
export const selectCustomerOrders = (customerId: string) =>
	createSelector(
		selectCustomer(customerId),
		selectCustomerOrders(customerId),
		(customer, orders) => ({
			customer,
			orders
		})
	);
```

### Memoization

In contrast to a normal NgRx selector where the selector is shared across multiple components, we now have a new instance of the selector every time the selector factory is invoked. This has the effect that we lose the memoization benefits of the selector.

**For most cases this is fine and you won't notice the difference.**
**But when the selector has to so expensive work, you can add a memoization layer on top as a countermeasure.**

To accomplish this, we must bring our own memoization method to the table, for example [lodash.memoize](https://www.npmjs.com/package/lodash.memoize). After this, we can simply wrap the selector inside of the `memoize` method. Note that this is a simple example and that you probably don't need to memoize an entity lookup.

```ts:customers.selectors.ts
import memoize from 'lodash.memoize'

export const selectCustomer = memoize((id: string) =>
  createSelector(selectCustomers, (customers) => customers[id])
);
```

By doing this, consuming the selector is no different than before.
It's important to keep in mind that this builds up an in-memory cache, so that's why it's better that the added entry is disposed of when it's possible.

```ts:customer.component.ts
class CustomerComponent {
  customer$ = this.store.select(customers.selectCustomer('47'));
}
```

## What About Using Global Store State

While the above examples do provide an answer to the question on how to select a slice of the state based on a parameter, for me retrieving data from the store like this feels a bit dirty and I consider it a bad practice in most cases. In my opinion, it's better to persist this property in the global store. In our example, it would mean that the `id` parameter of the selected customer would be added to the global store.

This has the benefit that we're going to be fully reactive.
When the property state changes, the selectors will be re-invoked (with the updated state), and our component will receive the new state that fits the criteria based on these "filter" properties.

To implement this in the global store, we first define actions to dispatch when a filter (the customer's id) changes. For example when the user clicks on a customer or when the user navigates to a customer's page, we dispatch an action.

The reducer below reacts to the `customerClicked` action to update the `selectedCustomerId` property in the global store state.

```ts{3-6}:customers.reducer.ts
const reducer = createReducer(
	initialState,
	on(customerClicked, customPageLoaded, (state, action) => ({
		...state,
		selectedCustomerId: action.customerId
	}))
);
```

We also have to create a selector `selectSelectedCustomerId` to access the selected id from the global state.

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

In the component, we consume the selector without having to worry about the customer's id.
In larger components with more filters, this refactor makes the component and the selector easier to maintain.

```ts:customer.component.ts
class CustomerComponent {
  customer$ = this.store.select(customers.selectSelectedCustomer);
}
```

In the future when there's a change to the filters that affect the result of the selector, we don't have to worry about having to change how we invoke the selector to show the correct data in the component. It will just work because this selector is entirely driven by the Store's state.

## A Better Solution With NgRx Router Store

Another possibility is to use [@ngrx/router-store](https://ngrx.io/guide/router-store). This module connects the Angular router module with the NgRx global store. In other words, all the route information will be available in the store and thus also in the [selectors](https://ngrx.io/guide/router-store/selectors).

To use the state of the URL, we make use of the `getSelectors` method to create all the router store selectors.
In the example below, we then use the `selectRouteParams` selector to read the customer id from the URL, e.g. https//localhost:4200/customers/47.

```ts:customers.selectors.ts
import { createFeatureSelector } from '@ngrx/store';
import { getSelectors, RouterReducerState } from '@ngrx/router-store';

const selectRouterState = createFeatureSelector<RouterReducerState>('router');
const { selectRouteParams } = getSelectors(selectRouterState);

export const selectCurrentCustomer = createSelector(
  selectCustomers,
  selectRouteParams,
  (customers, { customerId }) => customers[customerId]
);
```

Nothing has changed to consume the selector.

```ts:customer.component.ts
class CustomerComponent {
  customer$ = this.store.select(customers.selectCurrentCustomer);
}
```

## That’s a wrap

In my opinion, the code we ended up doesn't only look cleaner but also is more manageable in comparison with the code we that we started with.
An additional benefit with using `@ngrx/router-store` is that the parameters are persisted in the URL, and that you can share the URL.
