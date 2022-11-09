---
title: You should take advantage of the improved NgRx APIs
slug: you-should-take-advantage-of-the-improved-ngrx-apis
description: NgRx isn't what it used to be. Take advantage of the updated APIs to improve your code base. The result is a more maintainable code base that is easier to read and navigate.
date: 2022-11-09
tags: NgRx, Angular, State
---

Over the past years, TypeScript has become more powerful. Especially when it comes to its type system, in other words, how smart Typescript is.
With every new release, there's always one or more features that make it easier to write better code.

This is something that NgRx leverages to its full potential.
NgRx uses new TypeScript features to build type-safe state management libraries, which makes NgRx easier to use and shortens the feedback loop to detect problems earlier.

Sadly, keeping up with everything is time-consuming, and a lot of examples are outdated.
I hope that this post helps you to get to discover (and use) the latest APIs that NgRx has to offer.

> Most of these tips and tricks are available as rules in the [NgRx ESLint Plugin](https://ngrx.io/guide/eslint-plugin).
> Some updated APIs also have an automatic migration that is run via the `ng-update` command, other might have an ESLint fixer to refactor the code to the (newer) recommended syntax.

Let's start off at the base of NgRx, Actions.

## Actions

> You can take a look at the [documentation](https://ngrx.io/guide/store/actions) to learn more about Actions.

We can summarize this section into one sentence, **stop defining actions as classes**.

```ts{9-11, 14-17}:old.actions.ts
import { Action } from "@ngrx/store";

export enum CustomerPageActionTypes {
    CustomersLoaded = '[Customers Page] Customers Loaded',
    CustomerDetailLoaded = '[Customers Page] Customer Detail Opened'
}

// Action without payload
export class CustomersLoaded implements Action {
    readonly type = CustomerPageActionTypes.CustomersLoaded;
}

// Action with payload
export class CustomerDetailLoaded implements Action {
    readonly type = CustomerPageActionTypes.CustomerDetailLoaded;
    constructor(public payload: { customerId: string }) {}
}

export type CustomerPageActions = CustomersLoaded | CustomerDetailLoaded;
```

While it's still supported, NgRx has a more robust way to define actions.

Previously, the above snippet was the way to define actions in NgRx because it was the only way to keep reducers type-safe (more on this in [reducers](#reducers)).

In the newer version(s) of NgRx (v8+), we can now use the [`createAction` method](https://ngrx.io/api/store/createAction) to define actions.
This way is less error-prone, and is also automatically type-safe.

The equivalent of the above snippet can be refactored to the following actions.

```ts{4, 7-10}:improved.actions.ts
import { createAction, props } from "@ngrx/store";

// Action without props (payload)
export const customersLoaded = createAction("[Customers Page] Customers Loaded");

// Action with props (payload)
export const customerDetailLoaded = createAction(
    "[Customers Page] Customer Detail Opened",
    props<{ customerId: string }>()
);
```

Also, it's important to notice that we aren't required to define the `CustomerPageActions` union type anymore.

Since NgRx v14, it's possible to group actions that share the same source with [`createActionGroup`](https://ngrx.io/api/store/createActionGroup).
The only caveat is that you can't use your IDE refactoring tools to rename the action or to find all its occurrences, but on the other hand, this shouldn't be a problem.

We can detect where an action is dispatched by looking at its source, and renaming an action (event) should be a rare occasion - I would prefer to create a new action in this case because it mostly means that it's another unique event.

```ts{3-11}:improved.grouped-actions.ts
import { createActionGroup, emptyProps, props } from "@ngrx/store";

export const CustomerPageActions = createActionGroup({
    source: "Customers Page",
    events: {
      // Action without props
      CustomersLoaded: emptyProps(),
      // Action with props
      CustomerDetailOpened: props<{ customerId: string }>(),
    },
});
```

## Reducers

> You can take a look at the [documentation](https://ngrx.io/guide/store/reducers) to learn more about Reducers.

We've seen how to create actions, let's take a look at how these are consumed in reducers.

The reducer is a "simple" function that receives the current state, and the dispatched action.
Within the reducer, there's a switch statement to handle the proper state updates.

To make the reducer type safe the dispatched action needs to be annotated with the action union type.
When a reducer handles actions from different sources, all union types need to imported.

Within a case block, `action` has the correct type.

It's very important to add a default case to return the state as-is for the actions that aren't consumed by the reducer.
If you don't do this, the state is cleared (state will be `undefined`).

```ts{7-17}:old.reducer.ts
import { CustomerPageActions, CustomerPageActionTypes } from "./customer-page.actions";

const initialState = {
    customers: [],
    selectedCustomerId: null
};

export function customersReducer(state = initialState, action: CustomerPageActions) {
  switch (action.type) {
    case CustomerPageActionTypes.CustomersLoaded:
        return { ...state, customers: [] };
    case CustomerPageActionTypes.CustomerDetailLoaded:
        return { ...state, selectedCustomerId: action.payload.customerId };
    default:
      return state;
  }
}
```

In other words, to make the reducer type-safe we have to manually create additional types.

From NgRx v8, this isn't the case anymore.
There's a better way to define reducers compared to the reducer method, which is [`createReducer`](https://ngrx.io/api/store/createReducer).

Instead of the reducer method with switch cases, we now have:

- `createReducer` to replace the reducer method
- the `on` method to listen for one or multiple action(s), replacing a switch case

Again, the main benefit of this approach is that it's more robust and type-safe by default (without additional steps).

The refactored version using `createReducer` looks like this.

```ts{9-13}:improved.reducer.ts
import { createReducer, on } from "@ngrx/store";
import { customersLoaded, customerDetailLoaded } from "./customer-page.actions";

const initialState = {
    customers: [],
    selectedCustomerId: null
};

export const customersReducer = createReducer(
  initialState,
  on(customersLoaded, (state) => ({ ...state, customers: [] })),
  on(customerDetailLoaded, (state, action) => ({ ...state, selectedCustomerId: action.customerId  }))
);
```

The same reducer, but with actions created with `createActionGroup` uses the `CustomerPageActions` group instead of the loose actions.

```ts{9-13}:improved.reducer.ts
import { createReducer, on } from "@ngrx/store";
import { CustomerPageActions } from "./customer-page.actions";

const initialState = {
    customers: [],
    selectedCustomerId: null
};

export const customersReducer = createReducer(
    initialState,
    on(CustomerPageActions.CustomersLoaded, (state) => ({ ...state, customers: [] })),
    on(CustomerPageActions.CustomerDetailLoaded, (state, action) => ({ ...state, selectedCustomerId: action.customerId  }))
);
```

The only downside is that `createReducer` doesn't support a default case.

To take it a step further, we can use the [`createFeature` method](https://ngrx.io/api/store/createFeature), which is introduced in NgRx v12.1.
With it, the reducer is wrapped in a feature (more on this in [Registering the Store](#registering-the-store)).
But more important, a default set of selectors are generated based on the state properties.

```ts{9-16}:customer.feature.ts
import { createReducer, on, createFeature } from "@ngrx/store";
import { CustomerPageActions } from "./customer-page.actions";

const initialState = {
    customers: [],
    selectedCustomerId: null
};

const customersFeature = createFeature({
  name: "customers",
  reducer: createReducer(
      initialState,
      on(CustomerPageActions.CustomersLoaded, (state) => ({ ...state, customers: [] })),
      on(CustomerPageActions.CustomerDetailLoaded, (state, action) => ({ ...state, selectedCustomerId: action.customerId  }))
  ),
});

// Automatically generates the following selectors:
customersFeature.selectCustomersState
customersFeature.selectCustomers
customersFeature.selectSelectedCustomerId
```

## Selectors

> You can take a look at the [documentation](https://ngrx.io/guide/store/selectors) to learn more about Selectors.

Selectors remained the same throughout the NgRx versions, so there's not much to say about them.
The only tip that I want to mention is that some part of the state can be persisted in the URL and shouldn't be duplicated in the store.
Instead, you can make use of the selectors provided by [@ngrx/router-store](https://ngrx.io/guide/router-store).

## Registering the Store

Instead of creating a global application state, `AppState` in most cases, I prefer to not have a global state defined.
This has several benefits. The biggest one is that we can remove a layer of complexity, and keep all state levels equal.
Combining multiple slices of the state into a single object, being as a global state or feature state, is also a common source where things can get wrong (especially when using the older syntaxes we've covered above).

So why not avoid this complexity and keep things consistent?

To achieve this, register the global store in the root module, without providing a state.
Then, register each slice as a separate feature.

```ts{9, 11, 13}:app.module.ts
import { NgModule } from "@angular/core";
import { StoreModule } from "@ngrx/store";
import { customersReducer } from "./customers.reducer";
import { ordersFeature } from "./orders.feature";

@NgModule({
    imports: [
        // in NgRx 15 it isn't required to provide a state object
        StoreModule.forRoot(),
        // register the reducer
        StoreModule.forFeature("customers", customersReducer),
        // register the feature, this uses the feature name defined in createFeature
        StoreModule.forFeature(ordersFeature),
    ],
})
export class AppModule {}
```

We can then re-use the same pattern in the feature modules.

```ts{7}:feature.module.ts
import { NgModule } from "@angular/core";
import { StoreModule } from "@ngrx/store";
import { shipmentFeature } from "./shipment.feature";

@NgModule({
    imports: [
      StoreModule.forFeature(shipmentFeature)
    ],
})
export class FeatureModule {}
```

In NgRx v15, there's a new way to register the Store when you're using the [standalone components API](https://angular.io/guide/standalone-components).
With `provideStore` you can register the NgRx store (and register the root state), and with `provideState` you can provide feature states.

```ts{7-8}:main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideStore, provideState } from '@ngrx/store';
import { feature } from './feature.state';

bootstrapApplication(AppComponent, {
    providers: [
        provideStore(),
        provideState(feature)
    ];
})
```

And in a feature:

```ts{11}:feature.routes.ts
import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { FeatureComponent } from './feature.component';
import { feature } from './feature.state';

export const routes: Routes = [
    {
        path: '',
        component: FeatureComponent,
        providers: [
            provideState(feature)
        ],
    },
];
```

## Effects

> You can take a look at the [documentation](https://ngrx.io/guide/effects) to learn more about Effects.

Even if it's deprecated since NgRx v11, I still see projects that use the `@Effect` decorator.

> Heads-up: the `@Effect` decorator is going to be removed in NgRx v15.

```ts{8-12}:old.effects.ts
import { Injectable } from "@angular/core";
import { concatMap } from "rxjs";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { CustomerPageActionTypes, CustomersLoaded } from "./customer.actions";

@Injectable()
export class CustomerEffects {
  @Effect()
  customerss$ = this.actions$.pipe(
    ofType<CustomersLoaded>(CustomerPageActionTypes.CustomersLoaded),
    concatMap(() => ...)
  );

  constructor(private actions$: Actions<CustomerPageActionTypes>) {}
}
```

This code snippet has multiple shortcomings.
First, an Effect should always return an action, using `@Effect` doesn't make sure of this.
Second, to have an effect that knows the signature of the handled action, either the `Actions` needs to be typed by providing the action union generic, or the `ofType` operator needs to use a generic of the handled action.

But, of course, we can do better with the updated API.
The above code can be refactored to use the [`createEffect` method](https://ngrx.io/api/effects/createEffect).
This solves both shortcomings of `@Effect` as it ensures that the effect returns an action (instead of all types), and the action is also automatically typed.

```ts{8-16}:improved.effects.ts
import { Injectable } from "@angular/core";
import { concatMap } from "rxjs";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { CustomerPageActions } from "./customer.actions";

@Injectable()
export class CustomerEffects {
  customers$ = createEffect(() => {
    // we use a body instead of a one-liner
    // this makes it easier to find errors in the RxJS stream
    // https://ngrx.io/guide/eslint-plugin/rules/prefer-effect-callback-in-block-statement
    return this.actions$.pipe(
      ofType(CustomerPageActions.CustomersLoaded),
      concatMap(() => ...)
    );
  });

  constructor(private actions$: Actions) {}
}
```

Notice that we don't need to provide a type to the injected `Actions`, nor to `ofType` operator.

In NgRx v15, there's a new way to register your Effects when you're using the [standalone components API](https://angular.io/guide/standalone-components).
Instead of `EffectsModule.forRoot([])` and `EffectsModule.forFeature([])`, there is the new `provideEffects` method that can be used to register your root and feature effects.

```ts{7}:main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideStore, provideState } from '@ngrx/store';
import { AppEffects } from './app.effects';

bootstrapApplication(AppComponent, {
    providers: [
        provideEffects(AppEffects),
    ];
})
```

And in a feature:

```ts{11}:feature.routes.ts
import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { FeatureComponent } from './feature.component';
import { FeatureEffects } from './feature.effects';

export const routes: Routes = [
    {
        path: '',
        component: FeatureComponent,
        providers: [
            provideEffects(FeatureEffects),
        ],
    },
];
```

## Injecting the Store

To select a slice of the state, or to dispatch an action, the `Store` instance needs to be injected.
In contrast to the first NgRx versions, when it was required to provide a state generic to the `Store`, this has become optional in NgRx v9.

If you're using selectors (which you should be), adding a generic only raises confusion and thus is considered as a bad practice.
Instead, simply inject the `Store` without a generic.

By doing this, you won't lose the type-safety NgRx provides, as the selectors provide the type-safety that is needed.

```ts{12}:customer.component.ts
import { Component } from "@angular/core";
import { Store } from "@ngrx/store";
import { selectCustomers } from "./customer.selector";

@Component({
  selector: "app-customers",
  template: `...`,
})
export class CustomersComponent {
    customers$ = this.store.select(selectCustomers);

    constructor(private store: Store) {}
}
```

## Component Store

It's important to know that not everything needs to be in the global store.
Sometimes it's better to keep the state local to the component.
This is where the Component Store, [@ngrx/component-store](https://ngrx.io/guide/component-store), comes in.
For a comparison between the Component Store and the Global Store, and when to use which, take a look at the [documentation](https://ngrx.io/guide/component-store/comparison).

Since the introduction of component-store in NgRx v9.2 not a lot has changed about its API, but the existing API have had a couple of small improvements.

The biggest improvement in NgRx v15, is that selectors can easily be combined into a model.

```diff
- readonly vm$ = this.select(
-     this.customers$,
-     this.selectedCustomer$,
-     this.orders$,
-     (
-         customers,
-         selectedCustomer,
-         orders,
-     ) => ({
-         customers,
-         selectedCustomer,
-         orders,
-     }),
- );

+ readonly vm$ = this.select({
+   customers: this.customers$,
+   selectedCustomer: this.selectedCustomer$,
+   orders: this.orders$,
+ });
```
