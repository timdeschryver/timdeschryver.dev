---
title: NgRx creator functions 101
slug: ngrx-creator-functions-101
description: TK
author: Tim Deschryver
date: 2020-01-06T19:00:00.000Z
tags: Angular, NgRx, Effects, State
banner: ./images/banner.jpg
bannerCredit: Photo by [Ricardo Gomez Angel](https://unsplash.com/@ripato) on [Unsplash](https://unsplash.com)
published: true
---

### `createAction`

In previous versions of NgRx, defining a new action took 3 steps.
The first step was to create the action type, usually as a string or as an enum value.
Then an action creator was defined as a class, implementing from the `Action` interface of NgRx.
Lastly, the action needed to be added to a union type to provide type safety inside reducers and effects.

```ts:cart.actions.ts
import { Action } from '@ngrx/store'

// Step 1
export enum CartActionTypes {
  AddToCart = '[Product List] Add to cart',
  RemoveFromCart = '[Product List] Remove from cart',
}

// Step 2
export class AddToCart implements Action {
  readonly type = CartActionTypes.AddToCart
  constructor(public payload: { sku: string }) {}
}

export class RemoveFromCart implements Action {
  readonly type = CartActionTypes.RemoveFromCart
  constructor(public payload: { sku: string }) {}
}

// Step 3
export type CartActions = AddToCart | RemoveFromCart
```

With the added [`createAction`](https://medium.com/angular-in-depth/ngrx-action-creators-redesigned-d396960e46da) we achieve the same result.

```ts:cart.actions.ts
import { createAction, props } from '@ngrx/store'

export const addToCart = createAction(
  '[Product List] Add to cart',
  props<{ sku: string }>(),
)
export const removeFromCart = createAction(
  '[Product List] Remove to cart',
  props<{ sku: string }>(),
)
```

The
