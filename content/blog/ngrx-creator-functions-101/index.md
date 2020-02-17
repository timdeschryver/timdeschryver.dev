---
title: NgRx creator functions 101
slug: ngrx-creator-functions-101
description: The createAction creator function opened opportunities in the NgRx world. With it came two other creator functions, createReducer and createEffect. Let's take a look at what's so special about it and why it's important.
author: Tim Deschryver
date: 2020-01-13T07:03:00.000Z
tags: Angular, NgRx, State, creator functions
banner: ./images/banner.jpg
bannerCredit: Photo by Nikhil Mitra on Unsplash
published: true
---

The `createAction` creator function opened opportunities in the NgRx world. With it came two other creator functions, `createReducer` and `createEffect`. Let's take a look at what's so special about it and why it's important.

> The creator functions were introduced in NgRx v8

## Action

In previous versions of NgRx, defining a new action took 3 steps.
The first step was to create the action type, usually as a string or as an enum value.
Then an action creator was defined as a class, implementing from the `Action` interface from NgRx.
Lastly, the action needed to be added to a grouping of actions, also known as a [union type](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types).

```ts:cart.actions.ts
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
export type CartActionsUnion = AddToCart | RemoveFromCart
```

The action types are used in reducers and effects.
A type plays an important role because it's based on this type that reducers and effects filter out actions that they are interested in.

Via the action class, an action instance can be created. These instances are dispatched to the NgRx store.

To provide type-safety, the union type (and classes) are used to type the incoming actions.

### `createAction`

With the added [`createAction`](https://medium.com/angular-in-depth/ngrx-action-creators-redesigned-d396960e46da) method, we achieve the same result with a single step.

The action creator is defined by invoking the `createAction` function with the action's type and an optional payload.

The return type of the `createAction` function is the [`ActionCreator`](https://github.com/ngrx/platform/blob/master/modules/store/src/models.ts#L83) type. This is not just an action creator function, but it also has a `type` property attached to the function.

This will be important for the `createReducer` and `createEffect` creator functions.

```ts:cart.actions.ts
import { createAction, props } from '@ngrx/store'

export const addToCart = createAction(
  // action's type
  '[Product List] Add to cart',
  // optional payload
  props<{ sku: string }>(),
)
export const removeFromCart = createAction(
  '[Product List] Remove from cart',
  props<{ sku: string }>(),
)
```

`createAction` has three different styles:

- without a payload, `createAction('[Articles Page] Page loaded')`
- with a `props` payload, `createAction('[Articles Page] Search', props<{ query: string }>())`
- with a function, `createAction('[Articles Page] Search', (query: string) => ({ query, timestamp: Date.now() }))`

Internally, the [`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) method is used to create the `type` property on the action creator.

Depending on how the action is configured, `createAction` will create a function:

- without a payload, return a parameterless function and return the type
- with `props`, return a function that has the action's payload parameter and return payload with the added type
- with function, return a function that has the function's parameter as parameter; the function is invoked and the output is returned with the added type

```ts:action_creator.ts
export function createAction<T extends string, C extends Creator>(
  type: T,
  config?: { _as: 'props' } | C,
): ActionCreator<T> {
  if (typeof config === 'function') {
    return defineType(type, (...args: any[]) => ({
      ...config(...args),
      type,
    }))
  }
  const as = config ? config._as : 'empty'
  switch (as) {
    case 'empty':
      return defineType(type, () => ({ type }))
    case 'props':
      return defineType(type, (props: object) => ({
        ...props,
        type,
      }))
    default:
      throw new Error('Unexpected config.')
  }
}

function defineType<T extends string>(
  type: T,
  creator: Creator,
): ActionCreator<T> {
  return Object.defineProperty(creator, 'type', {
    value: type,
    writable: false,
  })
}
```

## Reducer

NgRx wouldn't be as powerful as it is, without having (the possibility to create) type-safe reducers.
The `ActionTypes` enum and `ActionsUnion` union type are used to make a reducer typed.

To have a type-safe reducer, we have to add the types a little bit manually.
This is done by typing the incoming action's type as the `ActionsUnion`.
If you are handling an action from another feature, it's possible to add the specific type by creating an "inline union type".

By creating a `switch` statement on the incoming action's type, TypeScript can infer the action's type within a case clause statement.

```ts:cart.reducer.ts
export interface State {
  cartItems: { [sku: string]: number }
}

export const initialState: State = {
  cartItems: {},
}

export function reducer(state = initialState, action: CartActionsUnion) {
  switch (action.type) {
    case CartActionTypes.AddToCart:
      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [action.payload.sku]: (state.cartItems[action.payload.sku] || 0) + 1,
        },
      }

    case CartActionTypes.RemoveFromCart:
      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [action.payload.sku]: Math.max(
            (state.cartItems[action.payload.sku] || 0) - 1,
            0,
          ),
        },
      }

    default:
      return state
  }
}
```

To use the action creators in a reducer, we have to make two changes.

First, we have to use the `ActionCreator`'s type property in the switch statement instead of the enum.
Secondly, to not lose the type-safety we have to type the incoming action.
Just like before, we have to create a union type.

But we can't simply create a union of the `ActionCreator`s, but we need to access the actual action. Therefore we use the [`ReturnType`](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypet) utility type of TypeScript, this will get us the return value of the action creator. In other words this gets us the actual action.

```ts{3, 6, 15}:cart.reducer.ts
export function reducer(
  state = initialState,
  action: ReturnType<typeof addToCart> | ReturnType<typeof removeFromCart>,
) {
  switch (action.type) {
    case addToCart.type:
      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [action.sku]: (state.cartItems[action.sku] || 0) + 1,
        },
      }

    case removeFromCart.type:
      return {
        ...state,
        cartItems: {
          ...state.cartItems,
          [action.sku]: Math.max((state.cartItems[action.sku] || 0) - 1, 0),
        },
      }

    default:
      return state
  }
}
```

### `createReducer`

To fully make use of the `ActionCreator`'s power, we can take it up another level. With the `createReducer` function, creating a type-safe reducer becomes easier.

Instead of a good old switch statement, `createReducer` uses [`on`](https://github.com/ngrx/platform/blob/master/modules/store/src/reducer_creator.ts#L181) functions to handle the actions and reduce a new state.

The `on` function expects at least one `ActionCreator`, and the last argument is an action reducer. An action reducer can be compared to a normal reducer function. It has the current state and the action as parameters, and it returns a new state.

Because `on` works with `ActionCreator`s, NgRx can infer the action and you have type-safety out of the box. Neat!

Internally, it uses the `type` property on the `ActionReducer` to know which `on` reducers should be invoked.

```ts:cart.reducer.ts
export interface State {
  cartItems: { [sku: string]: number }
}

