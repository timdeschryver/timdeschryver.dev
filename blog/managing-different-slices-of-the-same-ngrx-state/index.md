---
title: Managing different slices of the same NgRx state
slug: managing-different-slices-of-the-same-ngrx-state
description: In this article, we'll iterate over an implementation to introduce multiple independent instances of a NgRx store slice. In an application, these instances can be represented by a tab-like interface. To come to a solution we'll use the Angular Router, NgRx Effects, and NgRx Router Store. We'll also see meta-reducers, helper reducer functions, and smart and dumb components.
author: Tim Deschryver
date: 2020-01-06T19:00:00.000Z
tags: Angular, NgRx, Effects, State
---

In this article, we'll iterate over an implementation to introduce multiple independent instances of a NgRx store slice. In an application, these instances can be represented by a tab-like interface.

To come to a solution we'll use the [Angular Router](https://angular.io/guide/router), [NgRx Effects](https://ngrx.io/guide/effects), and [NgRx Router Store](https://ngrx.io/guide/router-store). We'll also see [meta-reducers](https://ngrx.io/guide/store/metareducers), helper reducer functions, and smart and dumb components.

## The problem

You need to create multiple of the same components and each component has its own state.
If the component only consisted of local, or component, state, one might [tackle component state reactively](https://www.youtube.com/watch?v=I8uaHMs8rw0), another one could wait for [a new NgRx package](https://github.com/ngrx/platform/issues/2187) to emerge.

But because our components will be destroyed - if the tab isn't active - we can't rely on local state, as the state will be destroyed together with the component. In other words, the [local state has the same lifetime as the component](https://dev.to/rxjs/research-on-reactive-ephemeral-state-in-component-oriented-frameworks-38lk).

If we want our users to continue their work where they left off if they navigate back, we have to store this state on a global level. The global state doesn't rely on the component's lifecycle and will usually have the same lifetime as the application.

To solve the "persisted local state in the global state" issue, the global state has to keep references to the local state.

### The problem explained with code

Let's take the example of simple counter components. Each spawned counter component will have its own counter value and there are buttons to increment and decrement the counter value.

The simplest approach to this problem is a loop over all counter instances with the [`*ngForOf` directive](https://angular.io/api/common/NgForOf) and to create a counter component for each instance.

```html:counters-page.component.html
<div *ngFor="let counter of counters$ | async | keyvalue">
  <app-counter></app-counter>
</div>
```

For this, we do not need a global state as this shows all counter instances, and the counter instances are not destroyed.
If we only want to show one counter instance at a time, things become complex.

A quick solution is to use css and hide the inactive counter instances.
Note that we don't make the counter component aware that it has to be shown or not, this is done in the parent counters component. The counter component is only aware of its counter value, while the counters component manages the counter instances and keeps a record of the active instance.

```html{3,9-13}:counters-page.component.html
<div
  *ngFor="let counter of counters$ | async | keyvalue"
  [data-state]="counterState(counter.key)"
>
  <app-counter></app-counter>
</div>

<style>
  [data-state='inactive'] {
    display: none;
  }
</style>
```

By going for this solution, there are no state-related problems.
For simple components, this is all you need but I wouldn't recommend using it for big components.
We want to keep our footprint as small as possible and that's why we want to destroy the components that aren't active.

To only keep the active component alive we use the [`*ngIf` directive](https://angular.io/api/common/NgIf).
We also list all counter instances and provide a way to navigate between the counter instances.

```html{10}:counters-page.component.html
<div
  *ngFor="let counter of counters$ | async"
  (click)="selectCounter(counter.counterId)"
>
  {{ counter.counterId }}
</div>

<ng-container *ngFor="let counter of counters$ | async">
  <app-counter
    *ngIf="(activeCounterId$ | async) === counter.counterId"
  ></app-counter>
</ng-container>
```

When we navigate back to an inactive counter component, we can see the counter has been reset to its initial value instead of its previous value.

To not lose the counter values we have to lift that state one level to the counters component.
The counter component has an added [input property](https://angular.io/api/core/Input) for its value and has increment and decrement [output properties](https://angular.io/api/core/Output) to modify the counter value in the counters component. For these output events, we have to pass the counter id so that the component knows which counter value to update because it now keeps track of all counter values.

```html{11-13}:counters-page.component.html
<div
  *ngFor="let counter of counters$ | async"
  (click)="selectCounter(counter.counterId)"
>
  {{ counter.counterId }}
</div>

<ng-container *ngFor="let counter of counters$ | async">
  <app-counter
    *ngIf="(activeCounterId$ | async) === counter.counterId"
    [value]="counter.count"
    (increment)="increment(counter.counterId)"
    (decrement)="decrement(counter.counterId)"
  ></app-counter>
</ng-container>
```

While this solution works, it has some drawbacks:

- the state only lives on the client, in a real-world scenario there is probably the need to be able to share an instance by sharing the URL
- we have to decide which instance is active, but isn't this with the URL handles for us?
- the component state is lost when the parent component is destroyed

With these approaches the first drawback is solvable but the rest of the drawbacks are not.

## A solution with NgRx

### Structuring the state

To not lose the counters state, we have to lift the state once more to a higher level, in the NgRx store.
The state can be represented as separate slices, each slice holds the state of a counter component.

```json:state.json
{
  "counters": {
    "31cd7f19-559e-4d77-8899-97797368b8c4": {
      "count": -1
    },
    "ca6184a4-10cf-473c-b1f6-6bb73ab20679": {
      "count": 4
    },
    "1caf0bc3-1414-4221-ae1d-a94f99ced451": {
      "count": 0
    }
  }
}
```

To update the counter value we dispatch an increment action and a decrement action, but these actions must be aware of the counter reference.

### Router Outlet

The first and second drawbacks are both URL related. We want to be able to share a counter to another person by sending the URL that contains the counter id, e.g. `/counter/2e406d20-6d54-4a32-82ba-fbce7ecb0008`. Therefore, the active counter id must be added to the URL.

Once this is done, it becomes possible to render the active counter component via an Angular [Router Outlet](https://angular.io/api/router/RouterOutlet). We also use the [Router Link directive](https://angular.io/api/router/RouterLink) to navigate between the counters.

```html{2,5}:counters-page.component.html
<div *ngFor="let counter of counters$ | async">
  <a [routerLink]="counter.counterId">{{ counter.counterId }}</a>
</div>

<router-outlet></router-outlet>
```

The counters component doesn't have to keep track of the active counter id anymore.

### NgRx Router Serializer

An often forgotten, but oh so handy, state container is the URL. In the example, the URL contains the active counter
id. This id is important because we need to somehow retrieve it from the URL to update the correct counter state when we dispatch the increment and decrement actions.

One possibility is to inject the [Angular Router](https://angular.io/guide/router) into the components, but because I like to keep my components clean and try to inject as little external dependencies as possible this is not an option.

Here's where [`@ngrx/router-store`](https://ngrx.io/guide/router-store) offers a solution, this package connects the Angular router to the NgRx Store. To parse and read the URL parameters it needs a router serializer and there are two serializers built in the library, a [`DefaultRouterStateSerializer`](https://ngrx.io/api/router-store/DefaultRouterStateSerializer) and a [`MinimalRouterStateSerializer`](https://ngrx.io/api/router-store/MinimalRouterStateSerializer). Both serializers are serializing too much data for our example, and to show how you can create your own serializer let's build our own.

Our [custom serializer](https://ngrx.io/guide/router-store/configuration#custom-router-state-serializer)
only serializes the parameters and query parameters for all route levels, and that's all we need.

```ts{13-17}:params-serializer.ts
export interface ParamsRouterState {
  url: string
  params: {}
  queryParams: {}
}

export class ParamsSerializer
  implements RouterStateSerializer<ParamsRouterState> {
  serialize(routerState: RouterStateSnapshot): ParamsRouterState {
    let route = routerState.root
    let { params, queryParams } = routerState.root

    while (route.firstChild) {
      route = route.firstChild
      params = { ...params, ...route.params }
      queryParams = { ...queryParams, ...route.queryParams }
    }

    return { url: routerState.url, params, queryParams }
  }
}
```

The serializer can be configured via the `StoreRouterConnectingModule.forRoot` options.

```ts{5-7}:router.module.ts
@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    StoreModule.forFeature(routerStateKey, routerReducer),
    StoreRouterConnectingModule.forRoot({
      serializer: ParamsSerializer,
    }),
  ],
  exports: [RouterModule],
})
export class AppRouterModule {}
```

To see how the router state is stored, we can take a look at the [Redux DevTools](https://ngrx.io/guide/store-devtools).

```json:state.json
{
  "router": {
    "state": {
      "url": "/counter/2e406d20-6d54-4a32-82ba-fbce7ecb0008",
      "params": {
        "counterId": "2e406d20-6d54-4a32-82ba-fbce7ecb0008"
      },
      "queryParams": {}
    },
    "navigationId": 3
  },
  "counters": {}
}
```

### Router selectors

Now that we have the router state synced with the NgRx Store, the next step is to be able to read this data.
For this, we're going to use [selectors](https://ngrx.io/guide/store/selectors).
These selectors will, later on, be used to select the active counter's id.

```ts:router.selectors.ts
export const routerStateKey = 'router'

const selectRouterSlice = createFeatureSelector<
  RouterReducerState<ParamsRouterState>
>(routerStateKey)

export const selectRouteParams = createSelector(
  selectRouterSlice,
  (state) => (state && state.state && state.state.params) || {},
)

export const selectRouterParam = (paramName: string) =>
  createSelector(selectRouteParams, (params) => params[paramName])
```

> If you're using the default NgRx serializer, you can make use of the [built-in router selectors](https://ngrx.io/guide/router-store/selectors#router-selectors)

### Components

The counters component shows a list of all counter ids and also has a `router-outlet` to display the active counter.
Because we can't use input and output properties anymore we have to make the counter component smarter again.

The refactored counter component has to communicate with the store, it has select its value from the store, and has to dispatch the actions to the store.

```ts:counter.component.ts
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">➕</button>
    {{ counterValue$ | async }}
    <button (click)="decrement()">➖</button>
  `,
})
export class CounterComponent {
  counterValue$ = this.store.pipe(select(selectActiveCounterValue))

  constructor(private store: Store<object>) {}

  increment() {
    this.store.dispatch(increment())
  }

  decrement() {
    this.store.dispatch(decrement())
  }
}
```

```ts:counters.selectors.ts
const selectCounterSlice = createFeatureSelector<CountersState>(counterStateKey)

export const selectActiveCounterId = selectRouterParam('counterId')

export const selectActiveCounter = createSelector(
  selectCounterSlice,
  selectActiveCounterId,
  (counters, counterId) => counters[counterId],
)

export const selectActiveCounterValue = createSelector(
  selectActiveCounter,
  (counter) => counter && counter.count,
)
```

### Keeping the counters state in sync with the router state

We now have a working counter, but the counter only works if the counter id is already added to the store state. If the counter id does not exist in the store state, we only see an empty counter page and the increment and decrement actions are not updating the counter value because the active counter does not exist in the global state.

To solve this, we are [going to use an Effect](/blog/start-using-ngrx-effects-for-this).

```ts:counters.effects.ts
syncState$ = createEffect(() => {
  return this.store.pipe(
    select(selectActiveIdAndCounter),
    filter(
      (counter) =>
        counter.counterId !== undefined && counter.counter === undefined,
    ),
    map((counter) => initializeCounter({ counterId: counter.counterId })),
  )
})
```

The above Effect reacts to state changes from the `selectActiveIdAndCounter` selector.
The Effect dispatches the `initializeCounter` action when the selector outputs a `counterId` (from the router state) and when there is no counter state slice in the store.

The `selectActiveIdAndCounter` selector combines the earlier used selectors `selectActiveCounterId` and `selectActiveCounter`.

```ts:counters.selectors.ts
export const selectActiveIdAndCounter = createSelector(
  selectActiveCounterId,
  selectActiveCounter,
  (counterId, counter) => ({ counterId, counter }),
)
```

By reacting to state changes in the Effect it also becomes trivial to create a new counter:

```ts{8-10,19-23}:counters-page.component.ts
@Component({
  selector: 'app-counters-page',
  template: `
    <div *ngFor="let counter of counters$ | async">
      <a [routerLink]="counter">{{ counter }}</a>
    </div>

    <a [routerLink]="nextCounterId$ | async" (click)="newClicked.next()">
      New counter
    </a>

    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountersPageComponent {
  counters$ = this.store.pipe(select(selectCounterIds))

  newClicked = new Subject()
  nextCounterId$ = of('').pipe(
    map(uuidv4),
    repeatWhen(() => this.newClicked),
  )

  constructor(private store: Store<object>) {}
}
```

### Making the Action context-aware

To be able to update the correct counter state, the action must contain the active counter id. We already acknowledged that injecting the router into the component is a bad idea, so what other options do we have?

Besides storing the active counter id in the counters state, which is used often, let's explore the other options on how we can implement this. I still like that the counter component isn't aware that it is used in a tab-based interface and that it just dispatches increment and decrement actions, so let's try to keep it this way.

#### Option One: Content Enricher Action Transformer Effect

The first option is to use the Content Enricher Action Transformer approach, as explained in [NgRx: Patterns and Techniques](https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5). This means that the Effect will enrich the increment and decrement actions by adding the active counter id to the payload, based on the output of the `selectActiveCounterId` selector.

```ts:counters.effects.ts
increment$ = createEffect(() => {
  return this.actions$.pipe(
    ofType(increment),
    concatMap((action) =>
      of(action).pipe(withLatestFrom(this.store.select(selectActiveCounterId))),
    ),
    map(([_action, counterId]) => incrementWithCounterId(counterId)),
  )
})

decrement$ = createEffect(() => {
  return this.actions$.pipe(
    ofType(decrement),
    concatMap((action) =>
      of(action).pipe(withLatestFrom(this.store.select(selectActiveCounterId))),
    ),
    map(([_action, counterId]) => decrementWithCounterId(counterId)),
  )
})
```

But as you can notice, by doing it like this we end up with a lot of - duplicated - code. We can [build our own RxJS operator](https://www.youtube.com/watch?v=E6R_1QB8q4o) to remove the duplicated code, but we'll still end up with a lot of code.

That's why I prefer to use the [spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) to add the active counter id. We have to use the spread syntax because we can't directly mutate the action, just like the state, the actions cannot be mutated. If you would mutate the action, a runtime error will be thrown via the [NgRx runtime checks](https://ngrx.io/guide/store/configuration/runtime-checks#runtime-checks).

It's also important to change the action's type, otherwise, we'll end up in an endless loop because the same effect will pick up the action again and repeat the process.

```ts:counters.effects.ts
counterEnricher$ = createEffect(() => {
  return this.actions$.pipe(
    ofType(increment, decrement),
    concatMap((action) =>
      of(action).pipe(withLatestFrom(this.store.select(selectActiveCounterId))),
    ),
    map(([action, counterId]) => ({
      ...action,
      counterId,
      // adds 'for counter' to the type
      // e.g. [Counter Page] increment clicked for counter
      type: createActionTypeWithCounterId(action),
    })),
  )
})
```

The increment and decrement actions are handled by the `counterEnricher$` Effect, which transforms the action to a "counter id" action with the active counter id added to the payload. The second action will be handled by the reducer to update the state. For example, if we dispatch the increment action this gives us the following actions.

```json:actions.history.json
[
  {
    "type": "[Counter Page] Increment clicked"
  },
  {
    "type": "[Counter Page] Increment clicked for counter",
    "counterId": "2e406d20-6d54-4a32-82ba-fbce7ecb0008"
  }
]
```

This has one drawback. To be able to use the `createReducer` syntax, we have to duplicate the increment and decrement actions with the added `counterId` property.

```ts:counter.actions.ts
export const increment = createActions('[Counter Page] Increment')
export const incrementForCounter = createActions(
  createActionTypeWithCounterId(increment),
  props<{ counterId: number }>(),
)

export const decrement = createActions('[Counter Page] Decrement')
export const decrementForCounter = createActions(
  createActionTypeWithCounterId(decrement),
  props<{ counterId: number }>(),
)
```

Another way to solve this drawback is to use the action and to only handle the action in the reducer if it has a counter id, and to use the same action in the Effect but only if it doesn't have a counter id. By going for this approach, it is easier to make mistakes because you would always have to think if the action is used in a counter context or not. It will also be harder to maintain as the action will be dispatched two times.

#### Option two: Meta-reducer

A [meta-reducer](https://ngrx.io/guide/store/metareducers) can be powerful if used correctly, we will use it to enrich the dispatched actions before the action is handled by the reducer. To add the active counter id to the action, the meta-reducer must store the active counter id. Therefore we listen to the [`ROUTER_NAVIGATION` action](https://ngrx.io/guide/router-store/actions#router-actions) and pluck the `counterId` parameter from the action. With this meta-reducer, we don't need to define the extra actions with the added `counterId` property.

```ts:action-enricher.reducer.ts
function actionEnricher(reducer) {
  let activeCounterId
  return (state, action) => {
    if (action.type === ROUTER_NAVIGATION) {
      const routerAction = action as RouterNavigationAction<ParamsRouterState>
      activeCounterId =
        routerAction.payload.routerState.params &&
        routerAction.payload.routerState.params['counterId']
    }

    return reducer(
      state,
      action.counterId ? action : { ...action, counterId: activeCounterId },
    )
  }
}
```

> We can also listen to the `ROUTER_NAVIGATION` action in the counters reducer and store the counter id in the counters state, I just wanted to show a different approach by using a meta-reducer.

The meta-reducer can be plugged in by adding the function to the `metaReducers` option while registering the counter feature.

```ts{5}:counter.module.ts
@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(COUNTER_FEATURE_KEY, reducer, {
      metaReducers: [actionEnricher],
    }),
    EffectsModule.forFeature([CounterEffects]),
    RouterModule.forChild(routes),
  ],
  declarations: [CountersPageComponent, CounterComponent],
})
export class CounterModule {}
```

Now, when the action reaches the counter reducer, it will have the active counter id added to the payload.

#### Option 3: Adding an extra layer

By going with the meta-reducer approach you lose some of the type safety that NgRx provides, and this might not be ideal.
Perhaps the most simple approach to this problem, is to add an extra view layer.

We still want the counter component to not be aware of any tab related logic, it still must be re-usable as a single component. By adding an extra layer, we can orchestrate the tab related logic inside this layer while making the counter component a dumb component.

```html:counters.container.html
<ng-container *ngIf="(activeIdAndCounter$ | async) as counter">
  <app-counter
    [value]="counter.counter"
    (increment)="increment($event, counter.id)"
    (decrement)="decrement($event, counter.id)"
  ></app-counter>
</ng-container>
```

This layer is created as a new component and will act as a [container component](https://indepth.dev/container-components-with-angular/#container-components). The task of the container component is to communicate with the NgRx Store.

The counter component still doesn't know about the tab interface because we add the counter id as the second argument to the emitted output events triggered withing the counter component. To access the counter id in the snippet above, we use the `*ngIf` directive to unwrap the `activeIdAndCounter$` value (emitted from the `selectActiveIdAndCounter` selector).

> It would also be possible to do this inside the component, but then we would have to [subscribe to the selector which is something we want to prevent](https://medium.com/@benlesh/rxjs-dont-unsubscribe-6753ed4fda87).

The responsibility of the counter component is to only render the state of the component and to emit events. This is a powerful pattern as it allows the counter component to be used in any scenario. Because the component only knows about input and output properties, and doesn't contain services nor side effects, it can also be tested very easily.

### Updating state

To update the correct counter value, we can create a helper function, a mini-reducer `reduceCounter`.
It will select the counter state bound to the action's counter id, and it ill update the state via the callback function.

```ts:counters.reducer.ts
export interface CounterState {
  count: number
}
export interface CountersState {
  counters: Record<string, CounterState>
}

export function reduceCounter<A extends ActionWithCounterId>(
  reduce: (state: CounterState) => void,
) {
  return (state: CountersState, action: A) => {
    const counterState = state.counters[action.counterId]
    counterState && reduce(counterState)
  }
}

export const reducer = createReducer<CountersState>(
  { counters: {} },
  mutableOn(initializeCounter, (state, action) => {
    state.counters[action.counterId] = { count: 0 }
  }),
  mutableOn(
    increment,
    reduceCounter((countState) => countState.count++),
  ),
  mutableOn(
    decrement,
    reduceCounter((countState) => countState.count--),
  ),
)
```

> To modify state in a more readable way, we're using `mutableOn` from the [ngrx-etc package](https://github.com/timdeschryver/ngrx-etc)

## Restricting the number of counters

A new feature, we want to restrict the number of counters being opened.
For this, we can use a [`CanActivate` Route Guard](https://angular.io/api/router/CanActivate).
The guard selects all of the counters from the store state and verifies if the number of tabs is below the threshold to prevent the navigation.
If the counter id is already present, the navigation will always succeed.

```ts:maximum-counters.guard.ts
@Injectable({
  providedIn: 'root',
})
export class MaximumCounters implements CanActivate {
  constructor(private store: Store<object>) {}

  canActivate(route: ActivatedRouteSnapshot) {
    return this.store.pipe(
      select(selectCounterIds),
      map(
        (counters) =>
          counters.includes(route.params.counterId) || counters.length <= 5,
      ),
      tap((canOpenNewTab) => {
        if (!canOpenNewTab) {
          this.store.dispatch(maximumNumberOfTabsOpened())
        }
      }),
    )
  }
}
```

The above has a small timing issue. The NgRx router state will already be updated before the guard cancels the navigation.
This has as outcome that the `syncState$` Effect will create a new counter state.

By [tweaking the action timing](https://ngrx.io/guide/router-store/configuration#navigation-action-timing) with the [`navigationActionTiming`](https://ngrx.io/api/router-store/NavigationActionTiming) configuration option, the router actions will be dispatched after a successful navigation, rather than before the navigation completes.

```ts{7}:router.module.ts
@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    StoreModule.forFeature(routerStateKey, routerReducer),
    StoreRouterConnectingModule.forRoot({
      serializer: ParamsSerializer,
      navigationActionTiming: NavigationActionTiming.PostActivation,
    }),
  ],
  exports: [RouterModule],
})
export class RoutingModule {}
```

To show a message when the maximum amount of tabs has been reached we listen to the `maximumNumberOfTabsOpened` action - dispatched by the guard - inside an Effect.

```ts:counters.effects.ts
showMaximumTabsOpen$ = createEffect(
  () => {
    return this.actions$.pipe(
      ofType(maximumNumberOfTabsOpened),
      tap(() => alert('Cannot open a new tab, maximum number of tabs opened')),
    )
  },
  { dispatch: false },
)
```

## Closing a tab

To close a tab we must create a new action and remove the tab from the state within the reducer.

```ts:counters.reducer.ts
mutableOn(closeClicked, (state, action) => {
  delete state.counters[action.counterId]
}),
```

By removing the slice from the state the `selectActiveIdAndCounter` selector will be triggered and this will the `syncState$` Effect also be fired. Because the counter is already deleted, the effect will re-initialize the counter slice.

To prevent this we can make the Effect smarter, knowing when it should create a new counter and when it should not.
To know when a counter should be created, we can make use of the RxJS [pairwise](https://rxjs.dev/api/operators/pairwise) operator to select the previous state and the current state. If the active counter id isn't in the previous state, we know that we have to initialize the counter. To check if the counter id is in the counter ids array we use the [Array.prototype.includes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes) function.

We can even navigate away from the active counter if it's the counter that's closed. To do this, we verify that the active counter id isn't in the current counter ids state.

```ts:counters.effects.ts
syncState$ = createEffect(() => {
  return this.store.pipe(
    select(selectCounterIds),
    startWith([]),
    pairwise(),
    switchMap(([previousState, currentState]) => {
      return this.store.pipe(
        select(selectActiveCounterId),
        filter(Boolean),
        map((counterId) => {
          if (!previousState.includes(counterId)) {
            return initializeCounter({ counterId })
          } else if (!currentState.includes(counterId)) {
            return closedCounter({ counterId })
          }

          return { type: 'NOOP' }
        }),
        tap(
          (action) =>
            action.type === closedCounter.type &&
            (currentState[0]
              ? this.router.navigate(['counter', currentState[0]])
              : this.router.navigate(['counter'])),
        ),
      )
    }),
  )
})
```

## Moving things around

Reacting to state changes can be useful but is often harder to comprehend and maintain.
Instead, we want to make our intentions clear.

To start the refactoring, we'll dispatch a `newCounterClicked` action to create a new counter state slice instead of navigating to a new route.

We're not re-using the `initializeCounter` action from the Effect, because it's a best practice to create actions that describe **unique events** that happen in an application. This practice is also called [Good Action Hygiene](https://www.youtube.com/watch?v=JmnsEvoy-gY) and will help newcomers to explore what's happening in the application.

We can add the action to the same `On` function of the `initializeCounter` action because the behavior is the same.

```ts{5-7}:counters.reducers.ts
export const reducer = createReducer<CountersState>(
  {
    counters: {},
  },
  mutableOn(initializeCounter, newCounterClicked, (state, action) => {
    state.counters[action.counterId] = { count: 0 }
  }),
  mutableOn(closeClicked, (state, action) => {
    delete state.counters[action.counterId]
  }),
  mutableOn(
    increment,
    reduceCounter((countState) => countState.count++),
  ),
  mutableOn(
    decrement,
    reduceCounter((countState) => countState.count--),
  ),
)
```

To navigate the newly created counter instance, we still have to update the URL so that the router selectors are triggered and as result will the correct counter state be used in the router outlet. We have already seen that we can navigate inside an Effect, so let's create the Effect.

```ts:counters.effects.ts
navigateToNewCounter$ = createEffect(
  () => {
    return this.actions$.pipe(
      ofType(newCounterClickedWithTab),
      tap(([action]) => this.router.navigate(['counter', action.counterId])),
    )
  },
  { dispatch: false },
)
```

We have created a problem that we've solved before but is now broken. The router guard prevented that more than 5 counters could be created, but now it's possible to keep on creating counters. The guard is broken because the counter slice is created before the navigation happens. To get this resolved, the code to check if a new tab can be opened has to be moved from the guard to the reducer.

Moving this check to the reducer also makes more sense to me.
I like that all my state-related logic lives together, rather than all over the application.
By handling state-related logic in one central place it makes it easier to understand, and it's easier to see the state flow from one state to another state.

```ts{6}:counters.reducers.ts
export const reducer = createReducer<CountersState>(
  {
    counters: {},
  },
  mutableOn(initializeCounter, newCounter, (state, action) => {
    if (Object.keys(state.counters).length === 5) return
    state.counters[action.counterId] = { count: 0 }
  }),
  mutableOn(closeClicked, (state, action) => {
    delete state.counters[action.counterId]
  }),
  mutableOn(
    increment,
    reduceCounter((countState) => countState.count++),
  ),
  mutableOn(
    decrement,
    reduceCounter((countState) => countState.count--),
  ),
)
```

This isn't the only change we have to make. The `navigateToNewCounter$` Effect also needs to verify that counter id was added to the store before it navigates to it, otherwise, we'll end up in a route that does not have a state slice.

```ts{5-10}:counters.effects.ts
navigateToNewCounter$ = createEffect(
  () => {
    return this.actions$.pipe(
      ofType(newCounter),
      concatMap((action) =>
        of(action).pipe(
          withLatestFrom(this.store.pipe(select(selectCounterIds))),
        ),
      ),
      filter(([action, ids]) => ids.includes(action.counterId)),
      tap(([action]) => this.router.navigate(['counter', action.counterId])),
    )
  },
  { dispatch: false },
)
```

The changes to the `syncState$` Effect can now be undone, back its original implementation with one small change.
We only want the state to be synced if the first navigation contains a counter id. Otherwise, it isn't possible to close a counter while it's active, the reducer will delete the store slice but the Effect will re-initialize it.

The Effect should only work while the initial counter is `undefined`, for this we can use the [`takeWhile` RxJS operator](https://rxjs.dev/api/operators/takeWhile).

```ts{4-5}:counters.effects.ts
syncState$ = createEffect(() => {
  return this.store.pipe(
    select(selectActiveIdAndCounter),
    filter((counter) => counter.counterId !== undefined),
    takeWhile((counter) => counter.counter === undefined),
    map((counter) => initializeCounter({ counterId: counter.counterId })),
  )
})
```

Another solution to prevent this Effect to re-initialize the closed counter is to close the counter in two steps.
The first step is to navigate away from the route in an Effect. The same Effect would in his turn dispatch a second action which is handled by the reducer to remove the store slice. But for this case, I prefer to use add the extra check to the `syncState$` because of two reasons.

The first reason is that it isn't that complex, the second reason is that we navigate before the reducer handles the action. For now this is fine, but what if we later want to prevent a counter from being closed? This is logic that should be placed in the reducer and if we navigate before the action is handled by the reducer we might end up with an out of sync state if the reducer refuses the action.

To wrap it all up, we still have to navigate to a new route when we click on the close button, and if it's currently the active counter.

```ts:counters.effects.ts
close$ = createEffect(
  () => {
    return this.actions$.pipe(
      ofType(closeClicked),
      concatMap((action) =>
        of(action).pipe(
          withLatestFrom(this.store.pipe(select(selectActiveCounterId))),
        ),
      ),
      filter(([action, counterId]) => action.counterId === counterId),
      concatMap((action) =>
        of(action).pipe(
          withLatestFrom(
            this.store.pipe(select(selectCounterIds)),
            (_, counterIds) => counterIds,
          ),
        ),
      ),
      tap(([firstCounterId]) => {
        return firstCounterId
          ? this.router.navigate(['counter', firstCounterId])
          : this.router.navigate(['counter'])
      }),
    )
  },
  { dispatch: false },
)
```

## Conclusion

This article shows examples of dealing with independent instances of a particular state. One of the approaches, a composed approach, or a different approach can be used to solve a use case, but I would keep the following concerns in mind.

It's important that the **component containing the logic can be used as a single component or that the component can be used in a tab-like interface**. It isn't the responsibility of the component. By **dividing the responsibilities** it also becomes easier to re-use and test components. We can accomplish this by using smart containers and dumb components.

Talking about responsibilities, I'm an advocate to **use Effects for the logic that orchestrates the flow of an application**. In comparison to putting that logic inside a container component it has the advantage that the container becomes less aware of external services (and side effects). The responsibility of a lean container component is to display data from an external service (a NgRx Store for example) and to dispatch events that happen back to an external service. This makes it easier to move things around and to test the components.

Think about how users use the interface. This can help to decide **where state should live, and what its lifetime should be**. If state should be stored on a global level, does it pass the [SHARI principle](https://www.youtube.com/watch?v=t3jx0EC-Y3c) test?

State does not only live on the client and in backend services, **the URL also contains the state** wherein the application lives in and act as the single source of truth. Use this to your advantage to make a better application for your users, but it will also beneficial for the codebase. In the example within this post, without looking at the code, we can take away that we'll navigate to a counter and that there can only be one active counter at a given time, just by looking at the URL. Plus, we don't have to write and maintain code to manage the active counter. We only have to read the counter id from the URL. Writing fewer lines of code means that there will be fewer bugs.

**Use the platform for a better performing application**. For simple components, you can get away with a couple of tricks to write some features, which is perfectly fine when the pros outweigh the cons. When performance becomes an issue, you can still shift to a more robust solution. Here's where the first point highlights its benefits **if the component isn't aware of its context it becomes easier to refactor**. A solution can be to use a router outlet, as it will handle the subscriptions from the component and it will also auto-collect garbage for you. If you're rendering a lot of DOM nodes, it will also only show the DOM nodes of the active component.

Modifying a behavior or state at one place will affect other parts of your application. That's why I **keep all state-related logic together**, inside a reducer. An application where state is handled all over the place becomes messy and thus harder to maintain. I find it handy that all (or most of) the logic lives inside a reducer, so I can keep track of an application's state in one place instead of all over the application. That was the main reason to refactor the guard to prevent counters to be opened to inside a reducer. When you look back to the code later, or when someone joins the team it isn't clear why a counter might not be created because it's hidden inside a guard.
