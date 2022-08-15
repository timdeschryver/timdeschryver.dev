---
title: Normalizing state
slug: normalizing-state
description: A quick look at state normalization.
author: Tim Deschryver
date: 2018-04-30T14:08:47.867Z
tags: NgRx, Redux, Angular
---

_A quick look at state normalization._

## Why

- **No data duplication**, it will reduce the possibility of inconsistent data.
- **Faster data access**, no more iterating over arrays or nested objects.
- **Easier object-to-data mapping**, there is a loose coupling between entities.

## What

A normalized state is a way to store (organize) data. With this way each entity type will have its own place in the store, so that there is only a **single point of truth**. This practice is the recommended way to organize data in a Redux application as you can read in the [Redux recipes](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape).

## How

- Each entity type will be stored separately, no more nested objects.
- Store an entity as an object, with the id as key.
- Reference other entities by id, again no more nested objects.

## Now let’s put this into practice

The snippet below is an example of a typical store, the state contains of a customers array and a selected customer. Notice when a customer has changed we have to iterate over every customer to update the _to be edited_ customer, plus we also have to update the selected customer if needed. Imagine having even more places to update the same customer, must be a pain right? Note that this is only a simple illustration, but this problem keeps ramping up whenever a reference to customers is added. And what if another person (read you) forgets to update the customer at one place… your application will have inconsistent data and you can already guess who has to solve this bug.

```ts
export interface State {
	customers: Customer[];
	selectedCustomer: Customer[];
}

export function reducer(state, action) {
	switch (action.typed) {
		case '[CUSTOMER DETAIL PAGE] Edit Customer':
			return {
				customers: state.customers.map((c) => (c.id === action.payload.id ? action.payload : c)),
				selectedCustomer:
					state.selectedCustomer && state.selectedCustomer.id === action.payload.id
						? action.payload
						: state.selectedCustomer,
			};

		default:
			return state;
	}
}

export const selectedCustomers = createSelector(selectCustomersState, (state) => state.customers);

export const selectedSelectedCustomers = createSelector(
	selectCustomersState,
	(state) => state.selectedCustomer,
);
```

With a normalized state we can safely edit a customer in one place, without having to wonder if there’s another place where we might have to update the same customer. Because the customer id is functioning as key we can use the [object spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to edit (or add) a customer without having to iterate over every customer. All good and well but what if we want to iterate over entities in our UI, wouldn’t that be a real hassle because these are objects now? Well… that’s where selectors come into play. With a selector we can expose entities in a way that our UI needs. In our example below we will select the customers and we will convert these into an array, because we want to display them in a list and it’s easier to use an array with a `ngFor`. If we want to select a specific customer we can access the customer based of its id, this comes with the benefit that we won’t have to iterate over our whole list to find a customer. This means no more doing `customers.find(c => c.id === id)`, which will be beneficial to our performance when working with big lists.

```ts
export interface State {
	customers: { [id: string]: Customer };
	selectedCustomerId: string;
}

export function reducer(state, action) {
	switch (action.typed) {
		case '[CUSTOMER DETAIL PAGE] Edit Customer':
			return {
				...state,
				customers: {
					...state.customers,
					[action.payload.id]: action.payload,
				},
			};

		default:
			return state;
	}
}

export const selectedCustomers = createSelector(selectCustomersState, (state) =>
	Object.values(state.customers),
);

export const selectedSelectedCustomers = createSelector(
	selectCustomersState,
	(state) => state.customers[state.selectedCustomerId],
);
```

## Bonus: NgRx/entity

> An entity state adapter for managing record collections. It provides performant CRUD operations for managing entity collections.

NgRx/entity is a part of NgRx and is created by the NgRx team. Under the hood it will store your data in a normalized way. To have a closer look you can checkout the [docs](https://ngrx.io/guide/entity) and if you want an example you can checkout the [books reducer](https://github.com/ngrx/platform/blob/master/example-app/app/books/reducers/books.reducer.ts) in the NgRx [example app](https://github.com/ngrx/platform/tree/master/example-app).