export const initialState: State = {
  cartItems: {},
}

export const reducer = createReducer(
  initialState,
  on(addToCart, (state, action) => ({
    ...state,
    cartItems: {
      ...state.cartItems,
      [action.sku]: (state.cartItems[action.sku] || 0) + 1,
    },
  })),
  on(removeFromCart, (state, action) => ({
    ...state,
    cartItems: {
      ...state.cartItems,
      [action.sku]: (state.cartItems[action.sku] || 0) + 1,
    },
  })),
)
```

There are two differences with the `createReducer` function, compared to a reducer function.

- it doesn't need a default case to return the current state; if the action type can't be found in an `on` function within the reducer, `createReducer` returns the current state
- a switch statement can only react once to an action type; with the `on` function it's possible to react to the same action more than once in a single reducer

Let's take a look at the internal workings of the `on` and `createReducer` functions.

The `on` function plucks all the types of the given `ActionCreator`s.
It returns the list of action types and the action reducer function.

```ts:reducer_creator.ts
export function on(
  ...args: (ActionCreator | Function)[]
): { reducer: Function; types: string[] } {
  const reducer = args.pop() as Function
  const types = args.reduce(
    (result, creator) => [...result, (creator as ActionCreator).type],
    [] as string[],
  )
  return { reducer, types }
}
```

The `createReducer` uses a [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) to know which `on` function it should invoke. The `Map` uses the action types as key, and has the action reducer function as the value for the coupled reducer to the action type.

To populate the map, it loops over all `on` functions, and next it loops over all the action types. If the action type is already added to the map, it wraps the existing reducer with new reducer. Wrapping the reducer function ensures the second reducer receives the updated state. This can be done because all of the reducers look the same (they all have a state and an action as arguments, and they all return state), If it's the first time that the action type is encountered, it will simply be added to the map.

The `createReducer` function returns a reducer function, which is invoked when an action is dispatched.

When the reducer function gets invoked, it uses the incoming action's type to find the to be invoked reducer based on the populated map.
If the reducer function does not handle the incoming action, it will simply return the current state.

```ts:reducer_creator.ts
export function createReducer<S, A extends Action = Action>(
  initialState: S,
  ...ons: On<S>[]
): ActionReducer<S, A> {
  const map = new Map<string, ActionReducer<S, A>>()
  for (let on of ons) {
    for (let type of on.types) {
      if (map.has(type)) {
        const existingReducer = map.get(type) as ActionReducer<S, A>
        const newReducer: ActionReducer<S, A> = (state, action) =>
          on.reducer(existingReducer(state, action), action)
        map.set(type, newReducer)
      } else {
        map.set(type, on.reducer)
      }
    }
  }

  return function(state: S = initialState, action: A): S {
    const reducer = map.get(action.type)
    return reducer ? reducer(state, action) : state
  }
}
```

## Effect

To create a NgRx Effect in previous versions, the Effect is decorated with the `@Effect()` decorator.
Here, again, we have to manually type the Effect, or the `Actions`, to have the type-safety in place.

In the Effect, it's the `ofType` operator that adds the type to the action.
Just like the reducer, the operator uses the action's type to know if it should handle the action and to provide type-safety throughout the next operators.

The first option to achieve a type-safe Effect is to add a generic to the `ofType` operator. The generic is the action's class, and we give it the action's type (the enum value) as parameter.

```ts{5}:article.effects.ts
@Injectable()
export class ArticleEffect {
  @Effect()
  loadArticles = this.actions$.pipe(
    ofType<ArticlePageLoaded>(ArticlesPageActionTypes.PageLoaded),
    switchMap(action => {
      return this.service.get().pipe(
        map(articles => new ArticlesLoaded(articles)),
        catchError(message => new ArticlesLoadFailed(message)),
      )
    }),
  )

