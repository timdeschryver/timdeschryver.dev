---
title: Simple state mutations in NGXS with Immer
slug: simple-state-mutations-in-ngrx-with-immer
description: A follow-up post of "Clean NgRx reducers using Immer". But this time we're using NGXS as our state management library.
author: Tim Deschryver
date: 2018-06-07T05:55:54.427Z
tags: Angular, NgRx, NGXS, Redux
banner: ./images/banner.jpg
bannerCredit: Photo by [Avel Chuklanov](https://unsplash.com/@chuklanov) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
canonical_url: https://blog.angularindepth.com/simple-state-mutations-in-ngxs-with-immer-48b908874a5e
---

Recently I wrote [Clean NgRx reducers using Immer](./posts/clean-ngrx-reducers-using-immer) and [Austin](https://twitter.com/amcdnl) hinted that I also should write one for NGXS. Of course I couldn’t let him down, so here we are!

### NGXS

NGXS is a state management pattern + library for Angular. Just like Redux and NgRx it’s modeled after the CQRS pattern. NGXS uses TypeScript functionality to its fullest extent and because of this it may feel more Angular-y.

Unlike NgRx, NGXS isn’t using reducers, but it relies on decorators and dependency injection to modify the state. More info and examples can be found below.

> In this post we’re not going to see every part of the NGXS API, just the way it handles state mutations. If you’re interested in getting to know NGXS in detail, there are some resources at the bottom of this post.

Also, NGXS just hit 1000 starts on [GitHub](https://github.com/ngxs/store)!

### Why Immer

Immer can **simplify** the way we edit state.

**Ease of use**, you don’t have to learn a new API or concept because it’s just using normal JavaScript objects and arrays. This can also lower the transition from a backend role to a front end role.

The thing I like most is that it can just be **plugged in wherever needed**. Introducing Immer doesn’t mean you have to use it in everywhere in your code base.

### About Immer

> Immer (German for: always) is a tiny package that allows you to work with immutable state in a more convenient way. It is based on the [_copy-on-write_](https://en.wikipedia.org/wiki/Copy-on-write) mechanism.

With Immer you’re treating your state with what they call a draft. This draft can be mutated “in the normal way”, with the JavaScript API. The mutations applied on the draft produce the next state. All this while still having the benefit that the state will remain immutable in the rest of your application. To make this possible Immer relies on [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) under the hood.

It is created by [Michel Weststrate](https://twitter.com/mweststrate), the owner of MobX.

### Side by side comparison

It’s time for some code samples! Like my previous post, we’re going to use the classic shopping cart example where we can add and remove items from the cart.

The cart model can be presented as followed:

```ts
export interface CartStateModel {
  cartItems: { [sku: string]: number }
}
```

To edit the state we have to define 3 actions. Just like with NgRx this can be done by using classes.

```ts
export class AddToCart {
  static readonly type = '[Product List] Add to cart'
  constructor(public payload: { sku: string }) {}
}

export class RemoveFromCart {
  static readonly type = '[Product List] Remove from cart'
  constructor(public payload: { sku: string }) {}
}

export class EmptyCart {
  static readonly type = '[Cart] Empty cart'
}
```

Now that we have everything in place we can implement our actions.

```ts
@State<CartStateModel>({
  name: 'cartItems',
  defaults: {
    cartItems: {},
  },
})
export class CartState {
  @Action(AddToCart)
  addProduct(ctx: StateContext<CartStateModel>, action: AddToCart) {
    const state = ctx.getState()
    ctx.setState({
      ...state,
      cartItems: {
        ...state.cartItems,
        [action.payload.sku]: (state.cartItems[action.payload.sku] || 0) + 1,
      },
    })
  }

  @Action(RemoveFromCart)
  removeProduct(ctx: StateContext<CartStateModel>, action: RemoveFromCart) {
    const state = ctx.getState()
    ctx.patchState({
      cartItems: {
        ...state.cartItems,
        [action.payload.sku]: Math.max(
          (state.cartItems[action.payload.sku] || 0) - 1,
          0,
        ),
      },
    })
  }

  @Action(EmptyCart)
  emptyCart(ctx: StateContext<CartStateModel>, action: EmptyCart) {
    ctx.setState({ cartItems: {} })
  }
}
```

As we zoom into the `addProduct` method we can see that an action is implemented by using the `Action` decorator, and it has a `StateContext` parameter and our `AddToCart` action. Using the `StateContext` we can retrieve the current `CartStateModel` slice of our application by using the `getState()` method. To edit the state we have to use `setState(T)` from the `StateContext`, which as the name gives away, sets the new state. NGXS does also have the functionality to modify a part of our state by using `patchState(Partial<T>)`. An example can be found inside the `removeProduct` implementation, where we’re only modifying the `cartItems` inside our `CartStateModel`.

If we would use Immer to modify our state, the actions implementation would become: _(No other changes are necessary, the rest of the code remains the same!)_

```ts
@State<CartStateModel>({
  name: 'cartItems',
  defaults: {
    cartItems: {},
  },
})
export class CartState {
  @Action(AddToCart)
  addProduct(ctx: StateContext<CartStateModel>, action: AddToCart) {
    ctx.setState(
      produce(ctx.getState(), draft => {
        draft.cartItems[action.payload.sku] =
          (draft.cartItems[action.payload.sku] || 0) + 1
      }),
    )
  }

  @Action(RemoveFromCart)
  removeProduct(ctx: StateContext<CartStateModel>, action: RemoveFromCart) {
    ctx.setState(
      produce(ctx.getState(), draft => {
        const newAmount = draft.cartItems[action.payload.sku] - 1
        if (newAmount > 0) {
          draft.cartItems[action.payload.sku] = newAmount
          return
        }
        delete draft.cartItems[action.payload.sku]
      }),
    )
  }

  @Action(EmptyCart)
  emptyCart(ctx: StateContext<CartStateModel>, action: EmptyCart) {
    ctx.setState(produce(ctx.getState(), draft => ({ cartItems: {} })))
  }
}
```

The difference here is that we’re mutating the state directly, well to be honest not directly… Because we’re actually mutating the Immer draft from the `produce` method, which is the current state of our `StateContext`. Every change on `draft` will be used to produce the next state, which just like before is being set with `setState`. Because the `draft` is our ‘full’ state, it doesn’t make sense to use `patchState` anymore, thus making this method obsolete.

Notice how easy it is to increment the current amount with Immer.

```ts
draft.cartItems[action.payload.sku] =
  (draft.cartItems[action.payload.sku] || 0) + 1
```

And we can also delete a property (cart item) from our cart by using existing and known JavaScript functionality.

delete draft.cartItems[action.payload.sku];

To give another example, let’s take a look at how we load the catalog:

```ts
@Action(LoadCatalog)
loadCatalog(ctx: StateContext<CatalogStateModel>, action: LoadCatalog) {
  ctx.setState(
    produce(ctx.getState(), draft => {
      action.payload.products.forEach(product => {
        draft.products[product.sku] = product;
        draft.productSkus.push(product.sku);
      });
    }),
  );
}
```

Pretty straight forward, right?

### Transitioning to Immer

You can safely start using Immer in some parts of your application. Using Immer doesn’t mean a big bang migration, but it can be implemented where needed and this can be done step by step.

Just like I said in my previous post, by using immer you won’t lose any benefit of NGXS or NgRx. This means:

- selectors will still be memoized
- the redux devtools keeps working

**BUT** be aware that Immer comes with object freezing out of the box in development. This means that it will throw an error if the state is mutated from outside the `produce` function. If you want to mutate your state (which I don’t recommend by the way), you can turn off this feature with `setAutoFreeze(false)`. If the application is built in production mode, this check will automatically be skipped for performance reasons.

### Great, but how can I use it

In order to use Immer you’ll have to install it first via `npm install immer`, and then import it with `import produce from 'immer’`.

### Conclusion

My conclusion is a bit different as in [Clean NgRx reducers using Immer](./posts/clean-ngrx-reducers-using-immer).

I still find Immer a great library, but in contrast to NgRx I think I would quicker use Immer with NGXS. Because to me it goes hand in hand with the NGXS mindset.

I also think it would be even more handy if we could do the following

```ts
ctx.setState(
  produce(draft => {
    draft.cartItems[action.payload.sku] =
      (draft.cartItems[action.payload.sku] || 0) + 1
  }),
)
```

This post is meant to be a short introduction to Immer and to spread the word to the NGXS community (and also to score some points with [Austin](https://twitter.com/amcdnl) of course 😃). If you like what you’re seeing and want some more details or if you’re interested on how Immer works, there are some useful resources below.

The code from the cart example can be found on [GitHub](https://github.com/timdeschryver/ngrx-immer/tree/ngxs-immer) or directly on [StackBlitz](https://stackblitz.com/github/timdeschryver/ngrx-immer/tree/ngxs-immer).

### More resources

[Introduction - NGXS](https://ngxs.gitbook.io/ngxs/ 'https://ngxs.gitbook.io/ngxs/')[](https://ngxs.gitbook.io/ngxs/)

[Why another state management framework for Angular?](https://medium.com/@amcdnl/why-another-state-management-framework-for-angular-b4b4c19ef664)

[Introducing Immer: Immutability the easy way](https://hackernoon.com/introducing-immer-immutability-the-easy-way-9d73d8f71cb3)

[mweststrate/immer](https://github.com/mweststrate/immer)
