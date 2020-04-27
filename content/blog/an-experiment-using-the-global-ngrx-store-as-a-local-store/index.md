---
title: An experiment: Using the global NgRx Store as a local store
slug: an-experiment-using-the-global-ngrx-store-as-a-local-store
description: Getting to know the internals of NgRx to make a local component store happen.
author: Tim Deschryver
date: 2020-04-27
tags: Angular, NgRx, State
banner: ./images/banner.jpg
bannerCredit: Photo by [Priscilla Du Preez](https://unsplash.com/@priscilladupreez) on [Unsplash](https://unsplash.com)
published: true
---

In a previous article, [Managing different slices of the same NgRx state](/blog/managing-different-slices-of-the-same-ngrx-state), we had to overcome some hurdles to slice up the state in order to provide the NgRx Store and Effects to same components but with a different id.
Triggered by [Michael Hladky](https://twitter.com/Michael_Hladky)'s work on [@rx-angular/state](https://www.npmjs.com/package/@rx-angular/state) and [Alex Okrushko](https://twitter.com/AlexOkrushko)'s [RFC to add a ComponentStore to NgRx](https://github.com/ngrx/platform/issues/2489), it got me thinking if the NgRx Store could also serve as a local store. And spoiler alert... it can!

## State

If you've been using NgRx, you know that state is being managed with reducer functions and that each slice of the state has its own reducer.
A typical state tree can be displayed as follows:

```json
{
  auth: reducer(state, action) => newState,
  cart: reducer(state, action) => newState,
  catalog: {
    products: reducer(state, action) => newState,
  },
  checkout: {
    customer: reducer(state, action) => newState,
    shipping: reducer(state, action) => newState,
  }
}
```

Each reducer is registered by using the `StoreModule.forRoot()` and `StoreModule.forFeature()` import functions when the `ngModule` is defined. But this isn't good enough for component state because the components will be created at runtime.
To be able to use the global store, the component needs to dynamically create and claim a slice of the global state when it's rendered.
To create a new slice we can use the [`ReducerManager`](https://ngrx.io/api/store/ReducerManager). The important part here is to use a unique key for the slice, otherwise a component will override another component's state. The component name is used to generate the key so it can easily be looked up while debugging, plus a unique id.

```ts
  constructor(
    private reducers: ReducerManager,
  ) {
    this.name = `${this.constructor.name}__${uniqueComponentId()}`;
    this.reducers.addReducer(this.name, createReducer(...));
  }
```

The result is that when a component is created, it will create its own slice in the global store.
For example, if three components are created, it will result in the following state slices.

```json
{
  "BooksStore__1": { ... },
  "BooksStore__2": { ... },
  "BooksStore__3": { ... }
}
```

Because this is component state, its lifetime can be bound to the component lifecycle.
When the component is destroyed the application doesn't need its state anymore, thus it can be cleaned up.
The `OnDestroy` lifecycle hook is used to remove the state slice which is equal to the unique component name.

```ts
ngOnDestroy() {
  this.reducers.removeReducer(this.name);
}
```

With just these few lines of code, a local component store is created, but we're not finished yet.

## Actions

An important, or maybe the most important, aspect of component state is that the component knows when to update and when it does not have to.

If you're familiar with NgRx you already know that all actions are dispatched to all reducers.
Via the action's identifier, the `type` property, a reducer knows if it should update its state.
Because the reducer is now created inside a component this means that when there are multiple of the same components rendered, all the component reducers receive the same action when one component dispatches an action and they all update their state.

This is not the desired result.
When a local action is dispatched it needs to be aware of its context (the component).
Via this context the reducer can filter out any actions from a different context (component), and if you want it can also let global actions pass through.

Creating an action remains the same, the `createAction` function is used to create an action factory function.

```ts
const addAuthor = createAction('Add Author', props<{ author: Author }>())
const saveAuthor = createAction('Save Author', props<{ author: Author }>())
```

To add the component's context on the action, a `meta` tag is added which contains the unique name of the component.

```ts
createLocalAction<A extends Action>(action: A) {
  // add the component name on the meta tag
  action.__meta = { component: this.name };
  return action;
}
```

To keep things DRY, a `dispatch` function is added to the component.
It acts as a wrapper to tag actions that need to be aware of the component context, before the action is sent to the global store.

```ts
dispatch<A extends Action>(action: A) {
  // dispatch the action to the global store
  this.store.dispatch(this.createLocalAction(action));
}
```

When an action reaches the global store it looks as follows.

```json
{
  "author": {
    "name": "Author A 0",
    "dob": "1985/01/01"
  },
  "type": "Add Author",
  "__meta": {
    "component": "BooksStore__4"
  }
}
```

Now that the action is aware of the component context, the reducer needs to be made smarter.
When it receives an action, the action's meta tag needs to be checked to verify if it's an action for its context.

Therefore, the reducer is wrapped inside another reducer and the parent reducer will invoke the component reducer when it receives a local action from the same component, or a global action (if you want to). When the reducer receives an action from another local component, it just returns the current state because it's not interested in this action.

```ts
this.reducers.addReducer(this.name, (state, action) => {
  // let global actions pass through, invoke the component reducer
  if (!action.__meta) {
    return reducer(state, action)
  }

  // filter out component actions that are not this component
  if (action.__meta.component !== this.name) {
    return state
  }

  // local action, invoke the component reducer
  return reducer(state, action)
})
```

It's also possible to create a function and short-circuit the reducer just to set a new state value.

```ts{13-15, 21-27}
this.reducers.addReducer(this.name, (state, action) => {
    // let global actions pass through, invoke the component reducer
    if (!action.__meta) {
      return reducer(state, action);
    }

    // filter out local actions for this component
    if (action.__meta.component !== this.name) {
      return state;
    }

    // short circuit, set the state
    if (action === `[${this.name}] Set Value`) {
      return action.value;
    }

    // local action, invoke the component reducer
    return reducer(state, action);
});

// a function inside the component
setValue(value: T) {
  this.dispatch({
      type: `[${this.name}] Set Value`,
      value
    });
}
```

## Selectors

State would be useless if it couldn't be selected.
There's nothing special going on here as selectors are just pure function that retrieves state and returns a projection of the state.
The main piece of a component selector is to receive the correct slice of the state, which is its own slice.
For this, the `selectFeatureSelector` function can be used.
The component's unique name is used to select the top-level slice of the component state.

```ts
this.componentStateSelector = createFeatureSelector(this.name)
```

To create selectors, the `componentStateSelector` is being passed as an argument to receive the correct slice.
Because it's using the same API as the global selectors, a selector can be composed with other selectors.

```ts
getAuthors = createSelector(this.componentStateSelector, state => {
  return state && Object.values(state.authors)
})

getAuthorsCount = createSelector(
  this.getAuthors,
  authors => authors && authors.length,
)
```

To read the data, it's also needed to use the `select` function.
The only difference with before is that the selectors are now created within the component because they are all based on the `componentStateSelector` selector.

```ts
authors$ = this.store.select(this.getAuthors)
authorsCount$ = this.store.select(this.getAuthorsCount)
```

## Effects

What would NgRx be without its Effects, right?

Before Effects can be implemented inside components we need to know how these are registered.
NgRx Effects looks for properties in a class that are created with the `createEffect` function, or with the `@Effect` decorator.
Both functions [mark these property with a metadata key](https://github.com/ngrx/platform/blob/master/modules/effects/src/effect_creator.ts#L56-L58).
When the Effect class is registered via the `EffectsModule.forRoot()` or the `EffectModule.forFeature()` function it [looks for these marked properties](https://github.com/ngrx/platform/blob/master/modules/effects/src/effects_resolver.ts#L18), and they will be subscribed to.

Like reducers only registering Effects when a module is bootstrapped isn't good enough, the Effects inside a component need to be created after the component is rendered.
To do this the [`EffectSources`](https://ngrx.io/api/effects/EffectSources) subject can be used to add an Effect class dynamically.

```ts
  constructor(
    private effects: EffectSources,
  ) {
      this.effects.addEffects(this);
  }
```

Because the current component instance is passed (via `this`) to the `addEffects` function, all Effects that are instantiated in the component will be automatically subscribed to.

By default, only one instance of the same Effect class will be subscribed to. This is done to prevent the same API calls when the same Effect is registered in multiple modules. This default behavior means that only the Effects of the first component will be subscribed to. This again, is not what we want for our local component state.

In order to distinguish the Effects when multiple of the same components are created, the `[OnIdentifyEffects]`(https://ngrx.io/api/effects/OnIdentifyEffects) lifecycle hook is used. The component already has a unique name, so it can be re-used to create a unique Effect. Because all Effects have a unique name, they will be all subscribed to.

```ts
ngrxOnIdentifyEffects() {
  return this.name;
}
```

To bind the lifetime of an Effect to the component's lifetime, a second Effect lifecycle hook, `[OnRunEffects]`(https://ngrx.io/api/effects/OnRunEffects) is used.
Inside the hook, the Effect subscriptions will be destroyed when the component is destroyed.

```ts
ngrxOnRunEffects(resolvedEffects$) {
  return resolvedEffects$.pipe(
    takeUntil(
      this.actions$.pipe(
        ofType(`[${this.name}] Destroyed`),
      )
    )
  );
}
```

The last piece to complete the puzzle is an RxJS operator to filter out actions from other components.
It can be compared to the `ofType` operator, but checks the meta tag of the component to the component name.
If this isn't used, it means that the action will trigger the Effects for all of the rendered components.
The check inside this operator is the same check as within the reducer.

```ts
forThisComponent() {
  return filter(
    (action) => !action.__meta || this.isComponentAction(action)
  );
}
```

Or both the `ofType` and `forThisComponent` operators, could be used together in a custom `localOfType` operator.

```ts
localOfType(action: ActionCreator | string) {
  return pipe(
    ofType(action),
    this.forThisComponent()
  )
}
```

If everything is put together, an Effect looks as follows.

```ts
saveAuthor$ = createEffect(() =>
  this.actions$.pipe(
    localOfType(saveAuthor),
    concatMap(({ author }) =>
      this.api.saveAuthor(author).pipe(
        map(() => this.createLocalAction(saveAuthorSuccess(author))),
        catchError(() => of(this.createLocalAction(saveAuthorFailed(author)))),
      ),
    ),
  ),
)
```

It's also possible to listen to global actions if the `forThisComponent` operator is left out.
And just like global NgRx Effects, an [Effect can also use different sources](/blog/start-using-ngrx-effects-for-this).

## Conclusion

This was a fun experiment for me, and I hope you learned something new about NgRx.
From my point of view, it certainly showed how flexible NgRx can be.

The biggest drawback of this solution is that it has a dependency on `@ngrx/store` and `@ngrx/effects`, whereas both Michael's and Alex's solutions work independently from the current NgRx packages. With it, you are able to use it with the familiar NgRx packages but also with other state management libraries like [NGXS](https://www.ngxs.io/) and [Akita](https://datorama.github.io/akita/), with plain RxJS Subjects, or even without any state management.

> While we're at the topic of a component store, there's currently an RFC open to adding a new component store package for managing local component state into the NgRx platform and we're [looking for feedback](https://github.com/ngrx/platform/issues/2489), so take a look and speak up about the parts you like and dislike, or remain silent forever.

The code in this example can be abstracted to make it reusable.
To make things complete, init and destroyed actions could also be dispatched to represent the component's lifecycle.
For a working example see the cleaned up StackBlitz below, it's a reworked example based on the demo that Alex has made.
In the example, also make sure to take a look at the redux DevTools to have an overview of what is happening.

<iframe src="https://stackblitz.com/edit/ngrx-component-global-store?ctl=1&embed=1&file=src/component_store.ts" title="ngrx-component-global-store"></iframe>
