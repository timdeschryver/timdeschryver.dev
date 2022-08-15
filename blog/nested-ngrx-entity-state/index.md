---
title: Nested NgRx Entity State
slug: nested-ngrx-entity-state
description: How to manage nested state with multiple NgRx entity adapters.
author: Tim Deschryver
date: 2020-11-16
tags: NgRx, Angular, State
---

Can or how do I use the [NgRx Entity package](https://ngrx.io/guide/entity) when I have a nested state?
That's a question that I've seen multiple times in the past, and last week also on the [NgRx Discord Server](https://discord.gg/gCEj4zC).

My go-to answer for that question is to not do it, but to [normalize the state](/blog/normalizing-state). With a normalized state, it becomes easier to modify and read the state. This practice also leads to a better performance, especially in a data-heavy application.

As with most of the questions in software development, an answer to a question depends on the use-case.
And for the simpler state hierarchies, a nested state might be more convenient and faster to develop.

An example of this is when the child state doesn't exist on its own but when it's a part of the parent's state.
When the child state is coherent with the parent state, a normalized state might not look that attractive anymore because it makes the argument of having a duplicated state obsolete.

In this post, we'll see how NgRx Entity can be used to modify the nested state.

### Entity

Before we get into nested state adapters, let's first refresh our knowledge about [NgRx Entity](https://ngrx.io/guide/entity).
If you're already familiar with it, feel free to skip this section and go to [Nested Entity State](#nested-entity-state).

NgRx Entity allows you to manage a collection of entities that have the same type, duh!

> Entity provides an API to manipulate and query entity collections.<br/> &emsp;• **Reduces boilerplate** for creating reducers that manage a collection of models.<br/> &emsp;• Provides **performant CRUD operations** for managing entity collections.<br/> &emsp;• Extensible type-safe adapters for **selecting entity information**.

To use NgRx Entity, you first must define an adapter for a specific type.
In the snippet below, we're creating an adapter for `Customer` to manage a collection of customers.

```ts{7}:customers.reducer.ts
import { createEntityAdapter } from '@ngrx/entity'

export interface Customer {
  id: number
  name: string
}
export const adapter = createEntityAdapter<Customer>()
```

The adapter is stateless (it does not contain state) and provides a dozen pure [functions](https://ngrx.io/guide/entity/adapter#adapter-collection-methods) to modify a collection.

In the snippet below, we use the `adapter.setAll()` function to populate the customer's state with customers.
Inside the customers reducer, we pass a new collection of customers as the first argument, and the current state as the second argument.
Because the adapter is stateless, all of the functions provided by the adapter expects you to pass the current collection's state as the second argument.

```ts{4}:customers.reducer.ts
export const customersReducer = createReducer(
  initialState,
  on(customersLoaded, (state, action) =>
    adapter.setAll(action.customers, state),
  ),
)
```

When you're using NgRx Entity, most of the reducer's cases will be as lean as in the snippet above.
Within each case, you will use one of the adapter's functions to mutate the current state in a pure way.

While the primary focus of NgRx Entity is to use the package in a state reducer, its generic API allows it to be used in more scenarios.
For example, in combination with NgRx ComponentStore, as shown in [Brandon Roberts](https://twitter.com/brandontroberts)'s [example](https://stackblitz.com/edit/heroes-component-store?file=src%2Fapp%2Fhero.service.ts), or with a nested state.

### Nested Entity State

Now that we know what NgRx Entity is and how it works, we notice that it isn't special.
The returned adapter functions simply take "a change" and a state as arguments, and returns the new state.
Thus, if we can retrieve the nested state from within the reducer's state, we can also invoke one of these adapter functions.

If we continue with the customers' example and add articles to a customer, we create a nested state, and let's say that we want to add and remove articles for a customer.

Just like the top-level entity (customer) we need an adapter to add and remove an article.
Because an adapter is responsible for a single type, we have to create a new adapter for the articles, as shown in the snippet below.

```ts{4, 7-10, 12-14}:customers.reducer.ts
export interface Customer {
  id: number
  name: string
  articles: EntityState<Article>
}

export interface Article {
  sku: string
  amount: number
}

export const articleAdapter = createEntityAdapter<Article>({
  selectId: (article) => article.sku,
})
```

To modify the child's state, the action must contain the parent's identifier, besides an optional child's identifier.
With the parent's and child's identifier, we can select the entity (customer) and its child entity (article) that we want to modify.

Once we can read the current state that you want to modify, there are no other moving parts involved.
It's simply two separate adapters working together.

For this, the code speaks for itself, see the snippet below for some use cases with different entity functions.

```ts{8-19, 23-38, 41-78}:customers.reducer.ts
export const customersReducer = createReducer(
  initialState,
  on(customersLoaded, (state, action) =>
    adapter.setAll(action.customers, state),
  ),

  on(articleAdded, (state, action) =>
    adapter.updateOne(
      {
        id: action.customerId,
        changes: {
          articles: articleAdapter.addOne(
            { sku: action.articleSku, amount: 1 },
            state.entities[action.customerId].articles,
          ),
        },
      },
      state,
    ),
  ),

  on(articleIncremented, (state, action) =>
    adapter.mapOne(
      {
        id: action.customerId,
        map: (customer) => ({
          ...customer,
          articles: articleAdapter.map(
            (article) =>
              article.sku === action.articleSku
                ? { ...article, amount: article.amount + 1 }
                : article,
            customer.articles,
          ),
        }),
      },
      state,
    ),
  ),

  on(articleDecremented, (state, action) => {
    const currentAmount =
      state.entities[action.customerId]?.articles.entities[action.articleSku]
        ?.amount || 0
    if (currentAmount === 1) {
      return adapter.mapOne(
        {
          id: action.customerId,
          map: (customer) => ({
            ...customer,
            articles: articleAdapter.removeOne(
              action.articleSku,
              customer.articles,
            ),
          }),
        },
        state,
      )
    }

    return adapter.mapOne(
      {
        id: action.customerId,
        map: (customer) => ({
          ...customer,
          articles: articleAdapter.updateOne(
            {
              id: action.articleSku,
              changes: {
                amount: currentAmount - 1,
              },
            },
            customer.articles,
          ),
        }),
      },
      state,
    )
  }),
)
```

### Example code

You can play around with the example code from this post in the following StackBlitz.

<iframe src="https://stackblitz.com/edit/ngrx-nested-entity?file=src/app/customers.reducer.ts&ctl=1&embed=1" title="ngrx-nested-entity" loading="lazy"></iframe>