  constructor(private actions$: Actions, private service: ArticleService) {}
}
```

The second option (introduced NgRx 7) to offer type-safety in the Effect, is to provide a generic on the `Actions` class. Similar to the reducers, we can use the union type for it.

Because of this change, it also makes the `ofType` operator smarter. It isn't needed anymore to type every single `ofType` operator.

```ts{15}:article.effects.ts
@Injectable()
export class ArticleEffect {
  @Effect()
  loadArticles = this.actions$.pipe(
    ofType(ArticlesPageActionTypes.PageLoaded),
    switchMap(action => {
      return this.service.get().pipe(
        map(articles => new ArticlesLoaded(articles)),
        catchError(message => new ArticlesLoadFailed(message)),
      )
    }),
  )

  constructor(
    private actions$: Actions<ArticlePageActionsUnion>,
    private service: ArticleService,
  ) {}
}
```

With the added `ActionCreator` the `ofType` operator is smart enough to infer the action's type.

```ts{6}:article.effects.ts
@Injectable()
export class ArticleEffect {
  @Effect()
  loadArticles = this.actions$.pipe(
    ofType(articlesPageLoaded),
    switchMap(action => {
      return this.service.get().pipe(
        map(articles => new ArticlesLoaded(articles)),
        catchError(message => new ArticlesLoadFailed(message)),
      )
    }),
  )

  constructor(private actions$: Actions, private service: ArticleService) {}
}
```

The internal code of the `ofType` operator looks as follows.
As you can see, it's the attached `type` property on the `ActionCreator` that makes this check possible.

```ts:actions.ts
export function ofType(
  ...allowedTypes: Array<string | ActionCreator<string, Creator>>
): OperatorFunction<Action, Action> {
  return filter((action: Action) =>
    allowedTypes.some(typeOrActionCreator => {
      if (typeof typeOrActionCreator === 'string') {
        // Comparing the string to type
        return typeOrActionCreator === action.type
      }

      // We are filtering by ActionCreator
      return typeOrActionCreator.type === action.type
    }),
  )
}
```

### `createEffect`

At first sight, the `createEffect` function doesn't offer anything special, we already know that it's the combination of the `ActionCreator` and the `ofType` operator that does the trick. So what does `createEffect` give us?

A downside of the `@Effect` decorator is that its return type can not be checked at compile time. It's possible to not return an action, and when this happens it results in a runtime error (because the store expects an action to have a `type` property).

This what the `createEffect` function solves. It adds a check at compile time to protect ourselves from making this mistake.

Instead of using the `@Effect` decorator, wrap the Effect's logic inside a `createEffect` function.

```ts{6}:article.effects.ts
@Injectable()
export class ArticleEffect {
  loadArticles = createEffect(() => {
    return this.actions$.pipe(
      ofType(articlesPageLoaded),
      switchMap(action => {
        return this.service.get().pipe(
          map(articles => new ArticlesLoaded(articles)),
          catchError(message => new ArticlesLoadFailed(message)),
        )
      }),
    )
  })

  constructor(private actions$: Actions, private service: ArticleService) {}
}
```

The internal workings of an Effect are still the same, so I will not cover the code in this article.
You can take a look at the [source code](https://github.com/ngrx/platform/blob/master/modules/effects/src/effects_runner.ts) if you're interested.

## Tips

### A DRY reducer

Inside a switch statement, you could group state clauses so it executed the same statement for different actions:

```ts{3-5}
export function reducer(state, action) {
  switch (action.type) {
    case 'Action One':
    case 'Action Two':
      return { ...state, modifiedOn: Date.now() }
    default:
      return state
  }
}
```

With the `createReducer`, the `on` function accepts more than one action creator as parameter to offer the same possibilities as a switch statement:

```ts{3}
export const reducer = createReducer(
  initialState,
  on(actionOne, actionTwo, (state, action) => ({
    ...state,
    modifiedOn: Date.now(),
  })),
)
```

### A composable reducer

The `createReducer` opens up the ability to compose a reducer because it can handle the same action multiple times. This isn't possible with a switch statement.

```ts{3,7}
export const reducer = createReducer(
  { counter: 0 },
  on(increment, (state, action) => ({
    // counter will be 0 here, the new counter value will be 1
    counter: state.counter++,
  })),
  on(increment, (state, action) => ({
    // counter will be 1 here, the new counter value will be 2
    counter: state.counter++,
  })),
)
```

For a use case see [the original issue](https://github.com/ngrx/platform/issues/1956#issuecomment-526720340) that led to this change, by Siyang Kern.

### Using an Action inside `createReducer`

For `Action`s that are not converted to the new `ActionCreator`'s syntax, but need to be used inside a `createReducer` function, a wrapper has to be written.
The wrapper will not be used in the code to dispatch the action, but will be used to comply with the `on` signature.

For actions without a payload this can be done as:

```ts
export const ACTION_TYPE = '[Source] Event';
export const CustomAction implements Action {
  readonly type = ACTION_TYPE;
}

// use the action's type to create the createAction
export const customAction = createAction(ACTION_TYPE);
```

Or an action with a payload:

```ts
export const ACTION_TYPE = '[Source] Event';
export const CustomAction implements Action {
  readonly type = ACTION_TYPE;
  constructor(public payload: { name: string }){}
}

// use the action's type to create the createAction
export const customAction = createAction(ACTION_TYPE, props<{ payload: { name: string } }>());
```

Internally, NgRx used this approach for the router actions and effect actions.
See the Pull Requests [ROOT_EFFECTS_INIT actions as ActionCreators - by Sam Lin](https://github.com/ngrx/platform/pull/2219) and [add action creator for root router actions - by Jeffrey Bosch](https://github.com/ngrx/platform/pull/2272).

### Migrating to `createEffect`

There's a schematic to convert all the `@Effect` decorators to the `createEffect` function, run the following command to run the schematic:

```bash
ng generate @ngrx/schematics:create-effect-migration
```

The [NgRx Schematics](https://ngrx.io/guide/schematics/install) has to be installed to run the command.

```bash
npm install @ngrx/schematics --save-dev
```

### More info about the typings

[Alex Okrushko](https://twitter.com/alexokrushko) gave a talk [Magical TypeScript features](https://www.youtube.com/watch?v=T-vQoI_AM9E) at Angular Toronto, that covers a lot of the NgRx typings and how they work.

## Conclusion

Most of the developers are excited about the new creator functions, and so am I. From my experience, the majority is happy that they can save keystrokes while writing NgRx code but I believe the power lies in the type-safety it provides out of the box.

Because TypeScript is growing, many libraries can benefit from the added features in each release. NgRx is one of them, without TypeScript, we wouldn't be able to create these features.

Another benefit that the creator functions bring to the table is the ability to create higher order functions, we already saw how this looked for a reducer but we can do the same thing for [actions](https://www.youtube.com/watch?v=VTfbdAJmspw) and [Effects](https://github.com/ngrx/platform/issues/1826). We can even plug in our own flavors, for example, the [`mutableOn`](https://github.com/timdeschryver/ngrx-etc) reducer function that wraps the reducer with the [Immer](https://immerjs.github.io/immer/docs/introduction) `produce` function.

Throughout this article I might have sounded like a broken record, but the power that `createAction` action provides is huge. The added `type` property plays a huge part of it, because it can be accessed (without having to invoke the action creator function) in the reducers and effects to filter actions. This all, while staying (and making it easier) to remain type-safe. Without it, the other creator functions would not exist.
